<template>
  <JudgeLayout title="Round 1 Scoring">
    <!-- Progress Panel -->
    <section class="panel panel-gold">
      <div class="section-head">
        <div>
          <h2>Round 1 Contestants</h2>
          <p class="section-subhead">Grade all {{ contestants.length }} official delegates across 5 criteria</p>
        </div>
        <StatusBadge :label="round?.status || 'SETUP'" :tone="round?.status === 'LOCKED' ? 'success' : 'neutral'" />
      </div>

      <ProgressBar :value="progress" />
      <div class="progress-details-row">
        <span>Scoring Progress: <strong>{{ completeCount }} of {{ contestants.length }} Completed</strong> ({{ progress }}%)</span>
        <span v-if="completeCount === contestants.length" class="all-done-tag">🎉 All Candidates Graded!</span>
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
          All ({{ contestants.length }})
        </button>
        <button
          type="button"
          class="filter-chip"
          :class="{ active: filterTab === 'PENDING' }"
          @click="filterTab = 'PENDING'"
        >
          Pending ({{ contestants.length - completeCount }})
        </button>
        <button
          type="button"
          class="filter-chip"
          :class="{ active: filterTab === 'COMPLETE' }"
          @click="filterTab = 'COMPLETE'"
        >
          Completed ({{ completeCount }})
        </button>
      </div>

      <div class="search-input-wrap">
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
        <div class="card-score-summary">
          <span class="score-ratio">{{ scoreCount(contestant) }} / 5 Scored</span>
          <span v-if="getContestantTotal(contestant) !== null" class="score-val">
            {{ getContestantTotal(contestant) }} pts
          </span>
        </div>

        <StatusBadge
          :label="scoreCount(contestant) === 5 ? 'COMPLETE' : 'PENDING'"
          :tone="scoreCount(contestant) === 5 ? 'success' : 'neutral'"
        />
      </ContestantCard>
    </section>

    <EmptyState v-else message="No candidates match your current search or filter." />
  </JudgeLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import ContestantCard from '../../components/ContestantCard.vue';
import EmptyState from '../../components/EmptyState.vue';
import LoadingState from '../../components/LoadingState.vue';
import ProgressBar from '../../components/ProgressBar.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import JudgeLayout from '../../layouts/JudgeLayout.vue';
import { api } from '../../services/api.js';
import { roundOneCategories } from '../../utils/score.js';

const contestants = ref([]);
const scores = ref([]);
const round = ref(null);
const loading = ref(true);
const filterTab = ref('ALL');
const searchQuery = ref('');

const completeCount = computed(() =>
  contestants.value.filter((contestant) => scoreCount(contestant) === 5).length
);

const progress = computed(() =>
  contestants.value.length ? Math.round((completeCount.value / contestants.value.length) * 100) : 0
);

function scoreCount(contestant) {
  const score = scores.value.find((entry) => String(entry.contestantId?._id || entry.contestantId) === String(contestant._id));
  return roundOneCategories.filter(
    (category) => score?.[category.key] !== undefined && score?.[category.key] !== null
  ).length;
}

function getContestantTotal(contestant) {
  const score = scores.value.find((entry) => String(entry.contestantId?._id || entry.contestantId) === String(contestant._id));
  if (!score) return null;
  let total = 0;
  let hasAny = false;
  for (const cat of roundOneCategories) {
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
    const isComplete = scoreCount(c) === 5;
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

onMounted(async () => {
  const { data } = await api.get('/judge/round-one');
  contestants.value = data.contestants;
  scores.value = data.scores;
  round.value = data.round;
  loading.value = false;
});
</script>

<style scoped>
.progress-details-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.85rem;
}

.all-done-tag {
  color: var(--success);
  font-weight: 800;
}

.filter-search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filter-chips {
  display: flex;
  gap: 0.5rem;
}

.filter-chip {
  padding: 0.45rem 0.85rem;
  border-radius: var(--radius-full);
  background: var(--surface);
  border: 1px solid var(--border);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 150ms ease;
}

.filter-chip:hover {
  background: var(--surface-hover);
}

.filter-chip.active {
  background: linear-gradient(135deg, var(--gold-dark), var(--gold));
  color: #fff;
  border-color: var(--gold-dark);
}

.search-input-wrap {
  min-width: 250px;
}

.card-score-summary {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
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
</style>
