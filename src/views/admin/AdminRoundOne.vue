<template>
  <AdminLayout title="Round 1 Tabulation">
    <!-- Header Controls & Actions -->
    <section class="panel panel-gold no-print">
      <div class="section-head">
        <div>
          <span class="eyebrow"><AppIcon name="roundOne" /> Preliminary Phase Tabulation</span>
          <h2>Round 1 Official Results</h2>
          <p class="section-subhead">Certified rankings computed from all active judge score sheets</p>
        </div>

        <div class="button-row">
          <StatusBadge :label="data.round?.status || 'SETUP'" :tone="data.round?.status === 'LOCKED' ? 'success' : 'neutral'" />
          <button v-if="data.round?.status !== 'OPEN' && data.round?.status !== 'LOCKED'" class="btn btn-gold" type="button" @click="openRound">
            Open Round 1
          </button>
          <button v-if="data.round?.status === 'OPEN'" class="btn btn-danger" type="button" @click="confirmLock = true">
            <AppIcon name="lock" />
            Lock Round 1 & Generate Top 5
          </button>
          <button v-if="data.round?.status === 'LOCKED'" class="btn btn-warning" type="button" @click="confirmUnlock = true">
            <AppIcon name="lockOpen" />
            Unlock Round 1
          </button>
          <button class="btn btn-ghost" type="button" @click="printSheet">
            <AppIcon name="printer" />
            Print Sheet
          </button>
          <button class="btn btn-ghost" type="button" @click="download('pdf')">
            <AppIcon name="document" />
            Certified PDF
          </button>
          <button class="btn btn-ghost" type="button" @click="download('xls')">
            <AppIcon name="chart" />
            Excel
          </button>
          <button class="btn btn-ghost" type="button" @click="download('csv')">
            CSV
          </button>
        </div>
      </div>

      <ProgressBar :value="data.overallProgress || 0" />
      <div class="r1-progress-meta">
        <span>Overall Tabulation Progress: <strong>{{ data.overallProgress || 0 }}%</strong></span>
        <span>Completed: <strong>{{ data.totals?.completedScoreSheets || 0 }} / {{ data.totals?.requiredScoreSheets || 0 }} sheets</strong></span>
      </div>

      <p v-if="error" class="error-text" style="margin-top: 0.75rem;">{{ error }}</p>
    </section>

    <!-- Tie Warning Banner (if tie detected at cutoff) -->
    <section v-if="tieInfo.tied" class="panel panel-warning no-print">
      <div class="tie-banner-content">
        <span class="tie-icon"><AppIcon name="warning" /></span>
        <div>
          <strong style="color: #b45309; font-size: 1.05rem;">Tie Detected at Finalist Cutoff Rank 5</strong>
          <p style="font-size: 0.85rem; color: #78350f; margin-top: 0.2rem;">
            The following delegates share the cutoff total score of {{ tieInfo.tiedScore }} pts:
            <span v-for="c in tieInfo.tiedContestants" :key="c.contestant._id" style="font-weight: 800; margin-left: 0.5rem;">
              #{{ c.contestant.contestantNumber }} {{ c.contestant.name }}
            </span>
          </p>
        </div>
      </div>
    </section>

    <LoadingState v-if="loading" label="Round 1 results" />

    <!-- Official Results Tabulator Table -->
    <section v-else class="panel no-print">
      <div class="section-head">
        <h3>Master Tabulation Leaderboard</h3>
        <span class="card-meta">Weighted % Contribution per Category</span>
      </div>
      <ResultTable :rows="rows" :columns="columns" />
    </section>

    <!-- Judge Completion Grid -->
    <section class="panel no-print">
      <div class="section-head">
        <h3>Judge Scoring Progress</h3>
      </div>
      <div class="list-grid">
        <article v-for="judge in data.judgeProgress || []" :key="judge.judgeId" class="list-item">
          <div>
            <span class="judge-tag">{{ judge.judgeId }}</span>
            <strong>{{ judge.name }}</strong>
          </div>
          <span class="status-badge" :class="judge.complete === judge.total ? 'success' : 'neutral'">
            {{ judge.complete }} / {{ judge.total }}
          </span>
        </article>
      </div>
    </section>

    <!-- Printable Official Sheet -->
    <PrintTabulationSheet
      :pageant="pageantData"
      title="OFFICIAL ROUND 1 TABULATION RESULTS"
      :rows="rows"
      :extra-columns="printColumns"
      :judges="judgesList"
    />

    <!-- Confirm Lock Dialog -->
    <ConfirmDialog
      :open="confirmLock"
      title="Lock Round 1 & Advance Finalists"
      message="After locking, judges can no longer edit Round 1 scores. The Top 5 finalists will be generated and promoted automatically to the Final Round."
      confirm-label="Confirm & Lock Round 1"
      @cancel="confirmLock = false"
      @confirm="lockRound"
    />
    <ConfirmDialog
      :open="confirmUnlock"
      title="Unlock Round 1"
      message="Unlocking will allow judges to edit Round 1 scores again. The current finalists will remain but scores will be editable. You will need to lock again to re-generate finalists."
      confirm-label="Confirm & Unlock Round 1"
      @cancel="confirmUnlock = false"
      @confirm="unlockRound"
    />
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import ConfirmDialog from '../../components/ConfirmDialog.vue';
import AppIcon from '../../components/AppIcon.vue';
import LoadingState from '../../components/LoadingState.vue';
import PrintTabulationSheet from '../../components/PrintTabulationSheet.vue';
import ProgressBar from '../../components/ProgressBar.vue';
import ResultTable from '../../components/ResultTable.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import AdminLayout from '../../layouts/AdminLayout.vue';
import { api } from '../../services/api.js';
import { connectSocket } from '../../services/socket.js';
import { fmt } from '../../utils/score.js';

