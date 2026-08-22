<template>
  <JudgeLayout title="Judge Control Hub">
    <!-- Active Round Action Banner -->
    <section class="panel panel-gold active-round-banner">
      <div class="banner-content">
        <span class="eyebrow">👑 Official Pageant Judging</span>
        <h2>{{ activeRoundTitle }}</h2>
        <p class="banner-desc">{{ activeRoundDescription }}</p>
      </div>

      <div class="banner-cta">
        <RouterLink v-if="roundOne.round?.status === 'OPEN'" class="btn btn-gold btn-lg" to="/judge/round-one">
          ⭐ Score Round 1 Now
        </RouterLink>
        <RouterLink v-else-if="final.round?.status === 'OPEN'" class="btn btn-gold btn-lg" to="/judge/final">
          👑 Score Final Round Now
        </RouterLink>
        <span v-else class="status-badge neutral">Awaiting Round Opening</span>
      </div>
    </section>

    <!-- Key Metrics Grid -->
    <section class="metric-grid">
      <ScoreSummary>
        <p>Round 1 Status</p>
        <strong>{{ roundOne.round?.status || 'SETUP' }}</strong>
        <span class="card-meta">{{ roundOne.round?.status === 'OPEN' ? '🟢 Active for scoring' : roundOne.round?.status === 'LOCKED' ? '🔒 Locked' : '⏳ Setup' }}</span>
      </ScoreSummary>

      <ScoreSummary>
        <p>Total Candidates</p>
        <strong>{{ roundOne.contestants?.length || 0 }}</strong>
        <span class="card-meta">Official Delegates</span>
      </ScoreSummary>

      <ScoreSummary>
        <p>Your R1 Progress</p>
        <strong>{{ completeCount }} / {{ roundOne.contestants?.length || 0 }}</strong>
        <span class="card-meta">{{ roundOneProgressPct }}% Completed</span>
      </ScoreSummary>

      <ScoreSummary>
        <p>Final Round Status</p>
        <strong>{{ final.round?.status || 'SETUP' }}</strong>
        <span class="card-meta">{{ final.finalists?.length || 0 }} Finalists</span>
      </ScoreSummary>
    </section>

    <!-- Round 1 Criteria Overview & Shortcut List -->
    <section class="panel">
      <div class="section-head">
        <div>
          <h2>Round 1 Criteria & Weights</h2>
          <p class="section-subhead">Official breakdown of grading criteria for preliminary competition</p>
        </div>
        <RouterLink class="btn btn-primary btn-sm" to="/judge/round-one">
          Open R1 Score Sheets →
        </RouterLink>
      </div>

      <div class="criteria-cards-grid">
        <div v-for="cat in roundOneCategories" :key="cat.key" class="criteria-pill-card">
          <div class="crit-weight">{{ cat.weight }}%</div>
          <div class="crit-info">
            <span class="crit-label">{{ cat.label }}</span>
            <span class="crit-sub">Score range: 0.0 - 10.0</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Final Round Criteria Overview -->
    <section class="panel">
      <div class="section-head">
        <div>
          <h2>Final Round Criteria</h2>
          <p class="section-subhead">Formula: Round 1 (20%) + Final Intelligence (40%) + Final Beauty (40%)</p>
        </div>
        <RouterLink
          class="btn btn-sm"
          :class="final.round?.status === 'OPEN' ? 'btn-gold' : 'btn-ghost'"
          to="/judge/final"
        >
          Open Final Score Sheets →
        </RouterLink>
      </div>

      <div class="criteria-cards-grid">
        <div class="criteria-pill-card">
          <div class="crit-weight">20%</div>
          <div class="crit-info">
            <span class="crit-label">Round 1 Carry-over</span>
            <span class="crit-sub">Transferred automatically from locked R1</span>
          </div>
        </div>
        <div class="criteria-pill-card">
          <div class="crit-weight">40%</div>
          <div class="crit-info">
            <span class="crit-label">Final Intelligence & Q&A</span>
            <span class="crit-sub">Clarity, eloquence, articulation</span>
          </div>
        </div>
        <div class="criteria-pill-card">
          <div class="crit-weight">40%</div>
          <div class="crit-info">
            <span class="crit-label">Final Beauty & Charisma</span>
            <span class="crit-sub">Stage presence, regal aura</span>
          </div>
        </div>
      </div>
    </section>
  </JudgeLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import ScoreSummary from '../../components/ScoreSummary.vue';
import JudgeLayout from '../../layouts/JudgeLayout.vue';
import { api } from '../../services/api.js';
import { connectSocket } from '../../services/socket.js';
import { roundOneCategories } from '../../utils/score.js';

const roundOne = ref({});
const final = ref({});

const completeCount = computed(() =>
  (roundOne.value.contestants || []).filter((contestant) => {
    const score = (roundOne.value.scores || []).find(
      (entry) => String(entry.contestantId?._id || entry.contestantId) === String(contestant._id)
    );
    return roundOneCategories.every((category) => score?.[category.key] !== undefined && score?.[category.key] !== null);
  }).length
);

const roundOneProgressPct = computed(() => {
  const total = roundOne.value.contestants?.length || 0;
  return total ? Math.round((completeCount.value / total) * 100) : 0;
});

const activeRoundTitle = computed(() => {
  if (final.value.round?.status === 'OPEN') return 'Final Round is OPEN for Scoring';
  if (roundOne.value.round?.status === 'OPEN') return 'Round 1 is OPEN for Scoring';
  if (roundOne.value.round?.status === 'LOCKED') return 'Round 1 Locked • Awaiting Final Round';
  return 'Tabulation Setup in Progress';
});

const activeRoundDescription = computed(() => {
  if (final.value.round?.status === 'OPEN') {
    return 'Please submit your ratings for the Top 5 finalists on Final Intelligence & Beauty.';
  }
  if (roundOne.value.round?.status === 'OPEN') {
    return `You have completed ${completeCount.value} of ${roundOne.value.contestants?.length || 0} candidate score sheets.`;
  }
  return 'Scores will become editable as soon as the Tabulation Committee opens the round.';
});

async function load() {
  const [roundOneResponse, finalResponse] = await Promise.all([
    api.get('/judge/round-one'),
    api.get('/judge/final')
  ]);
  roundOne.value = roundOneResponse.data;
  final.value = finalResponse.data;
}

onMounted(() => {
  load();
  const socket = connectSocket();
  socket.on('round:opened', load);
  socket.on('round:locked', load);
  socket.on('finalists:generated', load);
});
</script>

<style scoped>
.active-round-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 1.75rem 2rem;
  background: linear-gradient(135deg, var(--surface) 0%, var(--gold-soft) 100%);
}

.banner-content h2 {
  font-size: 1.5rem;
  font-weight: 900;
  margin: 0.25rem 0 0.4rem;
}

.banner-desc {
  color: var(--text-muted);
  font-size: 0.92rem;
}

.criteria-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 0.5rem;
}

.criteria-pill-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  background: var(--surface-hover);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.crit-weight {
  font-size: 1.1rem;
  font-weight: 900;
  color: var(--gold-dark);
  background: var(--gold-soft);
  padding: 0.3rem 0.6rem;
  border-radius: var(--radius-sm);
}

.crit-info {
  display: flex;
  flex-direction: column;
}

.crit-label {
  font-size: 0.85rem;
  font-weight: 800;
}

.crit-sub {
  font-size: 0.72rem;
  color: var(--text-muted);
}
</style>
