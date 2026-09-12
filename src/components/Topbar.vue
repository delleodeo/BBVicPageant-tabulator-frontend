<template>
  <header class="topbar">
    <div class="topbar-title-wrap">
      <p class="eyebrow">
        <span class="pulse-dot"></span>
        {{ roleLabel }}
      </p>
      <h1>{{ title }}</h1>
    </div>

    <div v-if="!hideActions" class="topbar-actions">
      <!-- Theme Switcher -->
      <button type="button" class="btn btn-ghost btn-icon btn-sm" :title="isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'" @click="toggleTheme">
        <AppIcon :name="isDark ? 'sun' : 'moon'" />
      </button>

      <!-- User Profile Info -->
      <div class="user-chip">
        <span class="user-avatar">{{ avatarText }}</span>
        <div class="user-info-text">
          <span class="user-display-name">{{ displayName }}</span>
          <span class="user-role-tag">{{ roleTag }}</span>
        </div>
      </div>

      <button class="btn btn-ghost btn-sm" type="button" @click="logout">
        <AppIcon name="arrowRightOnRectangle" />
        Logout
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppIcon from './AppIcon.vue';
import { useAuthStore } from '../stores/auth.js';

defineProps({
  title: { type: String, required: true },
  hideActions: { type: Boolean, default: false }
});

const auth = useAuthStore();
const router = useRouter();
const isDark = ref(false);

onMounted(() => {
  const saved = localStorage.getItem('pageant_theme');
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true;
    document.documentElement.setAttribute('data-theme', 'dark');
  }
});

function toggleTheme() {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('pageant_theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('pageant_theme', 'light');
  }
}

const roleLabel = computed(() => {
  if (auth.isAdmin) return 'Executive Tabulation Control';
  return `${auth.judge?.designation || 'Official Pageant Judge'} (${auth.judge?.judgeId})`;
});

const displayName = computed(() => {
  if (auth.isAdmin) return auth.user?.username || 'Administrator';
  return auth.judge?.name || 'Judge';
});

const roleTag = computed(() => {
  if (auth.isAdmin) return 'Admin';
  return auth.judge?.judgeId || 'Judge';
});

const avatarText = computed(() => {
  if (auth.isAdmin) return 'AD';
  return auth.judge?.judgeId || 'J';
});

function logout() {
  auth.logout();
  router.push('/login');
}
</script>

<style scoped>
.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 6px var(--success);
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.25rem 0.75rem 0.25rem 0.35rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--navy);
  color: var(--gold-light);
  font-size: 0.75rem;
  font-weight: 900;
  display: grid;
  place-items: center;
}

.user-info-text {
  display: flex;
  flex-direction: column;
}

.user-display-name {
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1.1;
}

.user-role-tag {
  font-size: 0.65rem;
  color: var(--gold-dark);
  font-weight: 700;
  text-transform: uppercase;
}

@media (max-width: 640px) {
  .topbar-title-wrap {
    width: 100%;
  }

  .topbar-actions {
    width: 100%;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 0.65rem;
  }

  .user-chip {
    justify-content: center;
    min-width: 0;
  }

  .user-chip {
    padding-right: 0.6rem;
  }

  .user-display-name {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