const data = ref({});
const pageantData = ref(null);
const judgesList = ref([]);
const loading = ref(true);
const error = ref('');
const confirmLock = ref(false);
const confirmUnlock = ref(false);

function makeCell(className, text) {
  const cell = document.createElement('span');
  cell.className = className;
  cell.textContent = text ?? '';
  return cell;
}

function rankFormatter(cell) {
  const rank = cell.getValue();
  const wrap = document.createElement('span');
  wrap.className = 'rank-cell';
  const medal = document.createElement('span');
  medal.className = `rank-medal ${Number(rank) <= 5 ? 'top' : ''}`;
  medal.textContent = rank;
  wrap.appendChild(medal);
  return wrap;
}

function candidateFormatter(cell) {
  const row = cell.getRow().getData();
  const wrap = document.createElement('div');
  wrap.className = 'candidate-cell';
  const name = document.createElement('strong');
  name.textContent = row.name;
  const meta = document.createElement('small');
  meta.textContent = `Candidate #${row.number}`;
  wrap.append(name, meta);
  return wrap;
}

function scoreFormatter(cell) {
  return makeCell('score-cell', cell.getValue());
}

function totalFormatter(cell) {
  return makeCell('total-cell', cell.getValue());
}

function statusFormatter(cell) {
  const value = String(cell.getValue() || '').toLowerCase();
  const pill = makeCell(`status-pill ${value === 'finalist' ? 'finalist' : 'eliminated'}`, cell.getValue());
  return pill;
}

const columns = [
  { title: 'Rank', field: 'rank', sorter: 'number', width: 78, hozAlign: 'center', formatter: rankFormatter },
  { title: '#', field: 'number', width: 62, hozAlign: 'center', formatter: (cell) => makeCell('number-cell', `#${cell.getValue()}`) },
  {
    title: 'Candidate',
    field: 'name',
    headerFilter: 'input',
    headerFilterPlaceholder: 'Search name',
    minWidth: 180,
    formatter: candidateFormatter
  },
  { title: 'Hometown', field: 'hometown', headerFilter: 'input', headerFilterPlaceholder: 'Search town', minWidth: 135 },
  { title: 'Prod 10%', field: 'production', hozAlign: 'right', width: 108, formatter: scoreFormatter },
  { title: 'Swim 10%', field: 'swimsuit', hozAlign: 'right', width: 108, formatter: scoreFormatter },
  { title: 'Costume 30%', field: 'festival', hozAlign: 'right', width: 124, formatter: scoreFormatter },
  { title: 'Gown 20%', field: 'gown', hozAlign: 'right', width: 112, formatter: scoreFormatter },
  { title: 'B&I 30%', field: 'beauty', hozAlign: 'right', width: 108, formatter: scoreFormatter },
  { title: 'Total', field: 'total', sorter: 'number', hozAlign: 'right', width: 112, formatter: totalFormatter },
  { title: 'Status', field: 'status', headerFilter: 'input', headerFilterPlaceholder: 'Filter', width: 132, formatter: statusFormatter }
];

