<template>
  <div class="progress-wrap" role="progressbar" :aria-valuenow="value" aria-valuemin="0" aria-valuemax="100">
    <div class="progress-fill" :style="{ width: `${Math.max(0, Math.min(100, value))}%` }"></div>
  </div>
</template>

<script setup>
defineProps({
  value: { type: Number, default: 0 }
});
</script>

