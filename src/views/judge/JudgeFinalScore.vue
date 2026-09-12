<template>
  <JudgeLayout :title="finalist ? `#${finalist.contestantId.contestantNumber} ${finalist.contestantId.name}` : 'Final Score'">
    <!-- Top Action Bar -->
    <div class="judge-scoring-topbar final-nav-bar">
      <RouterLink class="btn btn-ghost btn-sm nav-back-btn" to="/judge/final">
        <AppIcon name="arrowLeft" />
        Finalists
      </RouterLink>

      <div class="top-nav-steppers">
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          :disabled="!prevFinalist"
          @click="navigateFinalist(prevFinalist)"
        >
          <AppIcon name="arrowLeft" />
          #{{ prevFinalist?.contestantId?.contestantNumber || '-' }}
        </button>

        <button
          type="button"
          class="btn btn-ghost btn-sm"
          @click="showBioModal = true"
        >
          <AppIcon name="user" />
          Bio
        </button>

        <button
          type="button"
          class="btn btn-ghost btn-sm"
          :disabled="!nextFinalist"
          @click="navigateFinalist(nextFinalist)"
        >
          #{{ nextFinalist?.contestantId?.contestantNumber || '-' }}
          <AppIcon name="arrowRight" />
        </button>
      </div>
    </div>

    <LoadingState v-if="loading" label="finalist" />

    <template v-else>
      <!-- Finalist Header Banner -->
      <section class="panel panel-gold candidate-scoring-header final-scoring-header">
        <div class="candidate-header-left">
          <div class="header-photo-wrap" @click="showBioModal = true">
            <img v-if="finalist.contestantId.photo" :src="mediaUrl(finalist.contestantId.photo)" :alt="finalist.contestantId.name" />
            <div v-else class="header-photo-fallback">
              {{ finalist.contestantId.name.slice(0, 2).toUpperCase() }}
            </div>
          </div>

          <div class="candidate-copy">
            <div class="finalist-kicker-row">
              <span class="finalist-rank-chip">
                <AppIcon name="finalists" />
                Finalist Candidate
              </span>
              <span class="candidate-number-chip">#{{ finalist.contestantId.contestantNumber }}</span>
            </div>
            <h2>{{ finalist.contestantId.name }}</h2>
            <p v-if="finalist.contestantId.hometown" class="c-hometown">
              <AppIcon name="mapPin" />
              {{ finalist.contestantId.hometown }}
            </p>
            <div class="final-score-metrics">
              <div>
                <span>Round 1 Total</span>
                <strong>{{ fmt(roundOne?.total) }}</strong>
                <small>Raw score</small>
              </div>
              <div>
                <span>Carry-over</span>
                <strong>{{ roundOneCarryOver }}</strong>
                <small>20% weighted</small>
              </div>
            </div>
          </div>
        </div>

        <div class="total-score-card final-total-card">
          <span class="total-label">Final Projected Score</span>
          <div class="total-number-display">
            <span class="score-bold">{{ totalCalculatedFinalScore }}</span>
            <span class="score-max">/ 100</span>
          </div>
          <div class="final-score-breakdown">
            <span>R1 20%</span>
            <span v-for="category in categories" :key="category.key">{{ category.label }} {{ category.weight }}%</span>
          </div>
          <div class="completion-pill" :class="{ complete: isAllScored }">
            <AppIcon v-if="isAllScored" name="check" />
            {{ isAllScored ? 'Final scores complete' : 'Pending ratings' }}
          </div>
        </div>
      </section>

      <section class="score-progress-strip" aria-label="Final scoring progress">
        <div
          v-for="category in categories"
          :key="category.key"
          class="score-progress-chip"
          :class="{ complete: categoryScored(category.key) }"
        >
          <AppIcon :name="categoryScored(category.key) ? 'check' : 'scoreSheet'" />
          <span>{{ category.label }}</span>
        </div>
      </section>

      <ScoreSyncNotice :states="scoreSaveStates" />

      <!-- Category Scoring Cards Grid -->
      <section class="score-grid">
        <CategoryScoreCard
          v-for="category in categories"
          :key="category.key"
          :category="category"
          :current-value="score?.[category.key]"
          :disabled="round?.status !== 'OPEN'"
          :save-state="scoreSaveStates[category.key]"
          @save="save"
          @invalid="showError"
        />
      </section>

      <!-- Judge Notes for Final Round -->
      <section class="panel judge-notes-panel">
        <div class="section-head">
          <div>
            <h3>Judge's Final Q&A & Stage Notes</h3>
            <p class="section-subhead">Record speech clarity, articulation, composure, and charisma.</p>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" :disabled="savingNote" @click="saveNote">
            <AppIcon :name="noteSaved ? 'check' : 'document'" />
            {{ savingNote ? 'Saving...' : noteSaved ? 'Saved' : 'Save Notes' }}
          </button>
        </div>
        <textarea
          v-model="judgeNote"
          rows="3"
          placeholder="Private notes for final question and stage presence..."
          @blur="saveNote"
        ></textarea>
      </section>

      <!-- Navigation Footer -->
      <section class="panel scoring-footer-nav">
        <div class="button-row">
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="!prevFinalist"
            @click="navigateFinalist(prevFinalist)"
          >
            <AppIcon name="arrowLeft" />
            Previous Finalist
          </button>

          <RouterLink class="btn btn-ghost" to="/judge/final">
            View All Finalists
          </RouterLink>

          <button
            type="button"
            class="btn btn-gold"
            :disabled="!nextFinalist"
            @click="navigateFinalist(nextFinalist)"
          >
            Next Finalist
            <AppIcon name="arrowRight" />
          </button>
        </div>
      </section>

      <Toast :message="message" />
      <p v-if="error" class="error-text">{{ error }}</p>

      <!-- Bio Modal -->
      <ContestantBioModal
        :open="showBioModal"
        :contestant="finalist.contestantId"
        @close="showBioModal = false"
      />
    </template>
  </JudgeLayout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CategoryScoreCard from '../../components/CategoryScoreCard.vue';
