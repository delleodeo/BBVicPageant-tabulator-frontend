<template>
  <JudgeLayout title="Round 1 Scoring">
    <section class="panel panel-gold judge-progress-panel judge-progress-panel--round-one">
      <div class="section-head">
        <div>
          <h2>Round 1 Categories</h2>
          <p class="section-subhead">Select a category to grade every official contestant in that category.</p>
        </div>
        <StatusBadge :label="round?.status || 'SETUP'" :tone="round?.status === 'OPEN' ? 'success' : 'neutral'" />
      </div>

      <ProgressBar :value="overallProgress.percent" />
      <div class="progress-details-row">
        <span>Scores Recorded: <strong>{{ overallProgress.completed }} of {{ overallProgress.total }}</strong> ({{ overallProgress.percent }}%)</span>
        <span v-if="overallProgress.total > 0 && overallProgress.completed === overallProgress.total" class="all-done-tag">
          <AppIcon name="check" />
          All Categories Graded
        </span>
      </div>
    </section>

    <LoadingState v-if="loading" label="scoring categories" />
    <p v-else-if="error" class="error-text">{{ error }}</p>
    <EmptyState v-else-if="!contestants.length" message="No candidates are available yet." />
    <EmptyState v-else-if="!categories.length" message="No Round 1 scoring categories are configured." />

    <section v-else class="category-grid" aria-label="Round 1 scoring categories">
      <JudgeCategoryCard
        v-for="category in categories"
        :key="category.key"
        :category="category"
        :progress="categoryProgress(category.key)"
        :available="contestants.length > 0"
        :locked="round?.status !== 'OPEN' || category.locked === true"
        @open="openCategory(category.key)"
      />
    </section>
  </JudgeLayout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppIcon from '../../components/AppIcon.vue';
import EmptyState from '../../components/EmptyState.vue';
import JudgeCategoryCard from '../../components/JudgeCategoryCard.vue';
import LoadingState from '../../components/LoadingState.vue';
import ProgressBar from '../../components/ProgressBar.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import JudgeLayout from '../../layouts/JudgeLayout.vue';
import { api } from '../../services/api.js';
import { connectSocket } from '../../services/socket.js';
import { categoryScoreProgress, indexJudgeScores, overallScoreProgress } from '../../utils/judgeScoreProgress.js';
import { roundOneCategories } from '../../utils/score.js';

const router = useRouter();
const contestants = ref([]);
const categories = ref(roundOneCategories.map((category) => ({ ...category })));
const scoresByContestant = ref({});
const round = ref(null);
const loading = ref(true);
const error = ref('');

const overallProgress = computed(() =>
  overallScoreProgress(contestants.value, categories.value, scoresByContestant.value)
);

function categoryProgress(categoryKey) {
  return categoryScoreProgress(contestants.value, scoresByContestant.value, categoryKey);
}

function openCategory(categoryKey) {
  router.push(`/judge/round-one/category/${encodeURIComponent(categoryKey)}`);
}

async function load() {
  loading.value = true;
  try {
    const { data } = await api.get('/judge/round-one');
    contestants.value = data.contestants || [];
    categories.value = data.categories?.length ? data.categories : categories.value;
    scoresByContestant.value = indexJudgeScores(data.scores || []);
    round.value = data.round;
    error.value = '';
  } catch (loadError) {
    error.value = loadError.response?.data?.message || 'Unable to load Round 1 categories.';
  } finally {
    loading.value = false;
  }
}

const socketEvents = ['round:opened', 'round:locked', 'round:unlocked', 'criteria:updated', 'scores:reset'];

onMounted(() => {
  const socket = connectSocket();
  for (const event of socketEvents) socket.on(event, load);
  void load();
});

onBeforeUnmount(() => {
  const socket = connectSocket();
  for (const event of socketEvents) socket.off(event, load);
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

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: 1rem;
}

@media (min-width: 700px) {
  .progress-details-row {
    flex-direction: row;
    align-items: center;
  }
}
</style>
