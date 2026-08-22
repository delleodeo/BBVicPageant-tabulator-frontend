<template>
  <AdminLayout title="Final Round Tabulation">
    <!-- Header Summary & Control Bar -->
    <section class="panel panel-gold no-print">
      <div class="section-head">
        <div>
          <span class="eyebrow">👑 Championship Phase</span>
          <h2>Grand Coronation Final Results</h2>
          <p class="section-subhead">Formula: Round 1 (20%) + Final Intelligence (40%) + Final Beauty (40%)</p>
        </div>

        <div class="button-row">
          <StatusBadge :label="data.round?.status || 'SETUP'" :tone="data.round?.status === 'LOCKED' ? 'success' : 'neutral'" />
          <button v-if="data.round?.status === 'OPEN'" class="btn btn-danger" type="button" @click="confirmFinalLock = true">
            🔒 Lock Final Results & Proclaim Winners
          </button>
          <button class="btn btn-ghost" type="button" @click="printSheet">
            🖨️ Print Sheet
          </button>
          <button class="btn btn-ghost" type="button" @click="download('pdf')">
            📄 Certified PDF
          </button>
          <button class="btn btn-ghost" type="button" @click="download('xls')">
            📊 Excel
          </button>
          <button class="btn btn-ghost" type="button" @click="download('csv')">
            CSV
          </button>
          <RouterLink to="/stage" target="_blank" class="btn btn-gold">
            👑 Stage Mode
          </RouterLink>
        </div>
      </div>

      <p v-if="error" class="error-text" style="margin-top: 0.5rem;">{{ error }}</p>
    </section>

    <LoadingState v-if="loading" label="Final results" />

    <template v-else>
      <!-- Winners Podium Display -->
      <section v-if="data.rankings?.length" class="no-print">
        <ScoreboardPodium :items="data.rankings || []" />
      </section>

      <!-- Final Tabulation Table -->
      <section class="panel no-print">
        <div class="section-head">
          <h3>Final Standings & Titles</h3>
        </div>
        <ResultTable :rows="rows" :columns="columns" />
      </section>

      <!-- Printable Official Sheet -->
      <PrintTabulationSheet
        :pageant="pageantData"
        title="OFFICIAL FINAL ROUND TABULATION RESULTS"
        :rows="rows"
        :extra-columns="printColumns"
        :judges="judgesList"
      />

      <!-- Confirm Lock Dialog -->
      <ConfirmDialog
        :open="confirmFinalLock"
        title="Lock Final Results & Certify Winners"
        message="After locking final results, the pageant competition will be officially concluded. Final placements and winners will be sealed and certified."
        confirm-label="Lock & Proclaim Winners"
        @cancel="confirmFinalLock = false"
        @confirm="lockFinal"
      />
    </template>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import ConfirmDialog from '../../components/ConfirmDialog.vue';
import LoadingState from '../../components/LoadingState.vue';
import PrintTabulationSheet from '../../components/PrintTabulationSheet.vue';
import ResultTable from '../../components/ResultTable.vue';
import ScoreboardPodium from '../../components/ScoreboardPodium.vue';
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
const confirmFinalLock = ref(false);

const titleLabels = ['👑 TITLE WINNER', '🥈 1st Runner Up', '🥉 2nd Runner Up', '4th Place', '5th Place'];

const columns = [
  { title: 'Rank', field: 'rank', sorter: 'number', width: 70 },
  { title: 'Official Title', field: 'titleLabel', width: 170 },
  { title: '#', field: 'number', width: 60 },
  { title: 'Finalist Name', field: 'name', headerFilter: 'input', width: 180 },
  { title: 'Round 1 (20%)', field: 'roundOne' },
  { title: 'Intelligence (40%)', field: 'intelligence' },
  { title: 'Beauty (40%)', field: 'beauty' },
  { title: 'Final Score', field: 'finalScore', sorter: 'number', width: 130 }
];

const printColumns = [
  { key: 'roundOne', label: 'Round 1 (20%)' },
  { key: 'intelligence', label: 'Intelligence (40%)' },
  { key: 'beauty', label: 'Beauty (40%)' }
];

const rows = computed(() =>
  (data.value.rankings || []).map((result, idx) => ({
    id: result.contestant._id,
    rank: result.rank,
    titleLabel: titleLabels[idx] || `Finalist ${result.rank}`,
    number: result.contestant.contestantNumber,
    name: result.contestant.name,
    hometown: result.contestant.hometown || '',
    roundOne: fmt(result.roundOneTotal),
    intelligence: fmt(result.intelligenceAverage),
    beauty: fmt(result.beautyAverage),
    finalScore: fmt(result.finalScore),
    contestant: result.contestant
  }))
);

async function load() {
  const [res, pageantRes, judgesRes] = await Promise.all([
    api.get('/admin/final/results'),
    api.get('/pageant').catch(() => ({ data: { pageant: {} } })),
    api.get('/judges').catch(() => ({ data: { judges: [] } }))
  ]);
  data.value = res.data;
  pageantData.value = pageantRes.data.pageant;
  judgesList.value = judgesRes.data.judges || [];
  loading.value = false;
}

function printSheet() {
  window.print();
}

async function download(format) {
  const response = await api.get(`/admin/exports/final?format=${format}`, { responseType: 'blob' });
  const href = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = href;
  link.download = `official-final-results.${format === 'xls' ? 'xls' : format === 'pdf' ? 'pdf' : 'csv'}`;
  link.click();
  URL.revokeObjectURL(href);
}

async function lockFinal() {
  error.value = '';
  confirmFinalLock.value = false;
  try {
    const response = await api.post('/admin/final/lock');
    data.value = response.data;
  } catch (err) {
    error.value = err.response?.data?.message || 'Unable to lock final results.';
  }
}

onMounted(async () => {
  await load();
  const socket = connectSocket();
  socket.on('results:updated', load);
  socket.on('round:locked', load);
});
</script>
