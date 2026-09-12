<template>
  <JudgeLayout title="Judge Control Hub">
    <!-- Active Round Action Banner -->
    <section class="panel panel-gold active-round-banner" :class="activeRoundBannerClass">
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
      <ScoreSummary class="judge-metric-card metric-card--round-one">
        <AppIcon class="metric-card-icon" :name="roundOne.round?.status === 'LOCKED' ? 'lock' : 'scoreSheet'" />
        <p>Round 1 Status</p>
        <strong>{{ roundOne.round?.status || 'SETUP' }}</strong>
        <span class="card-meta">{{ roundOneStatusMeta }}</span>
      </ScoreSummary>

      <ScoreSummary class="judge-metric-card metric-card--candidates">
        <AppIcon class="metric-card-icon" name="contestants" />
        <p>Total Candidates</p>
        <strong>{{ roundOne.contestants?.length || 0 }}</strong>
        <span class="card-meta">Official Delegates</span>
      </ScoreSummary>

      <ScoreSummary class="judge-metric-card metric-card--progress">
        <AppIcon class="metric-card-icon" name="chart" />
        <p>Your R1 Progress</p>
        <strong>{{ completeCount }} / {{ roundOne.contestants?.length || 0 }}</strong>
        <span class="card-meta">{{ roundOneProgressPct }}% Completed</span>
      </ScoreSummary>

      <ScoreSummary class="judge-metric-card metric-card--final">
        <AppIcon class="metric-card-icon" :name="final.round?.status === 'LOCKED' ? 'lock' : 'finalRound'" />
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
          <p class="section-subhead">Formula: {{ finalFormula }}</p>
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
        <div v-for="cat in finalCategories" :key="cat.key" class="criteria-pill-card">
          <div class="crit-weight">{{ cat.weight }}%</div>
          <div class="crit-info">
            <span class="crit-label">{{ cat.label }}</span>
            <span class="crit-sub">Score range: 0.0 - 10.0</span>
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
import { finalCategories as defaultFinalCategories, roundOneCategories as defaultRoundOneCategories } from '../../utils/score.js';

const roundOne = ref({});
const final = ref({});
const roundOneCategories = computed(() => roundOne.value.categories?.length ? roundOne.value.categories : defaultRoundOneCategories);
const finalCategories = computed(() => final.value.categories?.length ? final.value.categories : defaultFinalCategories);
const finalFormula = computed(() => [
  'Round 1 (20%)',
  ...finalCategories.value.map((category) => `${category.label} (${category.weight}%)`)
].join(' + '));

const completeCount = computed(() =>
  (roundOne.value.contestants || []).filter((contestant) => {
    const score = (roundOne.value.scores || []).find(
      (entry) => String(entry.contestantId?._id || entry.contestantId) === String(contestant._id)
    );
    return roundOneCategories.value.every((category) => score?.[category.key] !== undefined && score?.[category.key] !== null);
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
    return !roundOneCategories.value.every((category) => score?.[category.key] !== undefined && score?.[category.key] !== null);
  });
});

