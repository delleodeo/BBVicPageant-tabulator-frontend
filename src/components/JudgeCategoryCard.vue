<template>
  <button
    type="button"
    class="judge-category-card"
    :class="{ 'is-complete': isComplete, 'is-active': progress.completed > 0 && !isComplete && !locked, 'is-locked': locked }"
    :disabled="!available"
    @click="emit('open')"
  >
    <span class="category-card-heading">
      <strong>{{ category.label }}</strong>
      <span class="category-weight">{{ category.weight }}%</span>
    </span>
    <span class="category-range">Score Range: {{ Number(category.minScore ?? 0).toFixed(1) }} – {{ Number(category.maxScore ?? 10).toFixed(1) }}</span>
    <span class="category-progress-copy">
      <strong>{{ progress.completed }} / {{ progress.total }} Candidates Scored</strong>
      <span>{{ progress.percent }}% Complete</span>
    </span>
    <span class="category-progress-track" aria-hidden="true"><span :style="{ width: `${progress.percent}%` }"></span></span>
    <span class="category-card-bottom">
      <span class="category-status" :class="{ complete: isComplete }">
        <AppIcon :name="locked ? 'lock' : isComplete ? 'check' : 'scoreSheet'" />
        {{ locked ? 'Locked' : isComplete ? 'Completed' : progress.completed ? 'In Progress' : 'Pending' }}
      </span>
      <span class="category-action">{{ actionText }} <AppIcon name="arrowRight" /></span>
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue';
import AppIcon from './AppIcon.vue';

const emit = defineEmits(['open']);
const props = defineProps({
  category: { type: Object, required: true },
  progress: { type: Object, required: true },
  available: { type: Boolean, default: false },
  locked: { type: Boolean, default: false }
});

const isComplete = computed(() => props.progress.total > 0 && props.progress.completed === props.progress.total);
const actionText = computed(() => {
  if (!props.available) return 'Scoring Locked';
  if (props.locked || isComplete.value) return 'View Scores';
  return props.progress.completed ? 'Continue Scoring' : 'Score Category';
});
</script>

<style scoped>
.judge-category-card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  width: 100%;
  min-width: 0;
  min-height: 190px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.95rem;
  padding: clamp(1.1rem, 3vw, 1.4rem);
  margin-bottom: clamp(0.75rem, 2.5vw, 1rem);
  border: 1px solid var(--border-gold);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at 94% 2%, var(--gold-glow) 0%, transparent 34%),
    linear-gradient(145deg, var(--surface) 0%, var(--surface-hover) 150%);
  color: var(--text-main);
  box-shadow: 0 12px 30px -18px rgba(3, 10, 24, 0.55), var(--shadow-sm);
  text-align: left;
  cursor: pointer;
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.judge-category-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  z-index: -1;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--gold-light), var(--gold-dark), transparent);
  opacity: 0.8;
}

.judge-category-card::after {
  content: '';
  position: absolute;
  right: -54px;
  bottom: -70px;
  z-index: -1;
  width: 150px;
  height: 150px;
  border: 22px solid var(--gold-glow);
  border-radius: 50%;
  opacity: 0.16;
  pointer-events: none;
}

.judge-category-card.is-complete {
  border-color: rgba(16, 185, 129, 0.45);
  background:
    radial-gradient(circle at 94% 2%, rgba(16, 185, 129, 0.16) 0%, transparent 36%),
    linear-gradient(145deg, var(--surface) 0%, var(--surface-hover) 150%);
}

.judge-category-card.is-complete::before {
  background: linear-gradient(90deg, transparent, var(--success), transparent);
}

.judge-category-card:hover:not(:disabled),
.judge-category-card:focus-visible {
  transform: translateY(-3px);
  border-color: var(--gold);
  box-shadow: 0 16px 34px -18px rgba(3, 10, 24, 0.7), var(--shadow-gold);
}

.judge-category-card:focus-visible {
  outline: 3px solid var(--gold-glow);
  outline-offset: 3px;
}

.judge-category-card:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.category-card-heading,
.category-progress-copy,
.category-card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.category-card-heading strong {
  font-size: clamp(1rem, 3.5vw, 1.15rem);
  font-weight: 850;
  line-height: 1.2;
  letter-spacing: -0.025em;
  overflow-wrap: anywhere;
}

.category-weight {
  flex: 0 0 auto;
  padding: 0.32rem 0.6rem;
  border: 1px solid var(--border-gold);
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--gold-soft), var(--surface-hover));
  color: var(--gold-dark);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
  font-size: 0.76rem;
  font-weight: 900;
}

.category-range {
  margin-top: -0.25rem;
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.category-progress-copy span {
  color: var(--text-muted);
  font-size: 0.73rem;
  font-weight: 750;
}

.category-progress-copy strong {
  color: var(--text-main);
  font-size: 0.82rem;
  font-weight: 850;
  letter-spacing: -0.015em;
}

.category-progress-track {
  height: 9px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--surface-active) 78%, transparent);
  box-shadow: inset 0 1px 3px rgba(3, 10, 24, 0.18);
}

.category-progress-track > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--gold-dark) 0%, var(--gold) 55%, var(--gold-light) 100%);
  box-shadow: 0 0 12px var(--gold-glow);
  transition: width 350ms cubic-bezier(0.4, 0, 0.2, 1);
}

.is-complete .category-progress-track > span {
  background: linear-gradient(90deg, #059669, var(--success), #6ee7b7);
}

.category-status,
.category-action {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.73rem;
  font-weight: 800;
}

.category-card-bottom {
  margin-top: 0.05rem;
  padding-top: 0.8rem;
  border-top: 1px solid var(--border);
}

.category-status {
  padding: 0.28rem 0.48rem;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--surface-active) 72%, transparent);
  color: var(--text-muted);
}

.category-status.complete {
  color: var(--success);
}

.category-action {
  padding: 0.28rem 0.15rem 0.28rem 0.5rem;
  color: var(--gold-dark);
  text-align: right;
}

.category-status :deep(.app-icon),
.category-action :deep(.app-icon) {
  width: 0.9rem;
  height: 0.9rem;
}

.category-action :deep(.app-icon) {
  transition: transform 180ms ease;
}

.judge-category-card:hover:not(:disabled) .category-action :deep(.app-icon) {
  transform: translateX(3px);
}

:global([data-theme='dark']) .judge-category-card {
  background:
    radial-gradient(circle at 94% 2%, rgba(201, 154, 46, 0.17) 0%, transparent 36%),
    linear-gradient(145deg, #13243a 0%, #0d1a2c 56%, #101d2f 100%);
  box-shadow: 0 16px 34px -18px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.025);
}

:global([data-theme='dark']) .judge-category-card.is-complete {
  background:
    radial-gradient(circle at 94% 2%, rgba(16, 185, 129, 0.16) 0%, transparent 36%),
    linear-gradient(145deg, #12263a 0%, #0d1a2c 58%, #0e211f 100%);
}

:global([data-theme='dark']) .category-weight,
:global([data-theme='dark']) .category-action {
  color: var(--gold-light);
}

@media (max-width: 420px) {
  .judge-category-card {
    min-height: 182px;
    gap: 0.85rem;
    padding: 1.1rem;
  }

  .category-progress-copy {
    align-items: flex-end;
  }

  .category-progress-copy strong {
    max-width: 68%;
    line-height: 1.3;
  }
}
</style>
