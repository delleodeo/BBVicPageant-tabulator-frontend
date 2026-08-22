<template>
  <div class="print-tabulation-sheet">
    <div class="print-header">
      <div class="print-org-name">{{ pageant?.organizationName || 'Official Board of Tabulators' }}</div>
      <h1 class="print-pageant-title">{{ pageant?.pageantName || 'Pageant Tabulation' }}</h1>
      <h2 class="print-event-title">{{ pageant?.eventName || 'Grand Coronation Night' }}</h2>
      <p class="print-meta">{{ pageant?.venue }} | {{ title }}</p>
    </div>

    <table class="print-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>#</th>
          <th>Candidate Name</th>
          <th>Hometown</th>
          <th v-for="col in extraColumns" :key="col.key">{{ col.label }}</th>
          <th>Total Score</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.contestant?._id || row.id">
          <td class="text-center font-bold">{{ row.rank }}</td>
          <td class="text-center font-bold">#{{ row.contestant?.contestantNumber || row.number }}</td>
          <td class="font-bold">{{ row.contestant?.name || row.name }}</td>
          <td>{{ row.contestant?.hometown || row.hometown || '-' }}</td>
          <td v-for="col in extraColumns" :key="col.key" class="text-center">
            {{ getColValue(row, col.key) }}
          </td>
          <td class="text-center font-bold">{{ row.finalScore ?? row.total }}</td>
          <td class="text-center">{{ row.contestant?.status || row.status }}</td>
        </tr>
      </tbody>
    </table>

    <div class="print-certification">
      <p class="cert-text">
        <strong>BOARD OF JUDGES & TABULATION CERTIFICATION:</strong> We hereby certify that the scores, ratings, and rankings indicated above are true, accurate, and computed strictly in accordance with the official pageant rules, criteria, and weights.
      </p>

      <div class="print-signatures-grid">
        <div v-for="judge in judges" :key="judge.judgeId" class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-name">{{ judge.name }}</div>
          <div class="sig-title">{{ judge.designation || 'Member, Board of Judges' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  pageant: { type: Object, default: null },
  title: { type: String, default: 'Official Results' },
  rows: { type: Array, default: () => [] },
  extraColumns: { type: Array, default: () => [] },
  judges: { type: Array, default: () => [] }
});

function getColValue(row, key) {
  if (row[key] !== undefined) return row[key];
  if (row.categories) {
    const cat = row.categories.find((c) => c.key === key);
    return cat?.weighted ?? cat?.average ?? '-';
  }
  return '-';
}
</script>

<style scoped>
.print-tabulation-sheet {
  display: none;
}

@media print {
  .print-tabulation-sheet {
    display: block !important;
    font-family: 'Times New Roman', Times, serif;
    color: #000;
    padding: 10px;
  }

  .print-header {
    text-align: center;
    border-bottom: 2px solid #000;
    padding-bottom: 12px;
    margin-bottom: 16px;
  }

  .print-org-name {
    font-size: 11pt;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .print-pageant-title {
    font-size: 16pt;
    font-weight: bold;
    margin: 2px 0;
  }

  .print-event-title {
    font-size: 13pt;
    margin: 2px 0;
  }

  .print-meta {
    font-size: 9pt;
    font-style: italic;
  }

  .print-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    font-size: 9pt;
  }

  .print-table th, .print-table td {
    border: 1px solid #000;
    padding: 5px 6px;
  }

  .print-table th {
    background: #e5e7eb;
    text-align: center;
    font-weight: bold;
  }

  .text-center { text-align: center; }
  .font-bold { font-weight: bold; }

  .print-certification {
    margin-top: 25px;
    page-break-inside: avoid;
  }

  .cert-text {
    font-size: 8.5pt;
    text-align: justify;
    line-height: 1.3;
    margin-bottom: 25px;
  }

  .print-signatures-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 30px 20px;
  }

  .sig-box {
    text-align: center;
  }

  .sig-line {
    border-top: 1px solid #000;
    margin-bottom: 4px;
  }

  .sig-name {
    font-weight: bold;
    font-size: 9pt;
  }

  .sig-title {
    font-size: 7.5pt;
    color: #444;
  }
}
</style>

