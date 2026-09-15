<template>
  <article
    class="score-card"
    :class="{
      'is-scored': hasScore,
      'is-saving': saving,
      'is-queued': queued || failed,
      'is-candidate-card': candidate,
      'is-confirmed': candidate && isSaved
    }"
    :aria-busy="saving"
  >
    <div v-if="candidate" class="score-card-header candidate-score-header">
      <div class="candidate-identity">
        <div class="candidate-score-photo">
          <img v-if="candidate.photo" :src="mediaUrl(candidate.photo)" :alt="candidate.name" />
          <span v-else>{{ candidateInitials }}</span>
        </div>
        <div class="candidate-score-copy">
          <span class="candidate-number">Candidate #{{ candidate.contestantNumber }}</span>
          <h3 class="score-card-title">{{ candidate.name }}</h3>
          <span v-if="candidate.hometown" class="candidate-hometown">{{ candidate.hometown }}</span>
        </div>
      </div>

      <div class="weighted-points-badge" v-if="hasScore">
        <span class="pts-val">{{ weightedScore }}</span>
        <span class="pts-label">pts</span>
      </div>
    </div>

    <div v-else class="score-card-header">
      <div class="score-card-title-wrap">
        <h3 class="score-card-title">{{ category.label }}</h3>
        <span class="score-card-weight">Weight: {{ category.weight }}%</span>
      </div>

      <div class="weighted-points-badge" v-if="hasScore">
        <span class="pts-val">{{ weightedScore }}</span>
        <span class="pts-label">pts</span>
      </div>
    </div>

    <!-- Simple Score Input -->
    <div class="simple-score-input">
      <div class="input-display" :class="{ 'has-error': validationError }">
        <input
          v-model="localValue"
          type="number"
          :min="minScore"
          :max="maxScore"
          step="0.1"
          inputmode="decimal"
          :disabled="disabled || saving"
          :aria-invalid="Boolean(validationError)"
          :aria-describedby="validationError ? inputErrorId : undefined"
          placeholder="0.0"
          class="score-decimal-input"
          @input="handleScoreChange($event.target.value)"
          @focus="emit('focus')"
        />
        <span class="max-denom">/ {{ maxScore.toFixed(1) }}</span>
      </div>
    </div>

    <p v-if="validationError" :id="inputErrorId" class="score-validation-error" role="alert">
      <AppIcon name="warning" />
      {{ validationError }}
    </p>

    <div class="score-card-footer">
      <div class="score-status-row">
        <span
          class="status-indicator"
          :class="{ saved: isSaved, unsaved: isDirty, saving, queued, failed, invalid: validationError }"
        >
          <AppIcon v-if="saving" name="arrowPath" class="saving-spinner" />
          <AppIcon v-else-if="validationError" name="warning" />
          <AppIcon v-else-if="failed" name="warning" />
          <AppIcon v-else-if="queued" name="arrowPath" />
          <AppIcon v-else-if="isSaved" name="check" />
          <span v-else-if="isDirty" class="status-dot"></span>
          {{ statusText }}
        </span>
      </div>

      <button
        class="btn btn-primary full save-btn"
        type="button"
        :disabled="disabled || saving || Boolean(validationError) || (!isDirty && !canRetry)"
        @click="save"
      >
        <AppIcon :name="buttonIcon" :class="{ 'saving-spinner': saving }" />
        <span v-if="saving">Saving...</span>
        <span v-else-if="disabled">Locked</span>
        <span v-else-if="validationError">Fix Score</span>
        <span v-else-if="isDirty">Save Score</span>
        <span v-else-if="failed">Retry</span>
        <span v-else-if="queued">Retry</span>
        <span v-else-if="isSaved">Saved ✓</span>
        <span v-else>Enter Score</span>
      </button>
    </div>
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import AppIcon from './AppIcon.vue';
import { mediaUrl } from '../services/api.js';
import { validScore } from '../utils/score.js';

const emit = defineEmits(['save', 'invalid', 'focus']);
const props = defineProps({
  category: { type: Object, required: true },
  candidate: { type: Object, default: null },
  currentValue: { type: [String, Number], default: '' },
  disabled: { type: Boolean, default: false },
  saveState: { type: String, default: 'idle' }
});

const localValue = ref(props.currentValue ?? '');
const validationError = ref('');
const saving = computed(() => props.saveState === 'saving');
const queued = computed(() => props.saveState === 'queued');
const failed = computed(() => props.saveState === 'error');
const canRetry = computed(() => queued.value || failed.value);
const minScore = computed(() => Number(props.category.minScore ?? 0));
const maxScore = computed(() => Number(props.category.maxScore ?? 10));
const inputErrorId = computed(() => `score-error-${props.candidate?._id || 'category'}-${props.category.key}`);
const candidateInitials = computed(() => props.candidate?.name
  ? props.candidate.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  : 'C');

watch(
  () => props.currentValue,
  (val) => {
    localValue.value = val ?? '';
    validationError.value = '';
  }
);

