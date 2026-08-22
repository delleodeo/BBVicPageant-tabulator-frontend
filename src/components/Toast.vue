<template>
  <div v-if="message" class="toast" :class="tone">{{ message }}</div>
</template>

<script setup>
defineProps({
  message: { type: String, default: '' },
  tone: { type: String, default: 'success' }
});
</script>

