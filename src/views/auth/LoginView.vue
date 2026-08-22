<template>
  <main class="login-page">
    <section class="login-panel">
      <div class="login-brand-header">
        <div class="brand-crown-icon">👑</div>
        <p class="eyebrow">Official Tabulation Suite</p>
        <h1 class="brand-font">Pageant Pro</h1>
        <p class="login-subtext">Secure authentication for judges and tabulation officials</p>
      </div>

      <form @submit.prevent="submit" class="stack-form">
        <label>
          Username / ID
          <input v-model="form.username" placeholder="e.g. admin or judge001" autocomplete="username" required />
        </label>

        <label>
          Password
          <input v-model="form.password" type="password" placeholder="••••••••" autocomplete="current-password" required />
        </label>

        <button class="btn btn-primary full btn-lg" type="submit" :disabled="auth.loading">
          {{ auth.loading ? 'Authenticating...' : 'Sign In to Portal' }}
        </button>

        <p v-if="error" class="error-text">{{ error }}</p>
      </form>

      <!-- Quick Demo Login Selection Chips -->
      <div class="quick-demo-logins">
        <span class="demo-login-label">⚡ One-Click Quick Demo Sign-in:</span>
        <div class="demo-chips-grid">
          <button type="button" class="demo-chip chip-admin" @click="quickLogin('admin', 'admin12345')">
            🛡️ Admin Portal
          </button>
          <button type="button" class="demo-chip" @click="quickLogin('judge001', 'judge12345')">
            ⚖️ Judge 1 (Chair)
          </button>
          <button type="button" class="demo-chip" @click="quickLogin('judge002', 'judge12345')">
            ⚖️ Judge 2
          </button>
          <button type="button" class="demo-chip" @click="quickLogin('judge003', 'judge12345')">
            ⚖️ Judge 3
          </button>
        </div>
      </div>

      <div class="login-footer">
        <RouterLink to="/stage" target="_blank" class="stage-link">
          👑 Open Stage / Projector Screen →
        </RouterLink>
      </div>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.js';

const auth = useAuthStore();
const router = useRouter();
const error = ref('');
const form = reactive({ username: '', password: '' });

async function submit() {
  error.value = '';
  try {
    await auth.login(form);
    router.push(auth.isAdmin ? '/admin/dashboard' : '/judge/dashboard');
  } catch (err) {
    error.value = err.response?.data?.message || 'Invalid credentials.';
  }
}

async function quickLogin(user, pass) {
  form.username = user;
  form.password = pass;
  await submit();
}
</script>

<style scoped>
.login-brand-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.brand-crown-icon {
  font-size: 2.8rem;
  margin-bottom: 0.25rem;
}

.login-brand-header h1 {
  font-size: 2rem;
  font-weight: 900;
  color: var(--navy);
  margin-top: 0.1rem;
}

.login-subtext {
  font-size: 0.84rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.quick-demo-logins {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px dashed var(--border);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.demo-login-label {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
}

.demo-chips-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.demo-chip {
  padding: 0.45rem 0.65rem;
  border-radius: var(--radius-sm);
  background: var(--surface-hover);
  border: 1px solid var(--border);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 150ms ease;
  text-align: left;
}

.demo-chip:hover {
  background: var(--gold-soft);
  border-color: var(--gold);
  color: var(--gold-dark);
}

.chip-admin {
  background: rgba(16, 35, 63, 0.08);
  border-color: rgba(16, 35, 63, 0.2);
}

.login-footer {
  text-align: center;
  margin-top: 1.25rem;
}

.stage-link {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--gold-dark);
}

.stage-link:hover {
  text-decoration: underline;
}
</style>
