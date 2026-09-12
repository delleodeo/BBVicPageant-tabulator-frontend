<template>
  <JudgeLayout title="Judge Profile & Credentials">
    <section class="profile-overview-card">
      <div class="profile-overview-top">
        <div class="profile-avatar-wrap">{{ auth.judge?.judgeId || 'J' }}</div>

        <div class="profile-main-copy">
          <div class="profile-kicker">
            <span class="status-dot"></span>
            Accredited Pageant Judge
          </div>
          <h2>{{ auth.judge?.name }}</h2>
          <p class="judge-designation">{{ auth.judge?.designation || 'Official Member, Board of Judges' }}</p>
        </div>
      </div>

      <div class="profile-badges-row">
        <span class="status-badge success"><AppIcon name="check" /> Active</span>
        <span class="status-badge neutral">ID {{ auth.judge?.judgeId }}</span>
        <span class="status-badge info">@{{ auth.user?.username }}</span>
      </div>

      <div class="profile-session-actions">
        <button
          type="button"
          class="btn btn-ghost btn-icon btn-sm"
          :title="isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'"
          @click="toggleTheme"
        >
          <AppIcon :name="isDark ? 'sun' : 'moon'" />
        </button>

        <button class="btn btn-ghost btn-sm profile-logout-btn" type="button" @click="logout">
          <AppIcon name="arrowRightOnRectangle" />
          Logout
        </button>
      </div>

      <div class="profile-progress-card">
        <div class="progress-card-head">
          <span>Overall completion</span>
          <strong>{{ overallProgress }}%</strong>
        </div>

        <div class="profile-progress-track">
          <span :style="{ width: `${overallProgress}%` }"></span>
        </div>

        <div class="progress-breakdown">
          <div>
            <span>Round 1</span>
            <strong>{{ r1ScoresCount }} / {{ totalContestants }}</strong>
          </div>
          <div>
            <span>Final</span>
            <strong>{{ finalScoresCount }} / {{ finalTargetCount }}</strong>
          </div>
        </div>
      </div>
    </section>

    <section class="judge-stat-grid" aria-label="Judge scoring summary">
      <article class="judge-stat-card">
        <span class="stat-icon"><AppIcon name="roundOne" /></span>
        <p>Round 1 Completed</p>
        <strong>{{ r1ScoresCount }} / {{ totalContestants }}</strong>
        <small>{{ r1CompletionPercent }}% of candidate sheets</small>
      </article>

      <article class="judge-stat-card">
        <span class="stat-icon"><AppIcon name="chart" /></span>
        <p>Average Score Given</p>
        <strong>{{ myAverageScore }}</strong>
        <small>Out of 10.0 scale</small>
      </article>

      <article class="judge-stat-card">
        <span class="stat-icon"><AppIcon name="awards" /></span>
        <p>Highest Score Given</p>
        <strong>{{ myMaxScore }}</strong>
        <small>Peak rating submitted</small>
      </article>

      <article class="judge-stat-card">
        <span class="stat-icon"><AppIcon name="finalists" /></span>
        <p>Final Round Status</p>
        <strong>{{ finalScoresCount }} / {{ finalTargetCount }}</strong>
        <small>{{ finalCompletionPercent }}% of finalists graded</small>
      </article>
    </section>

    <section class="profile-actions-grid">
      <RouterLink class="profile-action-card" to="/judge/round-one">
        <span><AppIcon name="scoreSheet" /></span>
        <div>
          <strong>Open Round 1 Score Sheets</strong>
          <small>Review pending and completed candidate sheets.</small>
        </div>
        <AppIcon name="arrowRight" />
      </RouterLink>

      <RouterLink class="profile-action-card" to="/judge/final">
        <span><AppIcon name="finalists" /></span>
        <div>
          <strong>Open Final Round</strong>
          <small>Score finalists when the championship phase is active.</small>
        </div>
        <AppIcon name="arrowRight" />
      </RouterLink>
    </section>

    <section class="panel judge-oath-card">
      <span class="oath-icon"><AppIcon name="shieldCheck" /></span>
      <h3>Official Judge Oath & Code of Ethics</h3>
      <p>
        As an official judge of this pageant, I solemnly swear to grade all candidates with utmost impartiality, objectivity, integrity, and adherence to the official scoring guidelines.
      </p>
    </section>
  </JudgeLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppIcon from '../../components/AppIcon.vue';
import JudgeLayout from '../../layouts/JudgeLayout.vue';
import { api } from '../../services/api.js';
import { useAuthStore } from '../../stores/auth.js';
import { finalCategories, roundOneCategories } from '../../utils/score.js';

const auth = useAuthStore();
const router = useRouter();
const r1Data = ref({});
const finalData = ref({});
const activeRoundOneCategories = computed(() => r1Data.value.categories?.length ? r1Data.value.categories : roundOneCategories);
const activeFinalCategories = computed(() => finalData.value.categories?.length ? finalData.value.categories : finalCategories);
const isDark = ref(false);

const totalContestants = computed(() => r1Data.value.contestants?.length || 0);
const finalTargetCount = computed(() => finalData.value.finalists?.length || 5);

const r1ScoresCount = computed(() => {
  return (r1Data.value.contestants || []).filter((c) => {
    const s = (r1Data.value.scores || []).find((entry) => String(entry.contestantId?._id || entry.contestantId) === String(c._id));
    return activeRoundOneCategories.value.every((cat) => s?.[cat.key] != null);
  }).length;
});

