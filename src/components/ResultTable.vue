<template>
  <div class="result-table-shell">
    <div ref="tableRef" class="result-table"></div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { TabulatorFull as Tabulator } from 'tabulator-tables';

const props = defineProps({
  rows: { type: Array, default: () => [] },
  columns: { type: Array, required: true },
  paginationSize: { type: Number, default: 10 }
});

const tableRef = ref(null);
let table;

onMounted(() => {
  table = new Tabulator(tableRef.value, {
    data: props.rows,
    columns: props.columns,
    layout: 'fitColumns',
    responsiveLayout: 'collapse',
    pagination: true,
    paginationSize: props.paginationSize,
    selectableRows: false,
    initialSort: [{ column: 'rank', dir: 'asc' }],
    placeholder: 'No tabulation results available yet.'
  });
});

watch(
  () => props.rows,
  (rows) => {
    table?.replaceData(rows);
  },
  { deep: true }
);

onBeforeUnmount(() => {
  table?.destroy();
});
</script>

<style scoped>
.result-table-shell {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.result-table {
  min-width: 920px;
}

.result-table-shell :deep(.tabulator) {
  border: 0;
  background: var(--surface);
  color: var(--text-main);
  font-family: inherit;
  font-size: 0.86rem;
}

.result-table-shell :deep(.tabulator-header) {
  border-bottom: 1px solid var(--border);
  background: var(--surface-hover);
  color: var(--text-muted);
  font-weight: 800;
}

.result-table-shell :deep(.tabulator-col) {
  border-right: 1px solid var(--border);
  background: transparent;
}

.result-table-shell :deep(.tabulator-col-title) {
  color: var(--text-muted);
  font-size: 0.74rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.result-table-shell :deep(.tabulator-header-filter input) {
  min-height: 32px;
  padding: 0.4rem 0.55rem;
  border-radius: var(--radius-sm);
  border-color: var(--border);
  background: var(--surface);
  font-size: 0.78rem;
}

.result-table-shell :deep(.tabulator-row) {
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-main);
  transition: background 140ms ease;
}

.result-table-shell :deep(.tabulator-row:nth-child(even)) {
  background: var(--surface-hover);
}

.result-table-shell :deep(.tabulator-row:hover) {
  background: rgba(201, 154, 46, 0.08);
}

.result-table-shell :deep(.tabulator-cell) {
  display: inline-flex;
  align-items: center;
  min-height: 42px;
  padding: 0.55rem 0.65rem;
  border-right: 1px solid var(--border);
  color: var(--text-main);
}

.result-table-shell :deep(.tabulator-footer) {
  border-top: 1px solid var(--border);
  background: var(--surface);
  padding: 0.55rem;
}

.result-table-shell :deep(.tabulator-page) {
  min-width: 34px;
  min-height: 34px;
  margin: 0 0.12rem;
  padding: 0.35rem 0.55rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text-main);
  font-weight: 800;
}

.result-table-shell :deep(.tabulator-page.active) {
  border-color: var(--gold);
  background: var(--gold-soft);
  color: var(--gold-dark);
}

.result-table-shell :deep(.rank-cell),
.result-table-shell :deep(.number-cell),
.result-table-shell :deep(.score-cell),
.result-table-shell :deep(.total-cell),
.result-table-shell :deep(.status-cell) {
  width: 100%;
}

.result-table-shell :deep(.rank-cell),
.result-table-shell :deep(.number-cell) {
  justify-content: center;
  font-weight: 900;
}

.result-table-shell :deep(.rank-medal) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.85rem;
  height: 1.85rem;
  border-radius: var(--radius-full);
  background: var(--surface-hover);
  color: var(--text-main);
  font-size: 0.8rem;
  font-weight: 900;
}

.result-table-shell :deep(.rank-medal.top) {
  background: linear-gradient(135deg, var(--gold-light), var(--gold-dark));
  color: var(--navy-darkest);
}

.result-table-shell :deep(.candidate-cell) {
  display: grid;
  gap: 0.1rem;
  width: 100%;
  min-width: 0;
}

.result-table-shell :deep(.candidate-cell strong) {
  overflow: hidden;
  color: var(--text-main);
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-table-shell :deep(.candidate-cell small) {
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 700;
}

.result-table-shell :deep(.score-cell),
.result-table-shell :deep(.total-cell) {
  justify-content: flex-end;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  color: var(--text-main);
}

.result-table-shell :deep(.total-cell) {
  color: var(--gold-dark);
  font-size: 0.95rem;
  font-weight: 900;
}

[data-theme='dark'] .result-table-shell :deep(.total-cell) {
  color: var(--gold-light);
}

.result-table-shell :deep(.status-pill) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 6rem;
  padding: 0.28rem 0.65rem;
  border-radius: var(--radius-full);
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.result-table-shell :deep(.status-pill.finalist) {
  border: 1px solid rgba(16, 185, 129, 0.25);
  background: var(--success-soft);
  color: var(--success);
}

.result-table-shell :deep(.status-pill.eliminated) {
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: var(--surface-hover);
  color: var(--text-muted);
}

[data-theme='dark'] .result-table-shell {
  background: var(--surface);
}

[data-theme='dark'] .result-table-shell :deep(.tabulator-header) {
  background: #17283f;
}

[data-theme='dark'] .result-table-shell :deep(.tabulator-row) {
  background: #0f1c2e;
  color: #f8fafc;
}

[data-theme='dark'] .result-table-shell :deep(.tabulator-row:nth-child(even)) {
  background: #14243a;
}

[data-theme='dark'] .result-table-shell :deep(.tabulator-row:hover) {
  background: #1b3150;
}

[data-theme='dark'] .result-table-shell :deep(.tabulator-cell),
[data-theme='dark'] .result-table-shell :deep(.score-cell),
[data-theme='dark'] .result-table-shell :deep(.candidate-cell strong),
[data-theme='dark'] .result-table-shell :deep(.number-cell) {
  color: #f8fafc;
}

[data-theme='dark'] .result-table-shell :deep(.candidate-cell small),
[data-theme='dark'] .result-table-shell :deep(.tabulator-col-title) {
  color: #cbd5e1;
}

[data-theme='dark'] .result-table-shell :deep(.tabulator-header-filter input) {
  background: #0f1c2e;
  border-color: rgba(255, 255, 255, 0.12);
  color: #f8fafc;
}

[data-theme='dark'] .result-table-shell :deep(.tabulator-header-filter input::placeholder) {
  color: #94a3b8;
}

[data-theme='dark'] .result-table-shell :deep(.status-pill.eliminated) {
  background: #1b3150;
  color: #cbd5e1;
  border-color: rgba(148, 163, 184, 0.3);
}

@media (max-width: 640px) {
  .result-table-shell {
    margin-left: -0.5rem;
    margin-right: -0.5rem;
    border-radius: var(--radius-md);
  }

  .result-table {
    min-width: 780px;
  }
}
</style>
