<template>
  <JudgeLayout :title="category ? `${roundLabel}: ${category.label}` : `${roundLabel} Category`">
    <RouterLink class="btn btn-ghost btn-sm category-back-link" :to="homeDestination">
      <AppIcon name="arrowLeft" /> Back to Categories
    </RouterLink>

    <LoadingState v-if="loading" label="category scores" />
    <template v-else>
      <p v-if="error" class="error-text">{{ error }}</p>
      <EmptyState v-if="!category" message="This scoring category is not available." />

      <template v-else>
        <section class="panel panel-gold category-score-heading">
          <div class="category-heading-row">
            <div>
              <span class="eyebrow">{{ roundLabel }} Category</span>
              <h2>{{ category.label }}</h2>
              <p>Weight: {{ category.weight }}% <span aria-hidden="true">·</span> Score Range: {{ Number(category.minScore ?? 0).toFixed(1) }} – {{ Number(category.maxScore ?? 10).toFixed(1) }}</p>
            </div>
            <StatusBadge :label="isLocked ? 'SCORING LOCKED' : 'OPEN FOR SCORING'" :tone="isLocked ? 'neutral' : 'success'" />
          </div>
          <div class="category-scoring-progress">
            <strong>{{ progress.completed }} / {{ progress.total }} Candidates Scored</strong>
            <span>{{ progress.percent }}% Complete</span>
          </div>
          <ProgressBar :value="progress.percent" />
        </section>

        <p v-if="!isLocked" class="category-auto-save-hint">Enter a grade for each candidate and select Save Score. When every candidate is scored, you return to the categories.</p>

        <div v-if="isLocked" class="panel locked-message">
          <AppIcon name="lock" />
          <div>
            <strong>{{ lockedTitle }}</strong>
            <p>{{ lockedDescription }}</p>
          </div>
        </div>

        <ScoreSyncNotice :states="scoreSaveStates" />
        <div v-if="roster.length" class="contestant-search-bar">
          <AppIcon name="search" />
          <input
            v-model="searchQuery"
            type="search"
            aria-label="Search contestants by name or contestant number"
            placeholder="Search name or contestant number..."
          />
          <span>{{ filteredRoster.length }} / {{ roster.length }}</span>
        </div>
        <EmptyState v-if="!roster.length" :message="isFinal ? 'No finalists are available yet.' : 'No candidates are available yet.'" />
        <EmptyState v-else-if="!filteredRoster.length" message="No contestants match your search." />
        <section v-else class="category-candidate-grid" :aria-label="`${category.label} candidate scores`">
          <CategoryScoreCard
            v-for="candidate in filteredRoster"
            :key="candidate._id"
            :category="category"
            :candidate="candidate"
            :current-value="scoresByContestant[String(candidate._id)]?.[category.key]"
            :disabled="isLocked"
            :save-state="scoreSaveStates[String(candidate._id)]"
            @save="(categoryKey, value) => saveScore(candidate._id, categoryKey, value)"
            @focus="markActive(candidate)"
          />
        </section>

        <RouterLink class="btn btn-ghost category-return-link" :to="homeDestination">
          <AppIcon name="arrowLeft" /> Back to Categories
        </RouterLink>
      </template>
    </template>
    <Toast :message="message" />
  </JudgeLayout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '../../components/AppIcon.vue';
import CategoryScoreCard from '../../components/CategoryScoreCard.vue';
import EmptyState from '../../components/EmptyState.vue';
import LoadingState from '../../components/LoadingState.vue';
import ProgressBar from '../../components/ProgressBar.vue';
import ScoreSyncNotice from '../../components/ScoreSyncNotice.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import Toast from '../../components/Toast.vue';
import JudgeLayout from '../../layouts/JudgeLayout.vue';
import { api } from '../../services/api.js';
import { getPendingScores, saveScoreDurably, SCORE_OUTBOX_EVENT } from '../../services/scoreOutbox.js';
import { connectSocket } from '../../services/socket.js';
import { useAuthStore } from '../../stores/auth.js';
import { categoryScoreProgress, indexJudgeScores, scoreOwnerId } from '../../utils/judgeScoreProgress.js';

const props = defineProps({
  roundKind: { type: String, required: true }
});

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const loading = ref(true);
const error = ref('');
const message = ref('');
const searchQuery = ref('');
const round = ref(null);
const categories = ref([]);
const roster = ref([]);
const confirmedScoresByContestant = ref({});
const scoresByContestant = ref({});
const scoreSaveStates = ref({});
let messageTimer = null;
let loadVersion = 0;
let returnTimer = null;