import ContestantBioModal from '../../components/ContestantBioModal.vue';
import AppIcon from '../../components/AppIcon.vue';
import LoadingState from '../../components/LoadingState.vue';
import ScoreSyncNotice from '../../components/ScoreSyncNotice.vue';
import Toast from '../../components/Toast.vue';
import JudgeLayout from '../../layouts/JudgeLayout.vue';
import { api, mediaUrl } from '../../services/api.js';
import {
  getPendingScores,
  saveScoreDurably,
  SCORE_OUTBOX_EVENT
} from '../../services/scoreOutbox.js';
import { connectSocket } from '../../services/socket.js';
import { useAuthStore } from '../../stores/auth.js';
import { fmt } from '../../utils/score.js';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const loading = ref(true);
const finalist = ref(null);
const allFinalists = ref([]);
const roundOne = ref(null);
const round = ref(null);
const score = ref(null);
const categories = ref([]);
const judgeNote = ref('');
const savingNote = ref(false);
const noteSaved = ref(false);
const message = ref('');
const error = ref('');
const showBioModal = ref(false);
const scoreSaveStates = ref({});
let messageTimer = null;

const isAllScored = computed(() => {
  return categories.value.length > 0 && categories.value.every((category) => score.value?.[category.key] != null);
});

const roundOneCarryOver = computed(() => `${((Number(roundOne.value?.total) || 0) * 0.2).toFixed(2)} pts`);

function categoryScored(categoryKey) {
  return score.value?.[categoryKey] !== undefined && score.value?.[categoryKey] !== null;
}

const totalCalculatedFinalScore = computed(() => {
  const r1 = Number(roundOne.value?.total || 0);
  if (!categories.value.length || !categories.value.every((category) => score.value?.[category.key] != null && Number.isFinite(Number(score.value[category.key])))) {
    return '0.00';
  }

  const total = r1 * 0.2 + categories.value.reduce(
    (sum, category) => sum + Number(score.value[category.key]) * (category.weight / 10),
    0
  );
  return total.toFixed(2);
});

const currentFinalistIndex = computed(() => {
  return allFinalists.value.findIndex(
    (f) => String(f.contestantId?._id) === String(route.params.contestantId)
  );
});

