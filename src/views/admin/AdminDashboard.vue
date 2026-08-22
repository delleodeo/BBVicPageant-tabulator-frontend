<template>
  <AdminLayout title="Tabulation Command Center">
    <LoadingState v-if="loading" label="dashboard" />
    <template v-else>
      <!-- Key Metrics Overview Grid -->
      <section class="metric-grid">
        <ScoreSummary>
          <p>Total Candidates</p>
          <strong>{{ stats.contestants }}</strong>
          <span class="card-meta">Official Contestants</span>
        </ScoreSummary>

        <ScoreSummary>
          <p>Accredited Judges</p>
          <strong>{{ onlineJudgesCount }} / {{ stats.judges }} Online</strong>
          <span class="card-meta">{{ onlineJudgesCount }} active on system</span>
        </ScoreSummary>

        <ScoreSummary>
          <p>Round 1 Progress</p>
          <strong>{{ roundOne.overallProgress || 0 }}%</strong>
          <span class="card-meta">{{ roundOne.totals?.completedScoreSheets || 0 }} of {{ roundOne.totals?.requiredScoreSheets || 0 }} sheets</span>
        </ScoreSummary>

        <ScoreSummary>
          <p>Final Round Status</p>
          <strong>{{ finalists.length ? '5 Finalists' : 'Setup' }}</strong>
          <span class="card-meta">{{ finalResults.round?.status || 'Awaiting R1 Lock' }}</span>
        </ScoreSummary>
      </section>

      <!-- Quick Control Action Bar -->
      <section class="panel panel-gold admin-quick-actions">
        <div class="action-info">
          <span class="eyebrow">Round Control Operations</span>
          <h3>Current Phase: {{ activePhaseLabel }}</h3>
        </div>

        <div class="button-row">
          <button
            v-if="roundOne.round?.status !== 'OPEN' && roundOne.round?.status !== 'LOCKED'"
            type="button"
            class="btn btn-gold"
            @click="openRoundOne"
          >
            ⭐ Open Round 1
          </button>

          <RouterLink
            v-if="roundOne.round?.status === 'OPEN'"
            to="/admin/round-one"
            class="btn btn-primary"
          >
            Review Round 1 Submissions
          </RouterLink>

          <RouterLink
            to="/admin/special-awards"
            class="btn btn-ghost"
          >
            🏆 Special Awards
          </RouterLink>

          <RouterLink
            to="/stage"
            target="_blank"
            class="btn btn-gold"
          >
            👑 Open Stage Screen (Projector)
          </RouterLink>
        </div>
      </section>

      <!-- Live Interactive Judge Matrix -->
      <section id="matrix">
        <LiveJudgeMatrix
          :judges="judgesList"
          :contestants="contestantsList"
          :scores="allR1Scores"
          :online-judges="onlineJudges"
          :categories="roundOneCategories"
        />
      </section>

      <!-- Podium & Judge Individual Breakdown -->
      <div class="dashboard-split-grid">
        <!-- Top 5 Live Podium -->
        <ScoreboardPodium :items="roundOne.rankings || []" />

        <!-- Judge Completion List -->
        <section class="panel">
          <div class="section-head">
            <div>
              <h3>Judge Scoring Progress</h3>
              <p class="section-subhead">Individual sheet completion per judge</p>
            </div>
            <RouterLink class="btn btn-ghost btn-sm" to="/admin/judges">Manage Judges</RouterLink>
          </div>

          <div class="judge-progress-stack">
            <div v-for="judge in roundOne.judgeProgress || []" :key="judge.judgeId" class="judge-progress-row">
              <div class="judge-row-header">
                <div class="judge-row-name-wrap">
                  <span class="judge-badge-num">{{ judge.judgeId }}</span>
                  <strong>{{ judge.name }}</strong>
                  <span v-if="isJudgeOnline(judge.judgeId)" class="status-badge success btn-sm">Online</span>
                </div>
                <span class="judge-row-tally">{{ judge.complete }} / {{ judge.total }} Complete</span>
              </div>

              <div class="progress-wrap">
                <div
                  class="progress-fill"
                  :style="{ width: `${judge.total ? (judge.complete / judge.total) * 100 : 0}%` }"
                ></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </template>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import LiveJudgeMatrix from '../../components/LiveJudgeMatrix.vue';