const isFinal = computed(() => props.roundKind === 'FINAL');
const roundLabel = computed(() => isFinal.value ? 'Final Round' : 'Round 1');
const endpoint = computed(() => isFinal.value ? '/judge/final' : '/judge/round-one');
const homeDestination = computed(() => isFinal.value ? '/judge/final' : '/judge/round-one');
const category = computed(() => categories.value.find((item) => item.key === route.params.categoryId));
const isLocked = computed(() => round.value?.status !== 'OPEN' || category.value?.locked === true);
const lockedTitle = computed(() => {
  if (category.value?.locked === true) return `${category.value.label} Locked`;
  if (round.value?.status === 'LOCKED') return `${roundLabel.value} Scoring Locked`;
  return `${roundLabel.value} Not Open`;
});
const lockedDescription = computed(() => {
  if (category.value?.locked === true) return 'This category is read-only because it was locked by the Tabulation Committee.';
  if (round.value?.status === 'LOCKED') return 'Scores are read-only because this round has been locked.';
  return 'You can review the contestants here. Grading will be enabled when the Tabulation Committee opens this round.';
});
const progress = computed(() => category.value
  ? categoryScoreProgress(roster.value, confirmedScoresByContestant.value, category.value.key)
  : { completed: 0, total: roster.value.length, percent: 0 });