const prevFinalist = computed(() => {
  const idx = currentFinalistIndex.value;
  return idx > 0 ? allFinalists.value[idx - 1] : null;
});

const nextFinalist = computed(() => {
  const idx = currentFinalistIndex.value;
  return idx >= 0 && idx < allFinalists.value.length - 1 ? allFinalists.value[idx + 1] : null;
});

async function load() {
  loading.value = true;
  const [res, allRes, noteRes] = await Promise.all([
    api.get(`/judge/final/${route.params.contestantId}`),
    api.get('/judge/final'),
    api.get(`/judge/notes/FINAL/${route.params.contestantId}`).catch(() => ({ data: { note: '' } }))
  ]);

  finalist.value = res.data.finalist;
  roundOne.value = res.data.roundOne;
  round.value = res.data.round;
  score.value = res.data.score;
  scoreSaveStates.value = {};
  categories.value = res.data.categories;
  allFinalists.value = allRes.data.finalists || [];
  judgeNote.value = noteRes.data?.note || '';
  applyPendingScores();
  loading.value = false;

  const socket = connectSocket();
  socket.emit('judge:activity', {
    contestantId: finalist.value?.contestantId?._id,
    contestantNumber: finalist.value?.contestantId?.contestantNumber,
    round: 'FINAL'
  });
}

function navigateFinalist(target) {
  if (target?.contestantId?._id) {
    router.push(`/judge/final/${target.contestantId._id}`);
  }
}

watch(
  () => route.params.contestantId,
  () => {
    load();
  }
);

function showError(value) {
  error.value = value;
}

function setSaveState(categoryKey, state) {
  scoreSaveStates.value = { ...scoreSaveStates.value, [categoryKey]: state };
}

function showMessage(value) {
  message.value = value;
  if (messageTimer) window.clearTimeout(messageTimer);
  messageTimer = window.setTimeout(() => (message.value = ''), 3000);
}

function currentContestantId() {
  return finalist.value?.contestantId?._id;
}

function entryMatchesCurrentScore(entry) {
  return entry
    && String(entry.judgeId) === String(auth.judge?.judgeId)
    && entry.round === 'FINAL'
    && String(entry.contestantId) === String(currentContestantId());
}

function applyPendingScores() {
  if (!currentContestantId() || !auth.judge?.judgeId) return;

  try {
    const pending = getPendingScores({
      judgeId: auth.judge.judgeId,
      round: 'FINAL',
      contestantId: currentContestantId()
    });
    const pendingKeys = new Set(pending.map((entry) => entry.categoryKey));
    const nextStates = { ...scoreSaveStates.value };

    for (const [categoryKey, state] of Object.entries(nextStates)) {
      if (['saving', 'queued', 'error'].includes(state) && !pendingKeys.has(categoryKey)) {
        nextStates[categoryKey] = 'saved';
      }
    }

    const localScore = { ...(score.value || {}) };
    for (const entry of pending) {
      localScore[entry.categoryKey] = entry.value;
      if (nextStates[entry.categoryKey] !== 'saving') {
        nextStates[entry.categoryKey] = entry.retryable === false ? 'error' : 'queued';
      }
    }

    score.value = localScore;
    scoreSaveStates.value = nextStates;
  } catch (storageError) {
    error.value = storageError.message;
  }
}

function handleScoreOutboxEvent(event) {
  const { state, entry, score: confirmedScore, error: syncError } = event.detail || {};
  if (state === 'changed') {
    applyPendingScores();
    return;
  }
  if (!entryMatchesCurrentScore(entry)) return;

  if (state === 'saving') {
    setSaveState(entry.categoryKey, 'saving');
    return;
  }

  if (state === 'queued' || state === 'error') {
    score.value = { ...(score.value || {}), [entry.categoryKey]: entry.value };
    setSaveState(entry.categoryKey, state);
    if (syncError) {
      const prefix = state === 'queued' ? 'Connection is slow. ' : '';
      showMessage(`${prefix}${syncError} Your score remains saved on this device.`);
    }
    return;
  }

  if (state === 'saved') {
    score.value = { ...(score.value || {}), ...(confirmedScore || {}) };
    setSaveState(entry.categoryKey, 'saved');
    applyPendingScores();
    error.value = '';
    const label = categories.value.find((category) => category.key === entry.categoryKey)?.label || entry.categoryKey;
    showMessage(`${label} score saved to the database.`);
  }
}

