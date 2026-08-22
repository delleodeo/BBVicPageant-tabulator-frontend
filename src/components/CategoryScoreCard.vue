<template>
  <article class="score-card" :class="{ 'is-scored': hasScore }">
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
        <span class="status-indicator" :class="{ saved: isSaved, unsaved: isDirty }">
          {{ isDirty ? '● Unsaved changes' : isSaved ? '✓ Score recorded' : 'Pending rating' }}
        </span>
      </div>

      <button
        class="btn btn-primary full"
        type="button"
        :disabled="disabled || saving || !isDirty"
        @click="save"
      >
        <span v-if="saving">Saving...</span>
        <span v-else-if="isDirty">Save {{ category.label }} Score</span>
        <span v-else>Saved ({{ localValue }})</span>
      </button>
    </div>
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import QuickScoreDial from './QuickScoreDial.vue';
import { validScore } from '../utils/score.js';

const emit = defineEmits(['save', 'invalid']);
const props = defineProps({
  category: { type: Object, required: true },
  currentValue: { type: [String, Number], default: '' },
  disabled: { type: Boolean, default: false }
});

const localValue = ref(props.currentValue ?? '');
const saving = ref(false);

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
  return hasScore.value && !isDirty.value;
});

function handleScoreChange(val) {
  // auto trigger validation
  if (val !== '' && !validScore(val)) {
    emit('invalid', 'Score must be between 0.0 and 10.0 and use increments of 0.1.');
  }
}

async function save() {
  if (!validScore(localValue.value)) {
    emit('invalid', 'Score must be between 0.0 and 10.0 and use increments of 0.1.');
    return;
  }
  saving.value = true;
  try {
    await emit('save', props.category.key, Number(localValue.value));
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.is-scored {
  border-color: var(--border-gold);
}

.weighted-points-badge {
  display: flex;
  align-items: baseline;
  gap: 0.2rem;
  background: linear-gradient(135deg, var(--gold-soft), var(--surface-hover));
  border: 1px solid var(--gold);
  color: var(--gold-dark);
  padding: 0.25rem 0.65rem;
  border-radius: var(--radius-md);
}

.pts-val {
  font-size: 1.1rem;
  font-weight: 900;
}

.pts-label {
  font-size: 0.72rem;
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
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
}

.status-indicator.saved {
  color: var(--success);
}

.status-indicator.unsaved {
  color: var(--warning);
}
</style>
