<template>
  <aside class="sidebar" aria-label="Primary Navigation">
    <div class="sidebar-header">
      <div class="sidebar-logo">
        <div class="sidebar-logo-icon">👑</div>
        <div>
          <div class="sidebar-title">PAGEANT PRO</div>
          <div class="sidebar-subtitle">Tabulation Suite</div>
        </div>
      </div>
    </div>

    <nav class="sidebar-nav">
      <RouterLink v-for="item in items" :key="item.to" :to="item.to" class="sidebar-link">
        <span class="sidebar-link-icon">{{ item.icon || '📌' }}</span>
        <span>{{ item.label }}</span>
        <span v-if="item.badge" class="sidebar-link-badge">{{ item.badge }}</span>
      </RouterLink>
    </nav>

    <div class="sidebar-footer">
      <RouterLink to="/stage" target="_blank" class="sidebar-link" style="color: var(--gold-light);">
        <span>✨</span>
        <span>Stage Mode (F11)</span>
      </RouterLink>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  items: { type: Array, required: true }
});
</script>

<style scoped>
.sidebar-link-icon {
  font-size: 1.1rem;
  display: grid;
  place-items: center;
  width: 24px;
}
</style>
