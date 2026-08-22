<template>
  <div class="state-panel">Loading {{ label }}...</div>
</template>

<script setup>
defineProps({
  label: { type: String, default: 'data' }
});
</script>