async function save(categoryKey, value) {
  error.value = '';
  score.value = { ...(score.value || {}), [categoryKey]: value };
  setSaveState(categoryKey, 'saving');

  try {
    const result = await saveScoreDurably({
      judgeId: auth.judge?.judgeId,
      round: 'FINAL',
      contestantId: currentContestantId(),
      categoryKey,
      value
    });

    if (result.status === 'queued') {
      setSaveState(categoryKey, 'queued');
      showMessage('Connection is slow or offline. Your score is saved on this device and will retry automatically.');
    } else if (result.status === 'error') {
      setSaveState(categoryKey, 'error');
      error.value = `${result.error} The score remains saved on this device.`;
    }
  } catch (saveError) {
    setSaveState(categoryKey, 'error');
    error.value = saveError.message || 'The score could not be stored safely. Please try again.';
  }
}

async function saveNote() {
  if (!finalist.value?.contestantId?._id) return;
  savingNote.value = true;
  try {
    await api.post('/judge/notes', {
      contestantId: finalist.value.contestantId._id,
      round: 'FINAL',
      note: judgeNote.value
    });
    noteSaved.value = true;
    setTimeout(() => (noteSaved.value = false), 2500);
  } finally {
    savingNote.value = false;
  }
}

onMounted(() => {
  window.addEventListener(SCORE_OUTBOX_EVENT, handleScoreOutboxEvent);
  connectSocket().on('criteria:updated', load);
  load();
});

onBeforeUnmount(() => {
  window.removeEventListener(SCORE_OUTBOX_EVENT, handleScoreOutboxEvent);
  if (messageTimer) window.clearTimeout(messageTimer);
  const socket = connectSocket();
  socket.off('criteria:updated', load);
  socket.emit('judge:activity', {
    contestantId: null,
    round: null
  });
});
</script>

<style scoped>
.judge-scoring-topbar {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: stretch;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.final-nav-bar {
  position: relative;
  z-index: 2;
}

.nav-back-btn {
  min-width: 0;
  padding-inline: 0.75rem;
}

.top-nav-steppers {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

.top-nav-steppers .btn {
  min-width: 0;
  padding-inline: 0.55rem;
}

.candidate-scoring-header {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 1rem;
  border-radius: var(--radius-md);
}

.final-scoring-header {
  gap: 0.9rem;
  padding: 0.9rem;
  overflow: hidden;
  border-color: rgba(201, 154, 46, 0.45);
  background:
    linear-gradient(135deg, rgba(201, 154, 46, 0.12), transparent 38%),
    linear-gradient(180deg, var(--surface) 0%, var(--surface-hover) 100%);
}

.candidate-header-left {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.85rem;
}

.header-photo-wrap {
  width: 68px;
  height: 84px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 2px solid var(--gold);
  background: var(--navy-dark);
  cursor: pointer;
  box-shadow: var(--shadow-md);
}

.header-photo-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.header-photo-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--gold-light);
  font-weight: 900;
  font-size: 1.4rem;
}

.candidate-copy {
  min-width: 0;
}

.finalist-kicker-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}

.finalist-rank-chip,
.candidate-number-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  min-height: 1.7rem;
  padding: 0.25rem 0.55rem;
  border-radius: var(--radius-full);
  font-size: 0.68rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.finalist-rank-chip {
  color: var(--gold-dark);
  background: var(--gold-soft);
  border: 1px solid var(--border-gold);
}

[data-theme='dark'] .finalist-rank-chip {
  color: var(--gold-light);
  background: rgba(201, 154, 46, 0.13);
}

.finalist-rank-chip .app-icon {
  width: 0.9rem;
  height: 0.9rem;
}

.candidate-number-chip {
  color: var(--text-main);
  background: var(--surface);
  border: 1px solid var(--border);
}

