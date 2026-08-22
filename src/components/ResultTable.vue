<template>
  <div ref="tableRef" class="result-table"></div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { TabulatorFull as Tabulator } from 'tabulator-tables';

const props = defineProps({
  rows: { type: Array, default: () => [] },
  columns: { type: Array, required: true }
});

const tableRef = ref(null);
let table;

onMounted(() => {
  table = new Tabulator(tableRef.value, {
    data: props.rows,
    columns: props.columns,
    layout: 'fitDataStretch',
    responsiveLayout: 'collapse',
    pagination: true,
    paginationSize: 10,
    selectableRows: true
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

