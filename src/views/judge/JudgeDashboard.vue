<template>
  <JudgeLayout title="Judge Control Hub">
    <!-- Active Round Action Banner -->
    <section class="panel panel-gold active-round-banner">
      <div class="banner-content">
        <span class="eyebrow"><AppIcon name="judge" /> Official Pageant Judging</span>
        <h2>{{ activeRoundTitle }}</h2>
        <p class="banner-desc">{{ activeRoundDescription }}</p>
      </div>

      <div class="banner-cta">
        <RouterLink v-if="roundOne.round?.status === 'OPEN'" class="btn btn-gold btn-lg" to="/judge/round-one">
          <AppIcon name="roundOne" />
          Score Round 1 Now
        </RouterLink>
        <RouterLink v-else-if="final.round?.status === 'OPEN'" class="btn btn-gold btn-lg" to="/judge/final">
          <AppIcon name="finalists" />
          Score Final Round Now
        </RouterLink>
        <span v-else class="status-badge neutral">Awaiting Round Opening</span>
      </div>
    </section>

    <section v-if="nextAction" class="judge-action-card">
      <div class="action-card-icon">
        <AppIcon :name="nextAction.icon" />
      </div>
      <div class="action-card-copy">
        <span class="eyebrow">{{ nextAction.eyebrow }}</span>
        <h2>{{ nextAction.title }}</h2>
        <p>{{ nextAction.description }}</p>
      </div>
      <RouterLink class="btn btn-primary" :to="nextAction.to">
        {{ nextAction.cta }}
        <AppIcon name="arrowRight" />
      </RouterLink>
    </section>

    <!-- Key Metrics Grid -->
    <section class="metric-grid judge-metric-grid">
      <ScoreSummary>
        <p>Round 1 Status</p>
        <strong>{{ roundOne.round?.status || 'SETUP' }}</strong>
        <span class="card-meta">{{ roundOneStatusMeta }}</span>
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
    <section class="panel judge-criteria-panel">
      <div class="section-head judge-section-head">
        <div>
          <h2>Round 1 Criteria & Weights</h2>
          <p class="section-subhead">Official breakdown of grading criteria for preliminary competition</p>
        </div>
        <RouterLink class="btn btn-primary btn-sm" to="/judge/round-one">
          Open R1 Score Sheets
          <AppIcon name="arrowRight" />
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
    <section class="panel judge-criteria-panel">
      <div class="section-head judge-section-head">
        <div>
          <h2>Final Round Criteria</h2>
          <p class="section-subhead">Formula: Round 1 (20%) + Final Intelligence (40%) + Final Beauty (40%)</p>
        </div>
        <RouterLink
          class="btn btn-sm"
          :class="final.round?.status === 'OPEN' ? 'btn-gold' : 'btn-ghost'"
          to="/judge/final"
        >
          Open Final Score Sheets
          <AppIcon name="arrowRight" />
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
import AppIcon from '../../components/AppIcon.vue';
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

const roundOneStatusMeta = computed(() => {
  if (roundOne.value.round?.status === 'OPEN') return 'Active for scoring';
  if (roundOne.value.round?.status === 'LOCKED') return 'Locked by tabulation';
  return 'Waiting for setup';
});

const nextPendingRoundOneContestant = computed(() => {
  return (roundOne.value.contestants || []).find((contestant) => {
    const score = (roundOne.value.scores || []).find(
      (entry) => String(entry.contestantId?._id || entry.contestantId) === String(contestant._id)
    );
    return !roundOneCategories.every((category) => score?.[category.key] !== undefined && score?.[category.key] !== null);
  });
});

const nextPendingFinalist = computed(() => {
  return (final.value.finalists || []).find((finalist) => {
    const contestantId = finalist.contestantId?._id || finalist.contestantId;
    const score = (final.value.scores || []).find(
      (entry) => String(entry.contestantId?._id || entry.contestantId) === String(contestantId)
    );
    return score?.intelligence == null || score?.beauty == null;
  });
});

const nextAction = computed(() => {
  if (roundOne.value.round?.status === 'OPEN' && nextPendingRoundOneContestant.value?._id) {
    return {
      icon: 'scoreSheet',
      eyebrow: 'Continue Round 1',
      title: `Candidate #${nextPendingRoundOneContestant.value.contestantNumber}`,
      description: 'Resume at the next candidate with incomplete category scores.',
      cta: 'Continue Scoring',
      to: `/judge/round-one/${nextPendingRoundOneContestant.value._id}`
    };
  }

  if (final.value.round?.status === 'OPEN' && nextPendingFinalist.value?.contestantId?._id) {
    return {
      icon: 'finalists',
      eyebrow: 'Continue Final Round',
      title: `Finalist #${nextPendingFinalist.value.contestantId.contestantNumber}`,
      description: 'Finish intelligence and beauty scoring for the next finalist.',
      cta: 'Continue Finals',
      to: `/judge/final/${nextPendingFinalist.value.contestantId._id}`
    };
  }

  return null;
});