const printColumns = [
  { key: 'production', label: 'Production (10%)' },
  { key: 'swimsuit', label: 'Swimsuit (10%)' },
  { key: 'festival', label: 'Costume (30%)' },
  { key: 'gown', label: 'Gown (20%)' },
  { key: 'beauty', label: 'B&I (30%)' }
];

const rows = computed(() =>
  (data.value.rankings || []).map((result) => ({
    id: result.contestant._id,
    rank: result.rank,
    number: result.contestant.contestantNumber,
    name: result.contestant.name,
    hometown: result.contestant.hometown || '',
    production: fmt(result.categories.find((category) => category.key === 'productionOutfit')?.weighted),
    swimsuit: fmt(result.categories.find((category) => category.key === 'swimsuit')?.weighted),
    festival: fmt(result.categories.find((category) => category.key === 'festivalCostume')?.weighted),
    gown: fmt(result.categories.find((category) => category.key === 'eveningGown')?.weighted),
    beauty: fmt(result.categories.find((category) => category.key === 'beautyIntelligence')?.weighted),
    total: fmt(result.total),
    status: result.contestant.status
  }))
);

const tieInfo = computed(() => {
  const rankings = data.value.rankings || [];
  if (rankings.length < 6) return { tied: false };
  const r5 = rankings[4];
  const r6 = rankings[5];
  if (r5 && r6 && r5.total === r6.total && r5.total != null) {
    return {
      tied: true,
      tiedScore: r5.total,
      tiedContestants: rankings.filter((r) => r.total === r5.total)
    };
  }
  return { tied: false };
});

async function load() {
  const [resultsRes, pageantRes, judgesRes] = await Promise.all([
    api.get('/admin/round-one/results'),
    api.get('/pageant').catch(() => ({ data: { pageant: {} } })),
    api.get('/judges').catch(() => ({ data: { judges: [] } }))
  ]);
  data.value = resultsRes.data;
  pageantData.value = pageantRes.data.pageant;
  judgesList.value = judgesRes.data.judges || [];
  loading.value = false;
}

function printSheet() {
  window.print();
}

async function download(format) {
  const response = await api.get(`/admin/exports/round-one?format=${format}`, { responseType: 'blob' });
  const href = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = href;
  link.download = `official-round-one-results.${format === 'xls' ? 'xls' : format === 'pdf' ? 'pdf' : 'csv'}`;
  link.click();
  URL.revokeObjectURL(href);
}

async function openRound() {
  await api.post('/admin/round-one/open');
  await load();
}

async function lockRound() {
  error.value = '';
  confirmLock.value = false;
  try {
    const response = await api.post('/admin/round-one/lock');
    data.value = response.data;
  } catch (err) {
    error.value = err.response?.data?.message || 'Unable to lock Round 1.';
  }
}

async function unlockRound() {
  error.value = '';
  confirmUnlock.value = false;
  try {
    const response = await api.post('/admin/round-one/unlock');
    data.value = { ...data.value, round: response.data.round };
    await load();
  } catch (err) {
    error.value = err.response?.data?.message || 'Unable to unlock Round 1.';
  }
}

onMounted(async () => {
  await load();
  const socket = connectSocket();
  socket.emit('admin:join');
  socket.on('results:updated', load);
  socket.on('progress:updated', load);
});
</script>

<style scoped>
.r1-progress-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
  color: var(--text-muted);
  margin-top: 0.35rem;
}

.panel-warning {
  background: #fffbeb;
  border-color: #fde68a;
}

.tie-banner-content {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.tie-icon {
  display: grid;
  place-items: center;
}

.tie-icon .app-icon {
  width: 1.6rem;
  height: 1.6rem;
}

.judge-tag {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--gold-dark);
  margin-right: 0.4rem;
}

.btn-warning {
  background: #f59e0b;
  color: #1c1403;
  border: none;
  font-weight: 700;
}

.btn-warning:hover {
  background: #d97706;
  color: #fff;
}
</style>