const filteredRoster = computed(() => {
  const query = searchQuery.value.trim().toLowerCase().replace(/^#\s*/, '');
  if (!query) return roster.value;
  return roster.value.filter((candidate) =>
    candidate.name?.toLowerCase().includes(query)
    || String(candidate.contestantNumber || '').toLowerCase().includes(query)
  );
});

function setSaveState(contestantId, state) {
  scoreSaveStates.value = { ...scoreSaveStates.value, [scoreOwnerId(contestantId)]: state };
}

function setScore(contestantId, categoryKey, value) {
  const id = scoreOwnerId(contestantId);
  scoresByContestant.value = {
    ...scoresByContestant.value,
    [id]: { ...(scoresByContestant.value[id] || {}), [categoryKey]: value }
  };
}

function setConfirmedScore(contestantId, categoryKey, value) {
  const id = scoreOwnerId(contestantId);
  confirmedScoresByContestant.value = {
    ...confirmedScoresByContestant.value,
    [id]: { ...(confirmedScoresByContestant.value[id] || {}), [categoryKey]: value }
  };
  setScore(id, categoryKey, value);
}

function recordConfirmedScore(contestantId, categoryKey, value) {
  const wasComplete = progress.value.total > 0 && progress.value.completed === progress.value.total;
  setConfirmedScore(contestantId, categoryKey, value);
  if (!wasComplete && progress.value.total > 0 && progress.value.completed === progress.value.total) {
    showMessage('Category complete. Returning to categories.');
    returnTimer = window.setTimeout(() => router.push(homeDestination.value), 650);
  }
}

function showError(value) {
  error.value = value;
}

function showMessage(value) {
  message.value = value;
  if (messageTimer) window.clearTimeout(messageTimer);
  messageTimer = window.setTimeout(() => (message.value = ''), 3500);
}

function applyPendingScores() {
  if (!auth.judge?.judgeId || !category.value) return;
  try {
    for (const candidate of roster.value) {
      const pending = getPendingScores({
        judgeId: auth.judge.judgeId,
        round: props.roundKind,
        contestantId: candidate._id
      }).find((entry) => entry.categoryKey === category.value.key);
      if (!pending) continue;
      setScore(candidate._id, category.value.key, pending.value);
      setSaveState(candidate._id, pending.retryable === false ? 'error' : 'queued');
    }
  } catch (storageError) {
    showError(storageError.message);
  }
}

async function load() {
  const thisLoad = ++loadVersion;
  loading.value = true;
  try {
    const { data } = await api.get(endpoint.value);
    if (thisLoad !== loadVersion) return;
    round.value = data.round;
    categories.value = data.categories || [];
    roster.value = isFinal.value
      ? (data.finalists || []).map((finalist) => finalist.contestantId).filter((candidate) => candidate?._id)
      : data.contestants || [];
    confirmedScoresByContestant.value = indexJudgeScores(data.scores || []);
    scoresByContestant.value = confirmedScoresByContestant.value;
    scoreSaveStates.value = {};
    error.value = '';
    applyPendingScores();
  } catch (loadError) {
    if (thisLoad === loadVersion) showError(loadError.response?.data?.message || 'Unable to load category scores.');
  } finally {
    if (thisLoad === loadVersion) loading.value = false;
  }
}

async function saveScore(contestantId, categoryKey, value) {
  if (isLocked.value) {
    showError('Scoring Locked');
    return;
  }

  const id = scoreOwnerId(contestantId);
  error.value = '';
  setSaveState(id, 'saving');

  try {
    const result = await saveScoreDurably({
      judgeId: auth.judge?.judgeId,
      round: props.roundKind,
      contestantId: id,
      categoryKey,
      value
    });

    if (result.status === 'saved') {
      recordConfirmedScore(id, categoryKey, result.score?.[categoryKey] ?? value);
      setSaveState(id, 'saved');
      showMessage('Score saved to the database.');
    } else if (result.status === 'queued') {
      if (result.entry) setScore(id, categoryKey, result.entry.value);
      setSaveState(id, 'queued');
      showMessage('Connection is slow or offline. Your score is saved on this device and will retry automatically.');
    } else if (result.status === 'error') {
      setSaveState(id, 'error');
      showError(`${result.error} The score remains saved on this device.`);
    }
  } catch (saveError) {
    setSaveState(id, 'error');
    showError(saveError.message || 'The score could not be stored safely. Please try again.');
  }
}

function handleScoreOutboxEvent(event) {
  const { state, entry, score: confirmedScore, error: syncError } = event.detail || {};
  if (state === 'changed') {
    void load();
    return;
  }
  if (!entry || String(entry.judgeId) !== String(auth.judge?.judgeId) ||
      entry.round !== props.roundKind || entry.categoryKey !== category.value?.key ||
      !roster.value.some((candidate) => scoreOwnerId(candidate._id) === scoreOwnerId(entry.contestantId))) return;

  const id = scoreOwnerId(entry.contestantId);
  if (state === 'saving') {
    setSaveState(id, 'saving');
  } else if (state === 'queued' || state === 'error') {
    setScore(id, entry.categoryKey, entry.value);
    setSaveState(id, state);
    if (syncError) showMessage(`${syncError} Your score remains saved on this device.`);
  } else if (state === 'saved') {
    recordConfirmedScore(id, entry.categoryKey, confirmedScore?.[entry.categoryKey] ?? entry.value);
    setSaveState(id, 'saved');
    error.value = '';
    showMessage('Score saved to the database.');
  }
}

function markActive(candidate) {
  connectSocket().emit('judge:activity', {
    contestantId: candidate._id,
    contestantNumber: candidate.contestantNumber,
    round: props.roundKind
  });
}

watch(() => [props.roundKind, route.params.categoryId], () => {
  searchQuery.value = '';
  void load();
}, { immediate: true });

onMounted(() => {
  const socket = connectSocket();
  for (const event of ['round:opened', 'round:locked', 'round:unlocked', 'finalists:generated', 'criteria:updated', 'scores:reset']) {
    socket.on(event, load);
  }
  window.addEventListener(SCORE_OUTBOX_EVENT, handleScoreOutboxEvent);
});

onBeforeUnmount(() => {
  loadVersion += 1;
  const socket = connectSocket();
  for (const event of ['round:opened', 'round:locked', 'round:unlocked', 'finalists:generated', 'criteria:updated', 'scores:reset']) {
    socket.off(event, load);
  }
  socket.emit('judge:activity', { contestantId: null, round: null });
  window.removeEventListener(SCORE_OUTBOX_EVENT, handleScoreOutboxEvent);
  if (messageTimer) window.clearTimeout(messageTimer);
  if (returnTimer) window.clearTimeout(returnTimer);
});
</script>

<style scoped>
.category-auto-save-hint {
  margin: -0.25rem 0 1rem;
  color: var(--text-muted);
  font-size: 0.8rem;
}
.category-back-link {
  margin-bottom: 1rem;
}

.category-score-heading {
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.category-heading-row,
.category-scoring-progress {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.category-heading-row h2 {
  font-size: clamp(1.3rem, 5vw, 1.7rem);
}

.category-heading-row p,
.category-scoring-progress span {
  color: var(--text-muted);
  font-size: 0.82rem;
}

.category-scoring-progress {
  margin-top: 1rem;
  align-items: baseline;
  font-size: 0.86rem;
}

.category-score-heading :deep(.progress-wrap) {
  margin-top: 0.55rem;
}

.category-candidate-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: 1rem;
}

.category-candidate-grid :deep(.score-card) {
  min-width: 0;
}

.contestant-search-bar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.contestant-search-bar > .app-icon {
  position: absolute;
  left: 0.9rem;
  width: 1rem;
  height: 1rem;
  color: var(--text-muted);
  pointer-events: none;
}

.contestant-search-bar input {
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
  padding-left: 2.5rem;
  border-color: var(--border-gold);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--gold) 5%, var(--surface)), var(--surface));
}

.contestant-search-bar > span {
  flex: 0 0 auto;
  min-width: 54px;
  padding: 0.48rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-hover);
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 800;
  text-align: center;
}

.category-return-link {
  margin-top: 1.25rem;
}

.locked-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.locked-message :deep(.app-icon) {
  width: 1.35rem;
  height: 1.35rem;
  color: var(--gold-dark);
}

.locked-message p {
  color: var(--text-muted);
  font-size: 0.82rem;
}

@media (max-width: 640px) {
  .category-candidate-grid {
    grid-template-columns: 1fr;
  }

  .category-score-heading {
    padding: 1rem;
  }
}
</style>