import LoadingState from '../../components/LoadingState.vue';
import ProgressBar from '../../components/ProgressBar.vue';
import ScoreboardPodium from '../../components/ScoreboardPodium.vue';
import ScoreSummary from '../../components/ScoreSummary.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import AdminLayout from '../../layouts/AdminLayout.vue';
import { api } from '../../services/api.js';
import { connectSocket } from '../../services/socket.js';
import { roundOneCategories } from '../../utils/score.js';

const loading = ref(true);
const roundOne = ref({});
const finalResults = ref({});
const finalists = ref([]);
const judgesList = ref([]);
const contestantsList = ref([]);
const allR1Scores = ref([]);
const onlineJudges = ref([]);

const stats = computed(() => roundOne.value.totals || { contestants: 0, judges: 0 });
const onlineJudgesCount = computed(() => onlineJudges.value.length);

const activePhaseLabel = computed(() => {
  if (finalResults.value.round?.status === 'OPEN') return 'Final Round Open (Top 5 Scoring)';
  if (finalResults.value.round?.status === 'LOCKED') return 'Pageant Concluded (Final Results Locked)';
  if (roundOne.value.round?.status === 'OPEN') return 'Round 1 Open (Preliminary Competition)';
  if (roundOne.value.round?.status === 'LOCKED') return 'Round 1 Locked (Top 5 Generated)';
  return 'Pre-Pageant Setup';
});

function isJudgeOnline(judgeId) {
  return onlineJudges.value.some((j) => j.judgeId === judgeId);
}

async function openRoundOne() {
  await api.post('/admin/round-one/open');
  await load();
}

async function load() {
  const [r1Res, finalRes, finalistsRes, judgesRes, contestantsRes] = await Promise.all([
    api.get('/admin/round-one/results'),
    api.get('/admin/final/results').catch(() => ({ data: {} })),
    api.get('/admin/finalists').catch(() => ({ data: { finalists: [] } })),
    api.get('/judges').catch(() => ({ data: { judges: [] } })),
    api.get('/contestants').catch(() => ({ data: { contestants: [] } }))
  ]);

  roundOne.value = r1Res.data;
  finalResults.value = finalRes.data || {};
  finalists.value = finalistsRes.data?.finalists || [];
  judgesList.value = (judgesRes.data?.judges || []).filter((j) => j.status === 'active');
  contestantsList.value = contestantsRes.data?.contestants || [];

  // Extract raw score entries if available or synthesize from ranking calculations
  if (r1Res.data?.rankings) {
    const scores = [];
    for (const r of r1Res.data.rankings) {
      if (r.contestant?._id) {
        // fetch judge scores
      }
    }
  }

  loading.value = false;
}

onMounted(async () => {
  await load();
  const socket = connectSocket();
  socket.emit('admin:join');
  socket.on('presence:judges', (list) => {
    onlineJudges.value = list || [];
  });
  socket.on('judge:activity_updated', (activity) => {
    const existing = onlineJudges.value.find((j) => j.judgeId === activity.judgeId);
    if (existing) {
      existing.activeContestantId = activity.contestantId;
      existing.round = activity.round;
    }
  });
  socket.on('results:updated', load);
  socket.on('progress:updated', load);
  socket.on('finalists:generated', load);
  socket.on('round:opened', load);
  socket.on('round:locked', load);
});
</script>

<style scoped>
.admin-quick-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.25rem;
}

.action-info h3 {
  font-size: 1.2rem;
  font-weight: 800;
  margin-top: 0.2rem;
}

.dashboard-split-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.judge-progress-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.judge-progress-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.judge-row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.judge-row-name-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.judge-badge-num {
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-full);
  background: var(--surface-active);
}

.judge-row-tally {
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--gold-dark);
}

@media (max-width: 900px) {
  .dashboard-split-grid {
    grid-template-columns: 1fr;
  }
}
</style>
