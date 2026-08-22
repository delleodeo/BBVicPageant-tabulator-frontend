<template>
  <JudgeLayout title="Judge Profile & Credentials">
    <section class="panel panel-gold profile-header-panel">
      <div class="profile-avatar-wrap">
        <span class="profile-avatar-text">{{ auth.judge?.judgeId || 'J' }}</span>
      </div>
      <div>
        <span class="eyebrow">Accredited Pageant Judge</span>
        <h2>{{ auth.judge?.name }}</h2>
        <p class="judge-designation">{{ auth.judge?.designation || 'Official Member, Board of Judges' }}</p>
        <div class="profile-badges-row">
          <span class="status-badge success">● ACTIVE CREDENTIALS</span>
          <span class="status-badge neutral">ID: {{ auth.judge?.judgeId }}</span>
          <span class="status-badge info">User: @{{ auth.user?.username }}</span>
        </div>
      </div>
    </section>

    <!-- Judging Summary Statistics -->
    <section class="metric-grid">
      <ScoreSummary>
        <p>Round 1 Completed</p>
        <strong>{{ r1ScoresCount }} / {{ totalContestants }}</strong>
        <span class="card-meta">Candidate Sheets</span>
      </ScoreSummary>

      <ScoreSummary>
        <p>Average Score Given</p>
        <strong>{{ myAverageScore }}</strong>
        <span class="card-meta">Out of 10.0 scale</span>
      </ScoreSummary>

      <ScoreSummary>
        <p>Highest Score Given</p>
        <strong>{{ myMaxScore }}</strong>
        <span class="card-meta">Peak rating</span>
      </ScoreSummary>

      <ScoreSummary>
        <p>Final Round Status</p>
        <strong>{{ finalScoresCount }} / 5</strong>
        <span class="card-meta">Finalists Graded</span>
      </ScoreSummary>
    </section>

    <!-- Certification Statement -->
    <section class="panel">
      <h3>Official Judge Oath & Code of Ethics</h3>
      <p style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--text-muted); line-height: 1.6;">
        As an official judge of this pageant, I solemnly swear to grade all candidates with utmost impartiality, objectivity, integrity, and adherence to the official scoring guidelines.
      </p>
    </section>
  </JudgeLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import ScoreSummary from '../../components/ScoreSummary.vue';
import JudgeLayout from '../../layouts/JudgeLayout.vue';
import { api } from '../../services/api.js';
import { useAuthStore } from '../../stores/auth.js';
import { roundOneCategories } from '../../utils/score.js';

const auth = useAuthStore();
const r1Data = ref({});
const finalData = ref({});

const totalContestants = computed(() => r1Data.value.contestants?.length || 0);

const r1ScoresCount = computed(() => {
  return (r1Data.value.contestants || []).filter((c) => {
    const s = (r1Data.value.scores || []).find((entry) => String(entry.contestantId?._id || entry.contestantId) === String(c._id));
    return roundOneCategories.every((cat) => s?.[cat.key] != null);
  }).length;
});

const finalScoresCount = computed(() => {
  return (finalData.value.scores || []).filter((s) => s.intelligence != null && s.beauty != null).length;
});

const myAllScores = computed(() => {
  const scores = [];
  for (const s of r1Data.value.scores || []) {
    for (const cat of roundOneCategories) {
      if (s[cat.key] != null && Number.isFinite(Number(s[cat.key]))) {
        scores.push(Number(s[cat.key]));
      }
    }
  }
  return scores;
});

const myAverageScore = computed(() => {
  if (!myAllScores.value.length) return '-';
  const sum = myAllScores.value.reduce((acc, v) => acc + v, 0);
  return (sum / myAllScores.value.length).toFixed(2);
});

const myMaxScore = computed(() => {
  if (!myAllScores.value.length) return '-';
  return Math.max(...myAllScores.value).toFixed(1);
});

onMounted(async () => {
  const [r1Res, finalRes] = await Promise.all([
    api.get('/judge/round-one'),
    api.get('/judge/final')
  ]);
  r1Data.value = r1Res.data;
  finalData.value = finalRes.data;
});
</script>

<style scoped>
.profile-header-panel {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.75rem 2rem;
}

.profile-avatar-wrap {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--gold-dark), var(--gold-light));
  color: #0b1528;
  display: grid;
  place-items: center;
  font-size: 2rem;
  font-weight: 900;
  box-shadow: var(--shadow-gold);
}

.judge-designation {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--gold-dark);
  margin: 0.2rem 0 0.5rem;
}

.profile-badges-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
</style>
