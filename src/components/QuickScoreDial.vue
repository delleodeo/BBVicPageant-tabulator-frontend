<template>
  <div class="quick-score-dial">
    <div class="dial-header">
      <div class="score-display">
        <input
          :value="modelValue"
          type="number"
          min="0"
          max="10"
          step="0.1"
          inputmode="decimal"
          :disabled="disabled"
          class="dial-numeric-input"
          placeholder="0.0"
          @input="handleDirectInput($event.target.value)"
        />
        <span class="max-denom">/ 10.0</span>
      </div>

      <div v-if="ratingBadge" class="rating-badge-pill" :class="ratingBadge.tone">
        {{ ratingBadge.label }}
      </div>
    </div>

    <!-- Stepper & Quick Adjustment Controls -->
    <div class="dial-controls">
      <button
        type="button"
        class="step-btn"
        :disabled="disabled || isMin"
        title="Decrease by 0.1"
        @click="adjust(-0.1)"
      >
        -0.1
      </button>

      <button
        type="button"
        class="step-btn"
        :disabled="disabled || isMin"
        title="Decrease by 0.5"
        @click="adjust(-0.5)"
      >
        -0.5
      </button>

      <button
        type="button"
        class="step-btn"
        :disabled="disabled || isMax"
        title="Increase by 0.5"
        @click="adjust(0.5)"
      >
        +0.5
      </button>

      <button
        type="button"
        class="step-btn"
        :disabled="disabled || isMax"
        title="Increase by 0.1"
        @click="adjust(0.1)"
      >
        +0.1
      </button>
    </div>

    <!-- Quick Preset Chips -->
    <div class="preset-chips">
      <button
        v-for="preset in presets"
        :key="preset"
        type="button"
        class="preset-chip"
        :class="{ active: Number(modelValue) === preset }"
        :disabled="disabled"
        @click="setScore(preset)"
      >
        {{ preset.toFixed(1) }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const emit = defineEmits(['update:modelValue', 'change']);
const props = defineProps({
  modelValue: { type: [Number, String], default: '' },
  disabled: { type: Boolean, default: false }
});

const presets = [7.5, 8.0, 8.5, 8.8, 9.0, 9.2, 9.5, 9.8, 10.0];

const currentNum = computed(() => {
  const val = Number(props.modelValue);
  return Number.isFinite(val) ? val : null;
});

const isMin = computed(() => currentNum.value !== null && currentNum.value <= 0);
const isMax = computed(() => currentNum.value !== null && currentNum.value >= 10);

const ratingBadge = computed(() => {
  if (currentNum.value === null) return null;
  const val = currentNum.value;
  if (val >= 9.6) return { label: 'Exceptional (9.6-10)', tone: 'gold' };
  if (val >= 9.0) return { label: 'Outstanding (9.0-9.5)', tone: 'emerald' };
  if (val >= 8.5) return { label: 'Very Good (8.5-8.9)', tone: 'blue' };
  if (val >= 8.0) return { label: 'Good (8.0-8.4)', tone: 'amber' };
  return { label: 'Fair (<8.0)', tone: 'slate' };
});

function handleDirectInput(rawVal) {
  let val = rawVal === '' ? '' : Number(rawVal);
  if (typeof val === 'number') {
    if (val < 0) val = 0;
    if (val > 10) val = 10;
    val = Math.round(val * 10) / 10;
  }
  emit('update:modelValue', val);
  emit('change', val);
}

function adjust(delta) {
  const current = currentNum.value ?? 8.5;
  const next = Math.max(0, Math.min(10, Math.round((current + delta) * 10) / 10));
  emit('update:modelValue', next);
  emit('change', next);
}

function setScore(score) {
  emit('update:modelValue', score);
  emit('change', score);
}
</script>

<style scoped>
.quick-score-dial {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dial-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.score-display {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
}

.dial-numeric-input {
  width: 100px;
  height: 52px;
  font-size: 1.8rem;
  font-weight: 900;
  text-align: center;
  background: var(--surface-hover);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-main);
  transition: all 150ms ease;
}

.dial-numeric-input:focus {
  border-color: var(--gold);
  background: var(--surface);
  box-shadow: 0 0 0 3px var(--gold-glow);
}

.max-denom {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-muted);
}

.rating-badge-pill {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.25rem 0.65rem;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.rating-badge-pill.gold { background: var(--gold-soft); color: var(--gold-dark); border: 1px solid var(--gold); }
.rating-badge-pill.emerald { background: #ecfdf5; color: #059669; }
.rating-badge-pill.blue { background: #eff6ff; color: #2563eb; }
.rating-badge-pill.amber { background: #fffbeb; color: #d97706; }
.rating-badge-pill.slate { background: #f1f5f9; color: #64748b; }

.dial-controls {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
}

.step-btn {
  height: 36px;
  background: var(--surface-hover);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-weight: 800;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 120ms ease;
}

.step-btn:hover:not(:disabled) {
  background: var(--gold-soft);
  border-color: var(--gold);
  color: var(--gold-dark);
}

.preset-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.preset-chip {
  flex: 1;
  min-width: 44px;
  padding: 0.35rem 0.4rem;
  border-radius: var(--radius-sm);
  background: var(--surface);
  border: 1px solid var(--border);
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--text-main);
  cursor: pointer;
  transition: all 120ms ease;
  text-align: center;
}

.preset-chip:hover:not(:disabled) {
  border-color: var(--gold);
  background: var(--gold-soft);
  color: var(--gold-dark);
}

.preset-chip.active {
  background: linear-gradient(135deg, var(--gold), var(--gold-dark));
  color: #ffffff;
  border-color: var(--gold-dark);
  font-weight: 900;
}
</style>