const hasScore = computed(() =>
  localValue.value !== ''
  && localValue.value !== null
  && localValue.value !== undefined
  && scoreValidationMessage(localValue.value, false) === ''
);

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
  if (validationError.value) return 'Fix the score before saving';
  if (isDirty.value) return 'Unsaved changes';
  if (failed.value) return 'Stored on device — tap Retry Save';
  if (queued.value) return 'Stored on device — waiting to sync';
  if (isSaved.value) return 'Score recorded in database';
  return 'Pending rating';
});

const buttonIcon = computed(() => {
  if (saving.value || queued.value) return 'arrowPath';
  if (validationError.value || failed.value) return 'warning';
  if (isSaved.value && !isDirty.value) return 'check';
  return 'scoreSheet';
});

function handleScoreChange(val) {
  validationError.value = scoreValidationMessage(val, false);
  if (validationError.value) emit('invalid', validationError.value);
}

function save() {
  validationError.value = scoreValidationMessage(localValue.value, true);
  if (validationError.value) {
    emit('invalid', validationError.value);
    return;
  }
  emit('save', props.category.key, Number(localValue.value));
}

function scoreValidationMessage(value, required) {
  if (value === '' || value === null || value === undefined) {
    return required ? `Enter a score from ${minScore.value.toFixed(1)} to ${maxScore.value.toFixed(1)}.` : '';
  }

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < minScore.value || numberValue > maxScore.value) {
    return `Score must be between ${minScore.value.toFixed(1)} and ${maxScore.value.toFixed(1)}.`;
  }
  if (!validScore(value)) return 'Score must use increments of 0.1.';
  return '';
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

.is-candidate-card.is-confirmed {
  border-color: rgba(16, 185, 129, 0.65);
  background:
    radial-gradient(circle at 92% 8%, rgba(52, 211, 153, 0.2), transparent 34%),
    linear-gradient(135deg, color-mix(in srgb, var(--success) 20%, var(--surface)) 0%, var(--surface) 58%, color-mix(in srgb, var(--success) 10%, var(--surface)) 100%);
  box-shadow: 0 12px 28px -16px rgba(5, 150, 105, 0.75), var(--shadow-md);
}

:global([data-theme='dark']) .is-candidate-card.is-confirmed {
  background:
    radial-gradient(circle at 92% 8%, rgba(52, 211, 153, 0.18), transparent 34%),
    linear-gradient(135deg, #12352f 0%, #102a2d 48%, #0f2130 100%);
}

.is-candidate-card.is-confirmed .candidate-score-photo,
.is-candidate-card.is-confirmed .weighted-points-badge {
  border-color: rgba(52, 211, 153, 0.7);
}

.score-card-header {
  gap: 0.5rem;
}

.score-card-title {
  font-size: clamp(0.95rem, 4vw, 1.1rem);
  line-height: 1.2;
  letter-spacing: 0;
}

.score-card-weight {
  display: inline-flex;
  margin-top: 0.2rem;
  font-size: 0.7rem;
  line-height: 1;
}

.candidate-score-header {
  align-items: flex-start;
}

.candidate-identity {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 0.7rem;
}

.candidate-score-photo {
  width: 54px;
  height: 54px;
  flex: 0 0 54px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 2px solid var(--border-gold);
  border-radius: var(--radius-md);
  color: var(--gold-light);
  background: linear-gradient(135deg, var(--navy-dark), var(--navy));
  font-weight: 900;
}

.candidate-score-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.candidate-score-copy {
  min-width: 0;
}

.candidate-number,
.candidate-hometown {
  display: block;
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 700;
}

.candidate-score-copy .score-card-title {
  margin: 0.12rem 0;
  white-space: normal;
  overflow-wrap: anywhere;
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
  gap: 0.5rem;
  margin-top: auto;
}

.score-status-row {
  display: flex;
  justify-content: center;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
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

.status-indicator.invalid {
  color: var(--danger);
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

.simple-score-input {
  display: flex;
  justify-content: center;
}

.input-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: var(--surface-hover);
  border: 2px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 0.5rem 1rem;
  width: 100%;
  max-width: 180px;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.input-display:focus-within {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px var(--gold-glow);
}

.input-display.has-error,
.input-display.has-error:focus-within {
  border-color: var(--danger);
  box-shadow: 0 0 0 3px var(--danger-soft);
}

.score-validation-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  margin-top: -0.25rem;
  color: var(--danger);
  font-size: 0.72rem;
  font-weight: 800;
  text-align: center;
}

.score-validation-error :deep(.app-icon) {
  width: 1rem;
  height: 1rem;
  flex: 0 0 1rem;
}

.score-decimal-input {
  width: 80px;
  min-width: 0;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  padding: 0;
  background: transparent;
  font-size: clamp(1.6rem, 8vw, 2rem);
  font-weight: 900;
  text-align: center;
  color: var(--text-main);
}

.score-decimal-input:focus {
  outline: none;
  border: 0;
  box-shadow: none;
  background: transparent;
}

.max-denom {
  font-size: clamp(0.85rem, 4vw, 1rem);
  font-weight: 800;
  color: var(--text-muted);
  flex-shrink: 0;
}

.save-btn {
  min-height: 44px;
  font-size: 0.85rem;
  font-weight: 800;
}
</style>
