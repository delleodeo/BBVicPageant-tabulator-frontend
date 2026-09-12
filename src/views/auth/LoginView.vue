<template>
  <main class="login-page">
    <section class="login-shell" aria-label="Pageant Pro secure login">
      <div class="login-hero-panel">
        <div class="brand-lockup">
          <span class="brand-mark">
            <AppIcon name="sparkles" />
          </span>
          <div>
            <p class="eyebrow">Official Tabulation Suite</p>
            <h1 class="brand-font">Pageant Pro</h1>
          </div>
        </div>

        <div class="login-hero-copy">
          <h2>Secure access for every pageant official.</h2>
          <p>Sign in to manage contestants, score sheets, and final results from any screen size.</p>
        </div>

        <div class="login-trust-grid" aria-label="Platform highlights">
          <div>
            <AppIcon name="shieldCheck" />
            <span>Protected portal</span>
          </div>
          <div>
            <AppIcon name="chart" />
            <span>Live tabulation</span>
          </div>
          <div>
            <AppIcon name="contestants" />
            <span>Contestant management</span>
          </div>
        </div>
      </div>

      <div class="login-card">
        <div class="login-card-header">
          <span class="login-card-icon">
            <AppIcon name="lock" />
          </span>
          <div>
            <p class="eyebrow">Portal Sign In</p>
            <h2>Welcome back</h2>
          </div>
        </div>

        <form @submit.prevent="submit" class="stack-form">
          <label>
            Username / ID
            <span class="input-shell">
              <AppIcon name="userId" />
              <input v-model="form.username" placeholder="e.g. admin or judge001" autocomplete="username" required />
            </span>
          </label>

          <label>
            Password
            <span class="input-shell">
              <AppIcon name="key" />
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter your password"
                autocomplete="current-password"
                required
              />
              <button
                type="button"
                class="password-toggle"
                :title="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <AppIcon :name="showPassword ? 'eyeSlash' : 'eye'" />
              </button>
            </span>
          </label>

          <button class="btn btn-primary full btn-lg login-submit" type="submit" :disabled="auth.loading">
            <AppIcon :name="auth.loading ? 'arrowPath' : 'arrowRightOnRectangle'" />
            {{ auth.loading ? 'Authenticating...' : 'Sign In to Portal' }}
          </button>

          <p v-if="error" class="error-text">
            <AppIcon name="warning" />
            {{ error }}
          </p>
        </form>

      </div>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppIcon from '../../components/AppIcon.vue';
import { useAuthStore } from '../../stores/auth.js';

const auth = useAuthStore();
const router = useRouter();
const error = ref('');
const showPassword = ref(false);
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

</script>

<style scoped>
.login-page {
  min-height: 100vh;
  min-height: 100svh;
  display: grid;
  align-items: stretch;
  padding: 1rem;
  background:
    linear-gradient(135deg, rgba(251, 245, 230, 0.9) 0%, rgba(248, 250, 252, 0.72) 44%, rgba(239, 246, 255, 0.9) 100%),
    var(--bg-page);
}

.login-shell {
  width: min(1100px, 100%);
  margin: auto;
  display: grid;
  gap: 1rem;
}

.login-hero-panel,
.login-card {
  border: 1px solid var(--border-gold);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.login-hero-panel {
  color: #ffffff;
  padding: 1.25rem;
  display: grid;
  gap: 1.5rem;
  background:
    linear-gradient(145deg, rgba(7, 13, 24, 0.95) 0%, rgba(16, 35, 63, 0.96) 55%, rgba(153, 101, 21, 0.9) 100%),
    var(--navy-dark);
}

.brand-lockup,
.login-card-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.brand-mark,
.login-card-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: grid;
  place-items: center;
  flex: 0 0 48px;
  color: var(--navy-darkest);
  background: linear-gradient(135deg, var(--gold-light), var(--gold));
  box-shadow: var(--shadow-gold);
}

.brand-mark .app-icon,
.login-card-icon .app-icon {
  width: 1.55rem;
  height: 1.55rem;
}

.brand-lockup h1 {
  color: #ffffff;
  font-size: clamp(1.6rem, 8vw, 2.5rem);
  font-weight: 900;
}

.login-hero-copy {
  max-width: 560px;
}

.login-hero-copy h2 {
  color: #ffffff;
  font-size: clamp(1.75rem, 9vw, 3.4rem);
  font-weight: 900;
}

.login-hero-copy p {
  margin-top: 0.75rem;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.96rem;
}

.login-trust-grid {
  display: grid;
  gap: 0.75rem;
}

.login-trust-grid div {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.88);
  font-size: 0.85rem;
  font-weight: 800;
}

.login-trust-grid .app-icon {
  width: 1.2rem;
  height: 1.2rem;
  color: var(--gold-light);
}

.login-card {
  padding: 1.25rem;
}

.login-card-header {
  margin-bottom: 1.25rem;
}

.login-card-header h2 {
  font-size: 1.45rem;
  font-weight: 900;
}

.input-shell {
  min-height: 48px;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  padding: 0 0.75rem;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.input-shell:focus-within {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px var(--gold-glow);
}

.input-shell > .app-icon {
  width: 1.15rem;
  height: 1.15rem;
  flex: 0 0 1.15rem;
  color: var(--gold-dark);
}

.input-shell input {
  min-width: 0;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  padding: 0;
  background: transparent;
}

.input-shell input:focus {
  box-shadow: none;
}

.password-toggle {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.password-toggle:hover {
  background: var(--surface-hover);
  color: var(--text-main);
}

.password-toggle .app-icon {
  width: 1.1rem;
  height: 1.1rem;
}

.login-submit .app-icon {
  width: 1.15rem;
  height: 1.15rem;
}

.login-submit:disabled .app-icon {
  animation: spin 900ms linear infinite;
}

.error-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: var(--radius-md);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 0.85rem;
  font-weight: 700;
}

.error-text .app-icon {
  width: 1.1rem;
  height: 1.1rem;
  flex: 0 0 1.1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (min-width: 560px) {
  .login-page {
    padding: 1.5rem;
  }

  .login-trust-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 900px) {
  .login-shell {
    grid-template-columns: minmax(0, 1fr) minmax(380px, 430px);
    align-items: stretch;
  }

  .login-hero-panel,
  .login-card {
    padding: 2rem;
  }

  .login-hero-panel {
    min-height: 640px;
    align-content: space-between;
  }
}
</style>
