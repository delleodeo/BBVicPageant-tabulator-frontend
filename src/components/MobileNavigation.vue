<template>
  <nav class="mobile-nav" aria-label="Mobile primary">
    <RouterLink v-for="item in items" :key="item.to" :to="item.to">
      <AppIcon :name="item.icon || 'sparkles'" />
      <span>{{ item.short || item.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import AppIcon from './AppIcon.vue';

defineProps({
  items: { type: Array, required: true }
});
</script>
