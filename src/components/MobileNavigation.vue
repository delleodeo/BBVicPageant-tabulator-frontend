<template>
  <nav class="mobile-nav" aria-label="Mobile primary">
    <RouterLink v-for="item in items" :key="item.to" :to="item.to">{{ item.short || item.label }}</RouterLink>
  </nav>
</template>

<script setup>
defineProps({
  items: { type: Array, required: true }
});
</script>

