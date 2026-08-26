<template>
  <div class="app-shell">
    <Sidebar :items="items" />
    <main class="main-panel">
      <Topbar :title="title" />
      <slot />
    </main>
    <MobileNavigation :items="items" />
  </div>
</template>

<script setup>
import Sidebar from '../components/Sidebar.vue';
import Topbar from '../components/Topbar.vue';
import MobileNavigation from '../components/MobileNavigation.vue';

defineProps({
  title: { type: String, required: true }
});

const items = [
  { label: 'Dashboard', short: 'Home', to: '/admin/dashboard', icon: 'dashboard' },
  { label: 'Live Matrix', short: 'Matrix', to: '/admin/dashboard#matrix', icon: 'matrix' },
  { label: 'Contestants', short: 'People', to: '/admin/contestants', icon: 'contestants' },
  { label: 'Judges', short: 'Judges', to: '/admin/judges', icon: 'judges' },
  { label: 'Round 1 Results', short: 'R1', to: '/admin/round-one', icon: 'roundOne' },
  { label: 'Special Awards', short: 'Awards', to: '/admin/special-awards', icon: 'awards' },
  { label: 'Top 5 Finalists', short: 'Top 5', to: '/admin/finalists', icon: 'finalists' },
  { label: 'Final Round', short: 'Final', to: '/admin/final-round', icon: 'finalRound' },
  { label: 'Audit Trail', short: 'Logs', to: '/admin/audit-logs', icon: 'logs' },
  { label: 'Settings & Criteria', short: 'Set', to: '/admin/settings', icon: 'settings' }
];
</script>
