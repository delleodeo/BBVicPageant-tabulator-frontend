<template>
  <AdminLayout title="Audit Trail & System Logs">
    <section class="panel panel-gold">
      <div class="section-head">
        <div>
          <span class="eyebrow">📜 Security & Compliance</span>
          <h2>Tamper-Proof Audit Trail</h2>
          <p class="section-subhead">Every score submission, judge action, round status change, and setting update is logged</p>
        </div>

        <div class="button-row">
          <button type="button" class="btn btn-ghost" @click="load">
            🔄 Refresh Trail
          </button>
        </div>
      </div>
    </section>

    <!-- Filters & Search -->
    <div class="filter-search-bar">
      <div class="filter-chips">
        <button
          type="button"
          class="filter-chip"
          :class="{ active: filterAction === 'ALL' }"
          @click="filterAction = 'ALL'"
        >
          All Logs ({{ logs.length }})
        </button>
        <button
          type="button"
          class="filter-chip"
          :class="{ active: filterAction === 'SCORES' }"
          @click="filterAction = 'SCORES'"
        >
          Score Submissions
        </button>
        <button
          type="button"
          class="filter-chip"
          :class="{ active: filterAction === 'ROUNDS' }"
          @click="filterAction = 'ROUNDS'"
        >
          Round State Changes
        </button>
        <button
          type="button"
          class="filter-chip"
          :class="{ active: filterAction === 'JUDGES' }"
          @click="filterAction = 'JUDGES'"
        >
          Judge Actions
        </button>
      </div>

      <div class="search-input-wrap">
        <input v-model="searchQuery" placeholder="Search by judge ID, action, keyword..." />
      </div>
    </div>

    <LoadingState v-if="loading" label="audit logs" />

    <section v-else-if="filteredLogs.length > 0" class="panel">
      <table class="plain-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Role</th>
            <th>Action Code</th>
            <th>Judge ID</th>
            <th>Round</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in filteredLogs" :key="log._id">
            <td style="white-space: nowrap; font-size: 0.82rem; color: var(--text-muted);">
              {{ new Date(log.timestamp).toLocaleString() }}
            </td>
            <td>
              <span class="status-badge" :class="log.role === 'admin' ? 'neutral' : 'info'">
                {{ log.role }}
              </span>
            </td>
            <td>
              <code class="action-code-pill">{{ log.action }}</code>
            </td>
            <td>
              <strong>{{ log.judgeId || '-' }}</strong>
            </td>
            <td>
              <span class="status-badge" :class="log.round ? 'success' : 'neutral'">
                {{ log.round || 'SYSTEM' }}
              </span>
            </td>
            <td>
              <button
                v-if="log.newValue || log.previousValue"
                type="button"
                class="btn btn-ghost btn-sm"
                @click="openDetailsModal(log)"
              >
                Inspect Diff
              </button>
              <span v-else class="text-muted">-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <EmptyState v-else message="No audit log entries match your filter." />

    <!-- Inspect Log Modal -->
    <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
      <div class="modal-panel modal-panel-lg">
        <div class="section-head">
          <h3>Audit Record Inspection</h3>
          <button type="button" class="btn btn-ghost btn-sm" @click="showModal = false">✕</button>
        </div>

        <div v-if="selectedLog" class="log-details-stack">
          <div class="log-meta-row">
            <div>
              <span class="meta-label">Action</span>
              <code>{{ selectedLog.action }}</code>
            </div>
            <div>
              <span class="meta-label">Time</span>
              <span>{{ new Date(selectedLog.timestamp).toLocaleString() }}</span>
            </div>
            <div>
              <span class="meta-label">Judge</span>
              <strong>{{ selectedLog.judgeId || 'Admin' }}</strong>
            </div>
          </div>

          <div v-if="selectedLog.previousValue" class="diff-box">
            <span class="diff-label">Previous State:</span>
            <pre>{{ JSON.stringify(selectedLog.previousValue, null, 2) }}</pre>
          </div>

          <div v-if="selectedLog.newValue" class="diff-box">
            <span class="diff-label">New State / Recorded Values:</span>
            <pre>{{ JSON.stringify(selectedLog.newValue, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import EmptyState from '../../components/EmptyState.vue';
import LoadingState from '../../components/LoadingState.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import AdminLayout from '../../layouts/AdminLayout.vue';
import { api } from '../../services/api.js';

const logs = ref([]);
const loading = ref(true);
const filterAction = ref('ALL');
const searchQuery = ref('');
const showModal = ref(false);
const selectedLog = ref(null);

async function load() {
  loading.value = true;
  const { data } = await api.get('/admin/audit-logs');
  logs.value = data.logs || [];
  loading.value = false;
}

const filteredLogs = computed(() => {
  return logs.value.filter((log) => {
    // Action category filter
    if (filterAction.value === 'SCORES' && !log.action.includes('SCORE')) return false;
    if (filterAction.value === 'ROUNDS' && !log.action.includes('ROUND') && !log.action.includes('FINALIST')) return false;
    if (filterAction.value === 'JUDGES' && !log.action.includes('JUDGE')) return false;

    // Search query
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const mAction = log.action?.toLowerCase().includes(q);
      const mJudge = log.judgeId?.toLowerCase().includes(q);
      const mRole = log.role?.toLowerCase().includes(q);
      return mAction || mJudge || mRole;
    }

    return true;
  });
});

function openDetailsModal(log) {
  selectedLog.value = log;
  showModal.value = true;
}

onMounted(load);
</script>

<style scoped>
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
  min-width: 260px;
}

.action-code-pill {
  font-size: 0.75rem;
  background: var(--surface-hover);
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
  color: var(--navy);
  font-weight: 800;
}

.log-details-stack {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.log-meta-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  background: var(--surface-hover);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
}

.meta-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
}

.diff-box {
  background: #0d1b2a;
  color: #e2e8f0;
  border-radius: var(--radius-md);
  padding: 1rem;
  overflow-x: auto;
}

.diff-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--gold-light);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}

.diff-box pre {
  font-size: 0.82rem;
  font-family: monospace;
}
</style>