const finalScoresCount = computed(() => {
  return (finalData.value.scores || []).filter((s) => activeFinalCategories.value.every((cat) => s?.[cat.key] != null)).length;
});

const r1CompletionPercent = computed(() => {
  return totalContestants.value ? Math.round((r1ScoresCount.value / totalContestants.value) * 100) : 0;
});

const finalCompletionPercent = computed(() => {
  return finalTargetCount.value ? Math.round((finalScoresCount.value / finalTargetCount.value) * 100) : 0;
});

const overallProgress = computed(() => {
  const total = totalContestants.value + finalTargetCount.value;
  const complete = r1ScoresCount.value + finalScoresCount.value;
  return total ? Math.round((complete / total) * 100) : 0;
});

const myAllScores = computed(() => {
  const scores = [];
  for (const s of r1Data.value.scores || []) {
    for (const cat of activeRoundOneCategories.value) {
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

function syncThemeState() {
  const saved = localStorage.getItem('pageant_theme');
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true;
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

function toggleTheme() {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('pageant_theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('pageant_theme', 'light');
  }
}

function logout() {
  auth.logout();
  router.push('/login');
}

onMounted(async () => {
  syncThemeState();
  const [r1Res, finalRes] = await Promise.all([
    api.get('/judge/round-one'),
    api.get('/judge/final')
  ]);
  r1Data.value = r1Res.data;
  finalData.value = finalRes.data;
});
</script>

<style scoped>
.profile-overview-card,
.judge-stat-card,
.profile-action-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.profile-overview-card {
  padding: 1rem;
  margin-bottom: 1rem;
}

.profile-overview-top {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.profile-avatar-wrap {
  width: 58px;
  height: 58px;
  flex: 0 0 58px;
  border-radius: var(--radius-full);
  background: var(--navy);
  color: var(--gold-light);
  display: grid;
  place-items: center;
  font-size: 1.35rem;
  font-weight: 900;
  border: 3px solid var(--gold-soft);
}

.profile-main-copy {
  min-width: 0;
}

.profile-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--gold-dark);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.profile-main-copy h2 {
  margin-top: 0.15rem;
  font-size: clamp(1.45rem, 7vw, 2rem);
  font-weight: 900;
  line-height: 1.1;
  word-break: break-word;
}

.judge-designation {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--gold-dark);
  margin-top: 0.2rem;
}

.profile-badges-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.profile-badges-row .app-icon {
  width: 0.95rem;
  height: 0.95rem;
}

.profile-session-actions {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.6rem;
  margin-top: 1rem;
}

.profile-logout-btn {
  min-width: 0;
}

.profile-progress-card {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.progress-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.progress-card-head span {
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
}

.progress-card-head strong {
  font-size: 1.4rem;
  color: var(--text-main);
}

.profile-progress-track {
  height: 10px;
  margin: 1rem 0;
  overflow: hidden;
  border-radius: var(--radius-full);
  background: var(--surface-active);
}

.profile-progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--gold), var(--success));
}

.progress-breakdown {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.progress-breakdown div {
  padding: 0.7rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-hover);
}

.progress-breakdown span,
.judge-stat-card p,
.judge-stat-card small,
.profile-action-card small {
  color: var(--text-muted);
}

.progress-breakdown span,
.judge-stat-card p {
  display: block;
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
}

.progress-breakdown strong {
  font-size: 1.1rem;
}

.judge-stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.judge-stat-card {
  position: relative;
  padding: 0.95rem;
  overflow: hidden;
}

.judge-stat-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: linear-gradient(90deg, var(--gold), var(--gold-light));
}

.stat-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  margin-bottom: 0.9rem;
  border-radius: var(--radius-md);
  background: var(--gold-soft);
  color: var(--gold-dark);
}

.stat-icon .app-icon {
  width: 1.2rem;
  height: 1.2rem;
}

.judge-stat-card strong {
  display: block;
  margin-top: 0.25rem;
  font-size: clamp(1.35rem, 7vw, 1.85rem);
  line-height: 1;
}

.judge-stat-card small {
  display: block;
  margin-top: 0.45rem;
  font-weight: 700;
}

.profile-actions-grid {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.profile-action-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem;
}

.profile-action-card > span {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  background: var(--navy);
  color: var(--gold-light);
}

.profile-action-card .app-icon {
  width: 1.1rem;
  height: 1.1rem;
}

.profile-action-card strong,
.profile-action-card small {
  display: block;
}

.profile-action-card strong {
  font-size: 0.9rem;
}

.profile-action-card small {
  margin-top: 0.15rem;
  font-size: 0.75rem;
}

.judge-oath-card {
  border-radius: var(--radius-md);
}

.oath-icon {
  display: none;
}

.judge-oath-card h3 {
  font-size: 1rem;
}

.judge-oath-card p {
  margin-top: 0.5rem;
  color: var(--text-muted);
  font-size: 0.86rem;
  line-height: 1.6;
}

@media (max-width: 420px) {
  .profile-overview-card {
    padding: 0.9rem;
  }
}

@media (min-width: 520px) {
  .profile-session-actions {
    grid-template-columns: auto minmax(180px, 260px);
  }
}

@media (min-width: 720px) {
  .judge-stat-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .profile-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
