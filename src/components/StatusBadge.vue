<template>
  <span class="status-badge" :class="tone">{{ label }}</span>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  tone: { type: String, default: 'neutral' }
});
</script>

