<template>
  <div class="app-shell judge-shell">
    <Sidebar :items="items" />
    <main class="main-panel">
      <Topbar :title="title" hide-actions />
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
  { label: 'Judge Hub', short: 'Hub', to: '/judge/dashboard', icon: 'hub' },
  { label: 'Score Round 1', short: 'Round 1', to: '/judge/round-one', icon: 'scoreSheet' },
  { label: 'Score Final Round', short: 'Final', to: '/judge/final', icon: 'finalRound' },
  { label: 'My Profile', short: 'Profile', to: '/judge/profile', icon: 'profile' }
];
</script>
