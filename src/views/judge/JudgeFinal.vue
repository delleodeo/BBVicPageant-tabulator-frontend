<template>
  <JudgeLayout title="Final Round Scoring">
    <!-- Progress Panel -->
    <section class="panel panel-gold judge-progress-panel judge-progress-panel--final">
      <div class="section-head">
        <div>
          <h2>Top 5 Finalists</h2>
          <p class="section-subhead">Grade the official Top 5 finalists across {{ categories.length }} Final Round criteria</p>
        </div>
        <StatusBadge :label="round?.status || 'SETUP'" :tone="round?.status === 'LOCKED' ? 'success' : 'neutral'" />
      </div>

      <ProgressBar :value="progress" />
      <div class="progress-details-row">
        <span>Scoring Progress: <strong>{{ completeCount }} of {{ finalists.length }} Finalists Completed</strong></span>
        <span v-if="finalists.length && completeCount === finalists.length" class="all-done-tag">
          <AppIcon name="check" />
          All Finalists Graded
        </span>
      </div>
    </section>

    <LoadingState v-if="loading" label="finalists" />

    <section v-else-if="finalists.length > 0" class="card-grid">
      <ContestantCard
        v-for="finalist in finalists"
        :key="finalist._id"
        :contestant="finalist.contestantId"
        :to="`/judge/final/${finalist.contestantId._id}`"
      >
        <div class="judge-card-score">
          <div class="card-score-summary">
            <span class="score-ratio">R1: {{ roundOneTotal(finalist.contestantId._id) }}</span>
            <span v-if="getFinalScore(finalist.contestantId._id) !== null" class="score-val">
              Final: {{ getFinalScore(finalist.contestantId._id) }} pts
            </span>
          </div>
          <div class="final-score-pills">
            <span v-for="category in categories" :key="category.key" :class="{ complete: finalCategoryScored(finalist.contestantId._id, category.key) }">{{ category.label }}</span>
          </div>
        </div>

        <StatusBadge
          :label="scoreComplete(finalist.contestantId._id) ? 'COMPLETE' : 'PENDING'"
          :tone="scoreComplete(finalist.contestantId._id) ? 'success' : 'neutral'"
        />
      </ContestantCard>
    </section>

    <EmptyState
      v-else
      message="Final Round is not yet available. It will open automatically once Round 1 is locked by the Tabulation Committee."
    />
  </JudgeLayout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import AppIcon from '../../components/AppIcon.vue';
import ContestantCard from '../../components/ContestantCard.vue';
import EmptyState from '../../components/EmptyState.vue';
import LoadingState from '../../components/LoadingState.vue';
import ProgressBar from '../../components/ProgressBar.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import JudgeLayout from '../../layouts/JudgeLayout.vue';
import { api } from '../../services/api.js';
import { connectSocket } from '../../services/socket.js';
import { finalCategories, fmt } from '../../utils/score.js';

const loading = ref(true);
const round = ref(null);
const finalists = ref([]);
const scores = ref([]);
const roundOneRankings = ref([]);
const categories = ref(finalCategories.map((category) => ({ ...category })));

const completeCount = computed(() =>
  finalists.value.filter((f) => scoreComplete(f.contestantId?._id)).length
);

const progress = computed(() =>
  finalists.value.length ? Math.round((completeCount.value / finalists.value.length) * 100) : 0
);

function roundOneTotal(contestantId) {
  const result = roundOneRankings.value.find((entry) => String(entry.contestant._id) === String(contestantId));
  return fmt(result?.total);
}

function scoreComplete(contestantId) {
  const score = scores.value.find((entry) => String(entry.contestantId?._id || entry.contestantId) === String(contestantId));
  return categories.value.every((category) => score?.[category.key] !== undefined && score?.[category.key] !== null);
}

function finalCategoryScored(contestantId, key) {
  const score = scores.value.find((entry) => String(entry.contestantId?._id || entry.contestantId) === String(contestantId));
  return score?.[key] !== undefined && score?.[key] !== null;
}

function getFinalScore(contestantId) {
  const score = scores.value.find((entry) => String(entry.contestantId?._id || entry.contestantId) === String(contestantId));
  if (!score || !categories.value.every((category) => score[category.key] != null)) return null;
  const result = roundOneRankings.value.find((entry) => String(entry.contestant._id) === String(contestantId));
  const r1 = Number(result?.total || 0);
  const total = r1 * 0.2 + categories.value.reduce(
    (sum, category) => sum + Number(score[category.key]) * (category.weight / 10),
    0
  );
  return total.toFixed(1);
}

async function load() {
  const { data } = await api.get('/judge/final');
  round.value = data.round;
  finalists.value = data.finalists;
  scores.value = data.scores;
  roundOneRankings.value = data.roundOneRankings;
  categories.value = data.categories?.length ? data.categories : categories.value;
  loading.value = false;
}

onMounted(() => {
  connectSocket().on('criteria:updated', load);
  load();
});

onBeforeUnmount(() => {
  connectSocket().off('criteria:updated', load);
});
</script>

<style scoped>
.progress-details-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 0.5rem;
  font-size: 0.85rem;
}

.all-done-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--success);
  font-weight: 800;
}

.all-done-tag .app-icon {
  width: 1rem;
  height: 1rem;
}

.judge-card-score {
  flex: 1;
  min-width: 0;
}

.card-score-summary {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.45rem;
}

.score-ratio {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 700;
}

.score-val {
  font-size: 0.95rem;
  font-weight: 900;
  color: var(--gold-dark);
}

.final-score-pills {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.final-score-pills span {
  padding: 0.18rem 0.45rem;
  border-radius: var(--radius-full);
  background: var(--surface-hover);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 0.68rem;
  font-weight: 800;
}

.final-score-pills span.complete {
  background: var(--success-soft);
  border-color: rgba(16, 185, 129, 0.25);
  color: var(--success);
}

@media (min-width: 700px) {
  .progress-details-row {
    flex-direction: row;
    align-items: center;
  }
}
</style>
