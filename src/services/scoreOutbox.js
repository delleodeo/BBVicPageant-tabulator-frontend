import { api } from './api.js';

const STORAGE_KEY = 'pageant_score_outbox_v1';
const REQUEST_TIMEOUT_MS = 30000;
const RETRY_INTERVAL_MS = 15000;
const MAX_RETRY_DELAY_MS = 60000;

export const SCORE_OUTBOX_EVENT = 'pageant:score-outbox';

const inFlight = new Map();
let syncStarted = false;

function readOutbox() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const entries = JSON.parse(raw);
    if (!Array.isArray(entries)) throw new Error('Score outbox is not an array.');
    return entries;
  } catch {
    throw new Error('Pending scores could not be read from this device. Please keep this page open and contact the tabulator.');
  }
}

function writeOutbox(entries) {
  try {
    if (entries.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    throw new Error('This device could not store the score locally. Free some browser storage and try again.');
  }
}

function dispatchOutboxEvent(state, entry, extra = {}) {
  window.dispatchEvent(new CustomEvent(SCORE_OUTBOX_EVENT, {
    detail: { state, entry, ...extra }
  }));
}

function entryKey({ judgeId, round, contestantId, categoryKey }) {
  return [judgeId, round, contestantId, categoryKey].map(String).join(':');
}

function newVersion() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function activeJudgeId() {
  try {
    return JSON.parse(localStorage.getItem('judge') || 'null')?.judgeId || null;
  } catch {
    return null;
  }
}

function endpointFor(round) {
  if (round === 'ROUND_1') return '/judge/round-one/scores';
  if (round === 'FINAL') return '/judge/final/scores';
  throw new Error(`Unsupported scoring round: ${round}`);
}

function errorMessage(error) {
  if (!error.response) return 'Connection unavailable. Retrying automatically.';
  return error.response.data?.message || 'The server could not save this score.';
}

function retryableError(error) {
  const status = error.response?.status;
  return !status || status === 408 || status === 425 || status === 429 || status >= 500;
}

function updateEntryAfterFailure(sentEntry, error) {
  const entries = readOutbox();
  const index = entries.findIndex((entry) => entry.key === sentEntry.key);
  if (index < 0 || entries[index].version !== sentEntry.version) return entries[index] || null;

  const attempts = (sentEntry.attempts || 0) + 1;
  const retryable = retryableError(error);
  const retryDelay = Math.min(2000 * (2 ** Math.min(attempts - 1, 5)), MAX_RETRY_DELAY_MS);
  entries[index] = {
    ...sentEntry,
    attempts,
    retryable,
    lastAttemptAt: Date.now(),
    nextAttemptAt: retryable ? Date.now() + retryDelay : null,
    lastError: errorMessage(error)
  };
  writeOutbox(entries);
  return entries[index];
}

function removeConfirmedEntry(sentEntry) {
  const entries = readOutbox();
  const current = entries.find((entry) => entry.key === sentEntry.key);

  // A newer value was queued while this request was in flight. Keep the newer
  // value in local storage and let the next sync send it.
  if (current?.version !== sentEntry.version) return current || null;

  writeOutbox(entries.filter((entry) => entry.key !== sentEntry.key));
  return null;
}

export function getPendingScores({ judgeId, round, contestantId }) {
  return readOutbox().filter(
    (entry) => String(entry.judgeId) === String(judgeId)
      && entry.round === round
      && String(entry.contestantId) === String(contestantId)
  );
}

export function queueScore({ judgeId, round, contestantId, categoryKey, value }) {
  if (!judgeId || !contestantId || !categoryKey) {
    throw new Error('The score could not be linked to the current judge and contestant.');
  }

  const key = entryKey({ judgeId, round, contestantId, categoryKey });
  const entries = readOutbox();
  const index = entries.findIndex((entry) => entry.key === key);
  const now = Date.now();
  const entry = {
    key,
    version: newVersion(),
    judgeId: String(judgeId),
    round,
    contestantId: String(contestantId),
    categoryKey,
    value: Number(value),
    queuedAt: index >= 0 ? entries[index].queuedAt : now,
    updatedAt: now,
    attempts: 0,
    retryable: true,
    nextAttemptAt: now,
    lastError: ''
  };

  if (index >= 0) entries[index] = entry;
  else entries.push(entry);
  writeOutbox(entries);
  dispatchOutboxEvent('queued', entry);
  return entry;
}

export async function syncScoreEntry(key) {
  if (inFlight.has(key)) return inFlight.get(key);

  const request = (async () => {
    const sentEntry = readOutbox().find((entry) => entry.key === key);
    if (!sentEntry) return { status: 'missing' };
    if (String(sentEntry.judgeId) !== String(activeJudgeId())) return { status: 'different-judge', entry: sentEntry };

    dispatchOutboxEvent('saving', sentEntry);

    try {
      const response = await api.post(
        endpointFor(sentEntry.round),
        { contestantId: sentEntry.contestantId, [sentEntry.categoryKey]: sentEntry.value },
        { timeout: REQUEST_TIMEOUT_MS }
      );
      const newerEntry = removeConfirmedEntry(sentEntry);

      if (newerEntry) {
        dispatchOutboxEvent('queued', newerEntry);
        return { status: 'queued', entry: newerEntry, score: response.data.score, superseded: true };
      }

      dispatchOutboxEvent('saved', sentEntry, { score: response.data.score });
      return { status: 'saved', entry: sentEntry, score: response.data.score };
    } catch (error) {
      const pendingEntry = updateEntryAfterFailure(sentEntry, error);
      if (!pendingEntry) return { status: 'superseded' };

      const superseded = pendingEntry.version !== sentEntry.version;
      const status = pendingEntry.retryable ? 'queued' : 'error';
      dispatchOutboxEvent(status, pendingEntry, { error: pendingEntry.lastError });
      return { status, entry: pendingEntry, error: pendingEntry.lastError, superseded };
    }
  })();

  inFlight.set(key, request);
  let result;
  try {
    result = await request;
    return result;
  } finally {
    inFlight.delete(key);
    if (result?.superseded && navigator.onLine) {
      queueMicrotask(() => syncScoreEntry(key));
    }
  }
}

export async function saveScoreDurably(input) {
  const entry = queueScore(input);
  if (!navigator.onLine) return { status: 'queued', entry };
  return syncScoreEntry(entry.key);
}

export async function flushScoreOutbox({ force = false } = {}) {
  const judgeId = activeJudgeId();
  if (!judgeId || (!navigator.onLine && !force)) return [];

  const now = Date.now();
  const pending = readOutbox().filter(
    (entry) => String(entry.judgeId) === String(judgeId)
      && (force || (entry.retryable !== false && (!entry.nextAttemptAt || entry.nextAttemptAt <= now)))
  );

  return Promise.all(pending.map((entry) => syncScoreEntry(entry.key)));
}

export function startScoreOutboxSync() {
  if (syncStarted) return;
  syncStarted = true;

  window.addEventListener('online', () => {
    void flushScoreOutbox({ force: true }).catch(() => {});
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    dispatchOutboxEvent('changed', null);
    if (navigator.onLine) void flushScoreOutbox().catch(() => {});
  });

  window.setInterval(() => {
    void flushScoreOutbox().catch(() => {});
  }, RETRY_INTERVAL_MS);

  void flushScoreOutbox().catch(() => {});
}
