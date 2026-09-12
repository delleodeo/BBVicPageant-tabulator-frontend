<template>
  <aside class="sidebar" aria-label="Primary Navigation">
    <div class="sidebar-header">
      <div class="sidebar-logo">
        <div class="sidebar-logo-icon">
          <AppIcon name="sparkles" />
        </div>
        <div>
          <div class="sidebar-title">PAGEANT PRO</div>
          <div class="sidebar-subtitle">Tabulation Suite</div>
        </div>
      </div>
    </div>

    <nav class="sidebar-nav">
      <RouterLink v-for="item in items" :key="item.to" :to="item.to" class="sidebar-link">
        <span class="sidebar-link-icon">
          <AppIcon :name="item.icon || 'sparkles'" />
        </span>
        <span>{{ item.label }}</span>
        <span v-if="item.badge" class="sidebar-link-badge">{{ item.badge }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup>
import AppIcon from './AppIcon.vue';

defineProps({
  items: { type: Array, required: true }
});
</script>

<style scoped>
.sidebar-link-icon {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
}

.sidebar-link-icon .app-icon,
.sidebar-logo-icon .app-icon {
  width: 1.25rem;
  height: 1.25rem;
}
</style>