const nextPendingFinalist = computed(() => {
  return (final.value.finalists || []).find((finalist) => {
    const contestantId = finalist.contestantId?._id || finalist.contestantId;
    const score = (final.value.scores || []).find(
      (entry) => String(entry.contestantId?._id || entry.contestantId) === String(contestantId)
    );
    return !finalCategories.value.every((category) => score?.[category.key] != null);
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
      description: 'Finish the remaining Final Round criteria for the next finalist.',
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

const activeRoundBannerClass = computed(() => {
  if (final.value.round?.status === 'OPEN') return 'active-round-banner--final';
  if (roundOne.value.round?.status === 'OPEN') return 'active-round-banner--round-one';
  if (roundOne.value.round?.status === 'LOCKED') return 'active-round-banner--waiting';
  return 'active-round-banner--setup';
});

const activeRoundDescription = computed(() => {
  if (final.value.round?.status === 'OPEN') {
    return 'Please submit your ratings for every Final Round criterion.';
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
  socket.on('criteria:updated', load);
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
  overflow: hidden;
  --judge-banner-title: #ffffff;
  --judge-banner-description: #dbeafe;
  --judge-banner-eyebrow: #fde68a;
  border-color: rgba(255, 255, 255, 0.2);
  background: linear-gradient(135deg, #10233f 0%, #263a63 58%, #6b4a16 100%);
  box-shadow: var(--judge-banner-shadow);
}

.active-round-banner::after {
  content: '';
  position: absolute;
  top: -105px;
  right: -72px;
  width: 235px;
  height: 235px;
  border: 38px solid rgba(255, 255, 255, 0.065);
  border-radius: 50%;
  pointer-events: none;
}

.active-round-banner--round-one {
  background:
    radial-gradient(circle at 88% 12%, rgba(255, 255, 255, 0.16), transparent 28%),
    linear-gradient(135deg, #047857 0%, #059669 52%, #0f766e 100%);
}

.active-round-banner--final {
  background:
    radial-gradient(circle at 88% 12%, rgba(255, 255, 255, 0.16), transparent 28%),
    linear-gradient(135deg, #4338ca 0%, #7c3aed 54%, #be185d 100%);
}

.active-round-banner--waiting {
  background:
    radial-gradient(circle at 88% 12%, rgba(255, 255, 255, 0.16), transparent 28%),
    linear-gradient(135deg, #1d4ed8 0%, #4f46e5 54%, #7e22ce 100%);
}

.active-round-banner--setup {
  background:
    radial-gradient(circle at 88% 12%, rgba(229, 193, 88, 0.2), transparent 30%),
    linear-gradient(135deg, #10233f 0%, #243b61 58%, #694b19 100%);
}

.banner-content {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.banner-cta {
  position: relative;
  z-index: 1;
}

.banner-content .eyebrow .app-icon {
  width: 1rem;
  height: 1rem;
  flex: 0 0 1rem;
}

.banner-content .eyebrow {
  color: var(--judge-banner-eyebrow);
}

.banner-content h2 {
  color: var(--judge-banner-title);
  font-size: 1.5rem;
  font-weight: 900;
  margin: 0.25rem 0 0.4rem;
}

.banner-desc {
  color: var(--judge-banner-description);
  font-size: 0.92rem;
}

.active-round-banner .btn-gold {
  color: var(--judge-banner-button-text);
  background: var(--judge-banner-button-bg);
}

.judge-metric-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.judge-metric-grid :deep(.summary-card) {
  min-height: 116px;
  padding: 1rem;
  border-radius: var(--radius-md);
  isolation: isolate;
  border-color: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(4, 10, 24, 0.2);
  transition: transform 200ms ease, box-shadow 200ms ease, filter 200ms ease;
}

.judge-metric-grid :deep(.summary-card)::before {
  z-index: 0;
  height: 100%;
  background:
    radial-gradient(circle at 92% 16%, rgba(255, 255, 255, 0.2), transparent 26%),
    linear-gradient(120deg, rgba(255, 255, 255, 0.1), transparent 48%);
}

.judge-metric-grid :deep(.summary-card)::after {
  content: '';
  position: absolute;
  right: -38px;
  bottom: -58px;
  z-index: 0;
  width: 124px;
  height: 124px;
  border: 18px solid rgba(255, 255, 255, 0.09);
  border-radius: 50%;
  pointer-events: none;
}

.judge-metric-grid :deep(.metric-card--round-one) {
  background: linear-gradient(135deg, #4338ca 0%, #7c3aed 58%, #a21caf 100%);
}

.judge-metric-grid :deep(.metric-card--candidates) {
  background: linear-gradient(135deg, #047857 0%, #059669 58%, #15803d 100%);
}

.judge-metric-grid :deep(.metric-card--progress) {
  background: linear-gradient(135deg, #db2777 0%, #f43f5e 52%, #f97316 100%);
}

.judge-metric-grid :deep(.metric-card--final) {
  background: linear-gradient(135deg, #0284c7 0%, #2563eb 58%, #4f46e5 100%);
}

.judge-metric-grid :deep(.summary-card:hover) {
  filter: saturate(1.08);
  transform: translateY(-3px);
  box-shadow: 0 16px 30px rgba(4, 10, 24, 0.3);
}

.judge-metric-grid :deep(.summary-card p) {
  position: relative;
  z-index: 1;
  padding-right: 2.5rem;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.68rem;
}

.judge-metric-grid :deep(.summary-card strong) {
  position: relative;
  z-index: 1;
  color: #ffffff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.16);
  font-size: clamp(1.25rem, 7vw, 1.8rem);
}

.judge-metric-grid :deep(.summary-card .card-meta) {
  position: relative;
  z-index: 1;
  color: rgba(255, 255, 255, 0.86);
  font-size: 0.72rem;
}

.metric-card-icon {
  position: absolute;
  top: 0.8rem;
  right: 0.8rem;
  z-index: 1;
  width: 1.35rem;
  height: 1.35rem;
  padding: 0.28rem;
  box-sizing: content-box;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
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
