<template>
  <div class="live-matrix-wrap">
    <div class="matrix-header">
      <div>
        <h3>Live Judge Scoring Matrix</h3>
        <p class="matrix-sub">Real-time status of all judge submissions across contestants</p>
      </div>
      <div class="matrix-legend">
        <span class="legend-item"><span class="dot dot-active"></span> Scoring Now</span>
        <span class="legend-item"><span class="dot dot-complete"></span> Completed</span>
        <span class="legend-item"><span class="dot dot-pending"></span> In Progress</span>
        <span class="legend-item"><span class="dot dot-empty"></span> Not Started</span>
      </div>
    </div>

    <div class="matrix-table-scroll">
      <table class="matrix-table">
        <thead>
          <tr>
            <th class="sticky-col">Contestant</th>
            <th v-for="judge in judges" :key="judge.judgeId" class="judge-header-col">
              <div class="judge-th-content">
                <span class="judge-badge-pill" :class="{ 'is-online': isJudgeOnline(judge.judgeId) }">
                  {{ judge.judgeId }}
                </span>
                <span class="judge-th-name">{{ judge.name }}</span>
                <span v-if="isJudgeOnline(judge.judgeId)" class="online-indicator">Online</span>
              </div>
            </th>
            <th class="matrix-stat-col">Progress</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="contestant in contestants" :key="contestant._id">
            <td class="sticky-col contestant-cell">
              <div class="contestant-cell-info">
                <strong class="c-num">#{{ contestant.contestantNumber }}</strong>
                <span class="c-name">{{ contestant.name }}</span>
              </div>
            </td>

            <td v-for="judge in judges" :key="judge.judgeId" class="matrix-cell">
              <div
                class="status-cell-indicator"
                :class="getCellStatusClass(judge.judgeId, contestant._id)"
                :title="getCellTooltip(judge.judgeId, contestant._id)"
              >
                <template v-if="isJudgeActivelyScoring(judge.judgeId, contestant._id)">
                  <span class="active-pulse"></span>
                  <span class="cell-label">SCORING</span>
                </template>
                <template v-else-if="isContestantJudgeComplete(judge.judgeId, contestant._id)">
                  <span class="check-icon">✓</span>
                  <span class="cell-score">{{ getJudgeContestantTotal(judge.judgeId, contestant._id) }}</span>
                </template>
                <template v-else-if="hasPartialScores(judge.judgeId, contestant._id)">
                  <span class="cell-label-partial">IN PROGRESS</span>
                </template>
                <template v-else>
                  <span class="cell-dash">-</span>
                </template>
              </div>
            </td>

            <td class="matrix-stat-col">
              <span class="progress-pill">
                {{ getContestantCompletionCount(contestant._id) }} / {{ judges.length }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>

const props = defineProps({
  judges: { type: Array, default: () => [] },
  contestants: { type: Array, default: () => [] },
  scores: { type: Array, default: () => [] },
  onlineJudges: { type: Array, default: () => [] },
  activeActivities: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] }
});

function isJudgeOnline(judgeId) {
  return props.onlineJudges.some((j) => j.judgeId === judgeId);
}

function isJudgeActivelyScoring(judgeId, contestantId) {
  return props.onlineJudges.some(
    (j) => j.judgeId === judgeId && String(j.activeContestantId) === String(contestantId)
  );
}

function findScore(judgeId, contestantId) {
  return props.scores.find(
    (s) => s.judgeId === judgeId && String(s.contestantId?._id || s.contestantId) === String(contestantId)
  );
}

function isContestantJudgeComplete(judgeId, contestantId) {
  const score = findScore(judgeId, contestantId);
  if (!score) return false;
  return props.categories.length > 0 && props.categories.every((category) => score[category.key] != null);
}

function hasPartialScores(judgeId, contestantId) {
  const score = findScore(judgeId, contestantId);
  if (!score) return false;
  return props.categories.some((category) => typeof score[category.key] === 'number');
}