.candidate-copy h2 {
  margin-top: 0.45rem;
  font-size: clamp(1.25rem, 5.8vw, 2rem);
  line-height: 1.08;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.c-hometown {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.2rem;
  font-size: 0.82rem;
  color: var(--gold-dark);
  font-weight: 700;
}

.c-hometown .app-icon {
  width: 1rem;
  height: 1rem;
}

.final-score-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  width: 100%;
  max-width: 21rem;
  margin-top: 0.75rem;
}

.final-score-metrics div {
  min-width: 0;
  padding: 0.55rem 0.65rem;
  border-radius: var(--radius-md);
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}

.final-score-metrics span,
.final-score-metrics small {
  display: block;
}

.final-score-metrics span {
  color: var(--text-muted);
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.final-score-metrics strong {
  display: block;
  margin-top: 0.12rem;
  color: var(--text-main);
  font-size: 1rem;
  font-weight: 900;
}

.final-score-metrics small {
  margin-top: 0.05rem;
  color: var(--gold-dark);
  font-size: 0.68rem;
  font-weight: 700;
}

.total-score-card {
  background: var(--surface);
  border: 1px solid var(--border-gold);
  border-radius: var(--radius-md);
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  box-shadow: var(--shadow-sm);
}

.final-total-card {
  align-items: stretch;
  gap: 0.55rem;
  padding: 0.85rem;
  background:
    linear-gradient(180deg, rgba(201, 154, 46, 0.08), transparent),
    var(--surface);
}

.total-label {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--text-muted);
  text-align: center;
  letter-spacing: 0.04em;
}

.total-number-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.35rem;
}

.score-bold {
  font-size: clamp(2rem, 11vw, 2.65rem);
  font-weight: 900;
  color: var(--gold-dark);
  line-height: 1;
}

.score-max {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted);
}

.final-score-breakdown {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(74px, 1fr));
  gap: 0.35rem;
}

.final-score-breakdown span {
  min-width: 0;
  padding: 0.3rem 0.35rem;
  border-radius: var(--radius-sm);
  background: var(--surface-hover);
  color: var(--text-muted);
  text-align: center;
  font-size: 0.65rem;
  font-weight: 800;
  white-space: nowrap;
}

.completion-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  max-width: 100%;
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--text-muted);
  background: var(--surface-hover);
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-full);
}

.completion-pill .app-icon {
  width: 0.95rem;
  height: 0.95rem;
}

.completion-pill.complete {
  background: var(--success-soft);
  color: var(--success);
}

.score-progress-strip {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.score-progress-chip {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 40px;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 0.76rem;
  font-weight: 800;
}

.score-progress-chip .app-icon {
  width: 1rem;
  height: 1rem;
  flex: 0 0 1rem;
}

.score-progress-chip.complete {
  border-color: rgba(16, 185, 129, 0.25);
  background: var(--success-soft);
  color: var(--success);
}

.judge-notes-panel textarea {
  resize: vertical;
  min-height: 80px;
}

.scoring-footer-nav {
  margin-top: 1rem;
}

.scoring-footer-nav .button-row {
  display: grid;
  grid-template-columns: 1fr;
  justify-content: stretch;
}

@media (min-width: 720px) {
  .judge-scoring-topbar {
    grid-template-columns: auto auto;
    justify-content: space-between;
  }

  .top-nav-steppers {
    align-items: center;
  }

  .candidate-scoring-header {
    grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
    align-items: center;
    padding: 1rem;
  }

  .final-scoring-header {
    gap: 1rem;
  }

  .score-progress-strip {
    grid-template-columns: repeat(2, 1fr);
  }

  .scoring-footer-nav .button-row {
    display: flex;
    justify-content: space-between;
  }
}

@media (min-width: 980px) {
  .candidate-scoring-header {
    padding: 1.25rem;
  }

  .header-photo-wrap {
    width: 78px;
    height: 96px;
  }
}

@media (max-width: 380px) {
  .judge-scoring-topbar {
    grid-template-columns: 1fr;
  }

  .candidate-header-left {
    grid-template-columns: 1fr;
  }

  .header-photo-wrap {
    width: 76px;
    height: 92px;
  }

  .final-score-metrics {
    max-width: none;
  }
}
</style>
