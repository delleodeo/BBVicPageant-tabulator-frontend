<template>
  <section v-if="pendingCount" class="score-sync-notice" :class="noticeTone" aria-live="polite">
    <AppIcon :name="isSaving ? 'arrowPath' : 'warning'" :class="{ spinning: isSaving }" />
    <div>
      <strong>{{ heading }}</strong>
      <p>{{ detail }}</p>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import AppIcon from './AppIcon.vue';

const props = defineProps({
  states: { type: Object, default: () => ({}) }
});

const isOnline = ref(navigator.onLine);
const values = computed(() => Object.values(props.states));
const pendingCount = computed(() => values.value.filter((state) => ['saving', 'queued', 'error'].includes(state)).length);
const isSaving = computed(() => values.value.includes('saving'));
const hasError = computed(() => values.value.includes('error'));
const noticeTone = computed(() => ({ saving: isSaving.value, error: hasError.value, offline: !isOnline.value }));

const heading = computed(() => {
  if (isSaving.value) return 'Saving...';
  if (hasError.value) return 'A score is stored on this device but needs attention.';
  if (!isOnline.value) return 'No connection — your score is safe on this device.';
  return 'Score saved on this device and queued for retry.';
});

const detail = computed(() => {
  if (hasError.value) return 'Use Retry Save on the score card. The local copy will remain until the server accepts it.';
  return `${pendingCount.value} ${pendingCount.value === 1 ? 'score is' : 'scores are'} kept locally and removed only after the server confirms the database save.`;
});

function updateConnectionStatus() {
  isOnline.value = navigator.onLine;
}

onMounted(() => {
  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);
});

onBeforeUnmount(() => {
  window.removeEventListener('online', updateConnectionStatus);
  window.removeEventListener('offline', updateConnectionStatus);
});
</script>

<style scoped>
.score-sync-notice {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.8rem 1rem;
  border: 1px solid var(--border-gold);
  border-radius: var(--radius-md);
  background: var(--gold-soft);
  color: var(--gold-dark);
}

.score-sync-notice.offline,
.score-sync-notice.error {
  border-color: rgba(245, 158, 11, 0.45);
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}

.score-sync-notice .app-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.score-sync-notice strong,
.score-sync-notice p {
  display: block;
}

.score-sync-notice strong {
  font-size: 0.84rem;
}

.score-sync-notice p {
  margin-top: 0.12rem;
  color: var(--text-muted);
  font-size: 0.75rem;
  line-height: 1.4;
}

.spinning {
  animation: score-sync-spin 900ms linear infinite;
}

@keyframes score-sync-spin {
  to { transform: rotate(360deg); }
}
</style>
