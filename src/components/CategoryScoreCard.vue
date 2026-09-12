<template>
  <article
    class="score-card"
    :class="{ 'is-scored': hasScore, 'is-saving': saving, 'is-queued': queued || failed }"
    :aria-busy="saving"
  >
    <div class="score-card-header">
      <div>
        <h3 class="score-card-title">{{ category.label }}</h3>
        <span class="score-card-weight">Weight: {{ category.weight }}%</span>
      </div>

      <div class="weighted-points-badge" v-if="hasScore">
        <span class="pts-val">{{ weightedScore }}</span>
        <span class="pts-label">pts</span>
      </div>
    </div>

    <!-- Quick Score Dial -->
    <QuickScoreDial
      v-model="localValue"
      :disabled="disabled || saving"
      @change="handleScoreChange"
    />

    <div class="score-card-footer">
      <div class="score-status-row">
        <span
          class="status-indicator"
          :class="{ saved: isSaved, unsaved: isDirty, saving, queued, failed }"
        >
          <AppIcon v-if="saving" name="arrowPath" class="saving-spinner" />
          <AppIcon v-else-if="failed" name="warning" />
          <AppIcon v-else-if="queued" name="arrowPath" />
          <AppIcon v-else-if="isSaved" name="check" />
          <span v-else-if="isDirty" class="status-dot"></span>
          {{ statusText }}
        </span>
      </div>

      <button
        class="btn btn-primary full"
        type="button"
        :disabled="disabled || saving || (!isDirty && !canRetry)"
        @click="save"
      >
        <AppIcon :name="buttonIcon" :class="{ 'saving-spinner': saving }" />
        <span v-if="saving">Saving...</span>
        <span v-else-if="disabled">Scoring Locked</span>
        <span v-else-if="isDirty">Save {{ category.label }} Score</span>
        <span v-else-if="failed">Retry Save</span>
        <span v-else-if="queued">Retry Now</span>
        <span v-else-if="isSaved">Saved ({{ Number(localValue).toFixed(1) }})</span>
        <span v-else>Choose Score</span>
      </button>
    </div>
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import AppIcon from './AppIcon.vue';
import QuickScoreDial from './QuickScoreDial.vue';
import { validScore } from '../utils/score.js';

const emit = defineEmits(['save', 'invalid']);
const props = defineProps({
  category: { type: Object, required: true },
  currentValue: { type: [String, Number], default: '' },
  disabled: { type: Boolean, default: false },
  saveState: { type: String, default: 'idle' }
});

const localValue = ref(props.currentValue ?? '');
const saving = computed(() => props.saveState === 'saving');
const queued = computed(() => props.saveState === 'queued');
const failed = computed(() => props.saveState === 'error');
const canRetry = computed(() => queued.value || failed.value);

watch(
  () => props.currentValue,
  (val) => {
    localValue.value = val ?? '';
  }
);

const hasScore = computed(() => localValue.value !== '' && localValue.value !== null && Number.isFinite(Number(localValue.value)));

const weightedScore = computed(() => {
  if (!hasScore.value) return '-';
  const val = Number(localValue.value);
  return (val * (props.category.weight / 10)).toFixed(2);
});

const isDirty = computed(() => {
  if (localValue.value === '' && (props.currentValue === '' || props.currentValue === null || props.currentValue === undefined)) return false;
  return Number(localValue.value) !== Number(props.currentValue);
});

const isSaved = computed(() => {
  return hasScore.value && !isDirty.value && !saving.value && !queued.value && !failed.value;
});

const statusText = computed(() => {
  if (saving.value) return 'Saving...';
  if (isDirty.value) return 'Unsaved changes';
  if (failed.value) return 'Stored on device — tap Retry Save';
  if (queued.value) return 'Stored on device — waiting to sync';
  if (isSaved.value) return 'Score recorded in database';
  return 'Pending rating';
});

const buttonIcon = computed(() => {
  if (saving.value || queued.value) return 'arrowPath';
  if (failed.value) return 'warning';
  if (isSaved.value && !isDirty.value) return 'check';
  return 'scoreSheet';
});

function handleScoreChange(val) {
  // auto trigger validation
  if (val !== '' && !validScore(val)) {
    emit('invalid', 'Score must be between 0.0 and 10.0 and use increments of 0.1.');
  }
}

function save() {
  if (!validScore(localValue.value)) {
    emit('invalid', 'Score must be between 0.0 and 10.0 and use increments of 0.1.');
    return;
  }
  emit('save', props.category.key, Number(localValue.value));
}
</script>

<style scoped>
.is-scored {
  border-color: var(--border-gold);
}

.is-saving {
  box-shadow: 0 0 0 3px var(--gold-glow), var(--shadow-md);
}

.is-queued {
  border-color: rgba(245, 158, 11, 0.55);
}

.score-card-header {
  gap: 0.75rem;
}

.score-card-title {
  font-size: clamp(1rem, 4.5vw, 1.15rem);
  line-height: 1.18;
  letter-spacing: 0;
}

.score-card-weight {
  display: inline-flex;
  margin-top: 0.3rem;
  font-size: 0.72rem;
  line-height: 1;
}

.weighted-points-badge {
  display: flex;
  align-items: baseline;
  gap: 0.2rem;
  background: linear-gradient(135deg, var(--gold-soft), var(--surface-hover));
  border: 1px solid var(--gold);
  color: var(--gold-dark);
  padding: 0.32rem 0.55rem;
  border-radius: var(--radius-md);
  white-space: nowrap;
}

.pts-val {
  font-size: clamp(1rem, 4.4vw, 1.15rem);
  font-weight: 900;
  line-height: 1;
}

.pts-label {
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
}

.score-card-footer {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: auto;
}

.score-status-row {
  display: flex;
  justify-content: flex-end;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
}

.status-indicator .app-icon {
  width: 0.95rem;
  height: 0.95rem;
}

.status-indicator.saved {
  color: var(--success);
}

.status-indicator.unsaved {
  color: var(--warning);
}

.status-indicator.saving,
.status-indicator.queued,
.status-indicator.failed {
  color: var(--warning);
}

.saving-spinner {
  animation: score-card-spin 900ms linear infinite;
}

@keyframes score-card-spin {
  to { transform: rotate(360deg); }
}

.score-card .btn .app-icon {
  width: 1rem;
  height: 1rem;
}
</style>