function getJudgeContestantTotal(judgeId, contestantId) {
  const score = findScore(judgeId, contestantId);
  if (!score) return '-';
  const scoredCategories = props.categories.filter((category) => typeof score[category.key] === 'number');
  if (!scoredCategories.length) return '-';
  return scoredCategories.reduce(
    (total, category) => total + Number(score[category.key]) * (Number(category.weight) / 10),
    0
  ).toFixed(1);
}

function getCellStatusClass(judgeId, contestantId) {
  if (isJudgeActivelyScoring(judgeId, contestantId)) return 'state-active';
  if (isContestantJudgeComplete(judgeId, contestantId)) return 'state-complete';
  if (hasPartialScores(judgeId, contestantId)) return 'state-partial';
  return 'state-empty';
}

function getCellTooltip(judgeId, contestantId) {
  if (isJudgeActivelyScoring(judgeId, contestantId)) return `${judgeId} is currently scoring this contestant`;
  if (isContestantJudgeComplete(judgeId, contestantId)) return `Completed by ${judgeId}`;
  if (hasPartialScores(judgeId, contestantId)) return `Partially scored by ${judgeId}`;
  return `Not yet scored by ${judgeId}`;
}

function getContestantCompletionCount(contestantId) {
  return props.judges.filter((j) => isContestantJudgeComplete(j.judgeId, contestantId)).length;
}
</script>

<style scoped>
.live-matrix-wrap {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.matrix-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.matrix-sub {
  font-size: 0.84rem;
  color: var(--text-muted);
  margin-top: 0.2rem;
}

.matrix-legend {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-muted);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-active { background: #3b82f6; box-shadow: 0 0 8px #3b82f6; }
.dot-complete { background: #10b981; }
.dot-pending { background: #f59e0b; }
.dot-empty { background: #cbd5e1; }

.matrix-table-scroll {
  overflow-x: auto;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  font-size: 0.85rem;
}

.matrix-table th {
  background: var(--surface-hover);
  padding: 0.75rem 0.6rem;
  border-bottom: 2px solid var(--border);
  border-right: 1px solid var(--border);
}

.matrix-table td {
  padding: 0.6rem 0.5rem;
  border-bottom: 1px solid var(--border);
  border-right: 1px solid var(--border);
}

.sticky-col {
  position: sticky;
  left: 0;
  background: var(--surface);
  z-index: 2;
  text-align: left;
  min-width: 180px;
  border-right: 2px solid var(--border) !important;
}

.judge-header-col {
  min-width: 110px;
}

.judge-th-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}

.judge-badge-pill {
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-full);
  background: var(--surface-active);
  color: var(--text-muted);
}

.judge-badge-pill.is-online {
  background: var(--gold-soft);
  color: var(--gold-dark);
  border: 1px solid var(--gold);
}

.judge-th-name {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
}

.online-indicator {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--success);
  text-transform: uppercase;
}

.contestant-cell-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.c-num {
  background: var(--surface-active);
  padding: 0.2rem 0.45rem;
  border-radius: var(--radius-sm);
  color: var(--text-main);
  font-size: 0.8rem;
}

.c-name {
  font-weight: 700;
  white-space: nowrap;
}

.status-cell-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  width: 100%;
  min-height: 34px;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  font-weight: 800;
  transition: all 150ms ease;
}

.state-active {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #93c5fd;
  animation: pulseBg 1.5s infinite;
}

.state-complete {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.state-partial {
  background: #fffbeb;
  color: #d97706;
  border: 1px solid #fde68a;
}

.state-empty {
  color: #94a3b8;
  background: var(--surface-hover);
}

.active-pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2563eb;
  box-shadow: 0 0 6px #2563eb;
}

.cell-label {
  font-size: 0.68rem;
  letter-spacing: 0.04em;
}

.cell-score {
  font-size: 0.82rem;
  font-weight: 900;
}

.progress-pill {
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-full);
  background: var(--surface-hover);
  color: var(--text-main);
}

@keyframes pulseBg {
  0%, 100% { background: #eff6ff; }
  50% { background: #dbeafe; }
}
</style>
