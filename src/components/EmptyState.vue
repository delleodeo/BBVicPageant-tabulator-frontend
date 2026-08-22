<template>
  <div class="state-panel">{{ message }}</div>
</template>

<script setup>
defineProps({
  message: { type: String, default: 'No records found.' }
});
</script>

