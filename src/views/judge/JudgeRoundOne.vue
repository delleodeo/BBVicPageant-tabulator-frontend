<template>
  <JudgeLayout title="Round 1 Scoring">
    <!-- Progress Panel -->
    <section class="panel panel-gold">
      <div class="section-head">
        <div>
          <h2>Round 1 Contestants</h2>
          <p class="section-subhead">Grade all {{ contestants.length }} official delegates across {{ categories.length }} criteria</p>
        </div>
        <StatusBadge :label="round?.status || 'SETUP'" :tone="round?.status === 'LOCKED' ? 'success' : 'neutral'" />
      </div>

      <ProgressBar :value="progress" />
      <div class="progress-details-row">
        <span>Scoring Progress: <strong>{{ completeCount }} of {{ contestants.length }} Completed</strong> ({{ progress }}%)</span>
        <span v-if="completeCount === contestants.length" class="all-done-tag">
          <AppIcon name="check" />
          All Candidates Graded
        </span>
      </div>
    </section>

    <!-- Filters & Search -->
    <div class="filter-search-bar">
      <div class="filter-chips">
        <button
          type="button"
          class="filter-chip"
          :class="{ active: filterTab === 'ALL' }"
          @click="filterTab = 'ALL'"
        >
          <AppIcon name="contestants" />
          All ({{ contestants.length }})
        </button>
        <button
          type="button"
          class="filter-chip"
          :class="{ active: filterTab === 'PENDING' }"
          @click="filterTab = 'PENDING'"
        >
          <AppIcon name="scoreSheet" />
          Pending ({{ contestants.length - completeCount }})
        </button>
        <button
          type="button"
          class="filter-chip"
          :class="{ active: filterTab === 'COMPLETE' }"
          @click="filterTab = 'COMPLETE'"
        >
          <AppIcon name="check" />
          Completed ({{ completeCount }})
        </button>
      </div>

      <div class="search-input-wrap">
        <AppIcon name="search" />
        <input v-model="searchQuery" placeholder="Search by name, # or hometown..." />
      </div>
    </div>

    <LoadingState v-if="loading" label="contestants" />

    <section v-else-if="filteredContestants.length > 0" class="card-grid">
      <ContestantCard
        v-for="contestant in filteredContestants"
        :key="contestant._id"
        :contestant="contestant"
        :to="`/judge/round-one/${contestant._id}`"
      >
        <div class="judge-card-score">
          <div class="card-score-summary">
            <span class="score-ratio">{{ scoreCount(contestant) }} / {{ categories.length }} Scored</span>
            <span v-if="getContestantTotal(contestant) !== null" class="score-val">
              {{ getContestantTotal(contestant) }} pts
            </span>
          </div>
          <div class="mini-progress" aria-hidden="true">
            <span :style="{ width: `${categories.length ? (scoreCount(contestant) / categories.length) * 100 : 0}%` }"></span>
          </div>
        </div>

        <StatusBadge
          :label="scoreCount(contestant) === categories.length ? 'COMPLETE' : 'PENDING'"
          :tone="scoreCount(contestant) === categories.length ? 'success' : 'neutral'"
        />
      </ContestantCard>
    </section>

    <EmptyState v-else message="No candidates match your current search or filter." />
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
import { roundOneCategories } from '../../utils/score.js';

const contestants = ref([]);
const scores = ref([]);
const round = ref(null);
const loading = ref(true);
const filterTab = ref('ALL');
const searchQuery = ref('');
const categories = ref(roundOneCategories.map((category) => ({ ...category })));

const completeCount = computed(() =>
  contestants.value.filter((contestant) => scoreCount(contestant) === categories.value.length).length
);

const progress = computed(() =>
  contestants.value.length ? Math.round((completeCount.value / contestants.value.length) * 100) : 0
);

function scoreCount(contestant) {
  const score = scores.value.find((entry) => String(entry.contestantId?._id || entry.contestantId) === String(contestant._id));
  return categories.value.filter(
    (category) => score?.[category.key] !== undefined && score?.[category.key] !== null
  ).length;
}

function getContestantTotal(contestant) {
  const score = scores.value.find((entry) => String(entry.contestantId?._id || entry.contestantId) === String(contestant._id));
  if (!score) return null;
  let total = 0;
  let hasAny = false;
  for (const cat of categories.value) {
    if (score[cat.key] != null) {
      hasAny = true;
      total += Number(score[cat.key]) * (cat.weight / 10);
    }
  }
  return hasAny ? total.toFixed(1) : null;
}

const filteredContestants = computed(() => {
  return contestants.value.filter((c) => {
    // Filter Tab
    const isComplete = scoreCount(c) === categories.value.length;
    if (filterTab.value === 'PENDING' && isComplete) return false;
    if (filterTab.value === 'COMPLETE' && !isComplete) return false;

    // Search Query
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const matchName = c.name?.toLowerCase().includes(q);
      const matchNum = c.contestantNumber?.includes(q);
      const matchHometown = c.hometown?.toLowerCase().includes(q);
      return matchName || matchNum || matchHometown;
    }

    return true;
  });
});

async function load() {
  const { data } = await api.get('/judge/round-one');
  contestants.value = data.contestants;
  scores.value = data.scores;
  round.value = data.round;
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

.filter-search-bar {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: stretch;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filter-chips {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.5rem;
  width: 100%;
  overflow-x: auto;
  padding-bottom: 0.1rem;
  scrollbar-width: none;
}

.filter-chips::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.85rem;
  border-radius: var(--radius-full);
  background: var(--surface);
  border: 1px solid var(--border);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 150ms ease;
  white-space: nowrap;
  flex: 0 0 auto;
}

.filter-chip:hover {
  background: var(--surface-hover);
}

.filter-chip.active {
  background: linear-gradient(135deg, var(--gold-dark), var(--gold));
  color: #fff;
  border-color: var(--gold-dark);
}

.filter-chip .app-icon {
  width: 0.95rem;
  height: 0.95rem;
}

.search-input-wrap {
  width: 100%;
  position: relative;
}

.search-input-wrap .app-icon {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  width: 1rem;
  height: 1rem;
  color: var(--text-muted);
  transform: translateY(-50%);
  pointer-events: none;
}

.search-input-wrap input {
  padding-left: 2.35rem;
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
  margin-bottom: 0.4rem;
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

.mini-progress {
  height: 7px;
  overflow: hidden;
  border-radius: var(--radius-full);
  background: var(--surface-active);
}

.mini-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--gold), var(--success));
  transition: width 180ms ease;
}

@media (min-width: 700px) {
  .progress-details-row,
  .filter-search-bar {
    flex-direction: row;
    align-items: center;
  }

  .search-input-wrap {
    width: auto;
    min-width: 280px;
  }
}
</style>