const activeRoundTitle = computed(() => {
  if (final.value.round?.status === 'OPEN') return 'Final Round is OPEN for Scoring';
  if (roundOne.value.round?.status === 'OPEN') return 'Round 1 is OPEN for Scoring';
  if (roundOne.value.round?.status === 'LOCKED') return 'Round 1 Locked - Awaiting Final Round';
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

.judge-metric-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.judge-metric-grid :deep(.summary-card) {
  min-height: 116px;
  padding: 1rem;
  border-radius: var(--radius-md);
}

.judge-metric-grid :deep(.summary-card p) {
  font-size: 0.68rem;
}

.judge-metric-grid :deep(.summary-card strong) {
  font-size: clamp(1.25rem, 7vw, 1.8rem);
}

.judge-metric-grid :deep(.summary-card .card-meta) {
  font-size: 0.72rem;
}

.judge-criteria-panel {
  padding: 1rem;
}

.judge-section-head {
  align-items: flex-start;
  margin-bottom: 1rem;
}

.judge-section-head .btn {
  min-height: 38px;
  padding: 0.55rem 0.8rem;
  font-size: 0.78rem;
}

.judge-section-head h2 {
  font-size: 1.1rem;
}

.judge-action-card {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-gold);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--navy-dark) 0%, var(--navy) 100%);
  color: #ffffff;
  box-shadow: var(--shadow-md);
}

.judge-action-card .eyebrow,
.judge-action-card h2 {
  color: #ffffff;
}

.judge-action-card p {
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.88rem;
}

.action-card-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  color: var(--navy-darkest);
  background: linear-gradient(135deg, var(--gold-light), var(--gold));
}

.action-card-icon .app-icon {
  width: 1.45rem;
  height: 1.45rem;
}

.judge-action-card .btn {
  grid-column: 1 / -1;
}

.criteria-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 0.5rem;
}

.criteria-pill-card {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 0.7rem;
  background: var(--surface-hover);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.crit-weight {
  flex: 0 0 auto;
  font-size: 0.95rem;
  font-weight: 900;
  color: var(--gold-dark);
  background: var(--gold-soft);
  padding: 0.25rem 0.45rem;
  border-radius: var(--radius-sm);
}

.crit-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.crit-label {
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1.2;
}

.crit-sub {
  font-size: 0.68rem;
  color: var(--text-muted);
}

@media (max-width: 380px) {
  .criteria-cards-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .active-round-banner {
    gap: 1rem;
    padding: 0.95rem;
    border-radius: var(--radius-md);
  }

  .banner-content .eyebrow {
    gap: 0.35rem;
    font-size: clamp(0.62rem, 2.9vw, 0.7rem);
    line-height: 1.25;
    letter-spacing: 0.04em;
  }

  .banner-content .eyebrow .app-icon {
    width: 1.15rem;
    height: 1.15rem;
  }

  .banner-content h2 {
    max-width: 20ch;
    font-size: clamp(1.15rem, 5.25vw, 1.42rem);
    line-height: 1.14;
    letter-spacing: 0;
    margin: 0.3rem 0 0.35rem;
  }

  .banner-desc {
    max-width: 34ch;
    font-size: clamp(0.78rem, 3.45vw, 0.86rem);
    line-height: 1.42;
  }

  .banner-cta,
  .banner-cta .btn {
    width: 100%;
  }

  .banner-cta .btn {
    min-height: 44px;
    padding: 0.65rem 0.9rem;
    font-size: clamp(0.8rem, 3.6vw, 0.88rem);
  }

  .judge-metric-grid {
    gap: 0.65rem;
  }

  .judge-metric-grid :deep(.summary-card) {
    min-height: 100px;
    padding: 0.78rem;
  }

  .judge-metric-grid :deep(.summary-card p) {
    font-size: clamp(0.6rem, 2.75vw, 0.68rem);
    line-height: 1.25;
    letter-spacing: 0.035em;
  }

  .judge-metric-grid :deep(.summary-card strong) {
    margin-top: 0.15rem;
    font-size: clamp(1.28rem, 6.35vw, 1.55rem);
    line-height: 1.05;
    letter-spacing: 0;
  }

  .judge-metric-grid :deep(.summary-card .card-meta) {
    font-size: clamp(0.63rem, 2.9vw, 0.7rem);
    line-height: 1.25;
  }

  .judge-criteria-panel {
    margin-left: -1rem;
    margin-right: -1rem;
    padding: 1rem;
    border-left: 0;
    border-right: 0;
    border-radius: 0;
    box-shadow: none;
    background: transparent;
  }

  .judge-section-head {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }

  .judge-section-head .btn {
    width: 100%;
  }

  .judge-section-head h2 {
    font-size: clamp(1.05rem, 5.4vw, 1.28rem);
    line-height: 1.18;
  }

  .judge-section-head .section-subhead {
    max-width: 30ch;
    font-size: 0.82rem;
    line-height: 1.45;
  }

  .criteria-cards-grid {
    gap: 0.55rem;
  }

  .criteria-pill-card {
    min-height: 84px;
    padding: 0.65rem;
  }

  .crit-weight {
    font-size: clamp(0.82rem, 4vw, 0.95rem);
  }

  .crit-label {
    font-size: clamp(0.74rem, 3.7vw, 0.84rem);
    line-height: 1.15;
  }

  .crit-sub {
    margin-top: 0.12rem;
    font-size: clamp(0.66rem, 3.2vw, 0.72rem);
    line-height: 1.25;
  }
}

@media (min-width: 720px) {
  .judge-action-card {
    grid-template-columns: auto 1fr auto;
    padding: 1.25rem 1.5rem;
  }

  .judge-action-card .btn {
    grid-column: auto;
  }

  .judge-criteria-panel {
    padding: 1.5rem;
  }

  .criteria-cards-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
}
</style>
