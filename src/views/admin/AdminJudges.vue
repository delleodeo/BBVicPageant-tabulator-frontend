<template>
  <AdminLayout title="Judges Management">
    <!-- Header Controls -->
    <section class="panel panel-gold">
      <div class="section-head">
        <div>
          <span class="eyebrow">⚖️ Board of Judges</span>
          <h2>Accredited Judges ({{ judges.length }})</h2>
          <p class="section-subhead">Manage judge accounts, credentials, designations, and reset passwords</p>
        </div>

        <div class="button-row">
          <button type="button" class="btn btn-gold" @click="showCreateModal = true">
            + Add New Judge
          </button>
          <button type="button" class="btn btn-ghost" @click="printJudgeCredentials">
            🖨️ Print Judge Tally Cards
          </button>
        </div>
      </div>
    </section>

    <LoadingState v-if="loading" label="judges" />

    <!-- Judges Table -->
    <section v-else class="panel">
      <table class="plain-table">
        <thead>
          <tr>
            <th>Judge ID</th>
            <th>Full Name</th>
            <th>Official Designation</th>
            <th>Username</th>
            <th>System Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="judge in judges" :key="judge._id">
            <td>
              <span class="judge-id-badge">{{ judge.judgeId }}</span>
            </td>
            <td>
              <strong>{{ judge.name }}</strong>
            </td>
            <td>
              <span class="designation-text">{{ judge.designation || 'Member, Board of Judges' }}</span>
            </td>
            <td>
              <code>@{{ judge.userId?.username }}</code>
            </td>
            <td>
              <StatusBadge
                :label="judge.status === 'active' ? 'ACTIVE' : 'INACTIVE'"
                :tone="judge.status === 'active' ? 'success' : 'danger'"
              />
            </td>
            <td>
              <div class="button-row">
                <button type="button" class="btn btn-ghost btn-sm" @click="openEditModal(judge)">
                  Edit
                </button>
                <button type="button" class="btn btn-ghost btn-sm" @click="openPasswordReset(judge)">
                  Reset Password
                </button>
                <button
                  type="button"
                  class="btn btn-sm"
                  :class="judge.status === 'active' ? 'btn-danger' : 'btn-primary'"
                  @click="toggleStatus(judge)"
                >
                  {{ judge.status === 'active' ? 'Deactivate' : 'Activate' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Create / Edit Judge Modal -->
    <div v-if="showCreateModal" class="modal-backdrop" @click.self="showCreateModal = false">
      <div class="modal-panel">
        <div class="section-head">
          <h3>{{ editingJudgeId ? 'Edit Judge Details' : 'Register New Judge' }}</h3>
          <button type="button" class="btn btn-ghost btn-sm" @click="showCreateModal = false">✕</button>
        </div>

        <form class="stack-form" @submit.prevent="saveJudge">
          <label>
            Judge ID *
            <input v-model="form.judgeId" placeholder="e.g. J001, J002" required />
          </label>

          <label>
            Full Name *
            <input v-model="form.name" placeholder="e.g. Maria Clara" required />
          </label>

          <label>
            Official Designation / Title
            <input v-model="form.designation" placeholder="e.g. Chairman of the Board, Fashion Designer" />
          </label>

          <label v-if="!editingJudgeId">
            Username *
            <input v-model="form.username" placeholder="e.g. judge006" required />
          </label>

          <label v-if="!editingJudgeId">
            Initial Password *
            <input v-model="form.password" type="password" placeholder="••••••••" required />
          </label>

          <div class="button-row" style="margin-top: 1rem;">
            <button type="submit" class="btn btn-primary full">
              {{ editingJudgeId ? 'Save Changes' : 'Create Judge Account' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Password Reset Modal -->
    <div v-if="showResetModal" class="modal-backdrop" @click.self="showResetModal = false">
      <div class="modal-panel">
        <div class="section-head">
          <h3>Reset Judge Password</h3>
          <button type="button" class="btn btn-ghost btn-sm" @click="showResetModal = false">✕</button>
        </div>

        <p style="font-size: 0.88rem; color: var(--text-muted);">
          Resetting password for <strong>{{ targetJudge?.name }} ({{ targetJudge?.judgeId }})</strong>:
        </p>

        <form class="stack-form" @submit.prevent="executeResetPassword">
          <label>
            New Password *
            <input v-model="newPassword" placeholder="Enter new password..." required />
          </label>

          <div class="button-row">
            <button type="button" class="btn btn-ghost btn-sm" @click="generateRandomPassword">
              Generate Random Password
            </button>
          </div>

          <div class="button-row" style="margin-top: 1rem;">
            <button type="submit" class="btn btn-danger full">
              Confirm Password Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import LoadingState from '../../components/LoadingState.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import AdminLayout from '../../layouts/AdminLayout.vue';
import { api } from '../../services/api.js';

const judges = ref([]);
const loading = ref(true);
const showCreateModal = ref(false);
const showResetModal = ref(false);
const editingJudgeId = ref(null);
const targetJudge = ref(null);
const newPassword = ref('');

const form = reactive({
  judgeId: '',
  name: '',
  designation: '',
  username: '',
  password: '',
  status: 'active'
});

async function load() {
  loading.value = true;
  const { data } = await api.get('/judges');
  judges.value = data.judges || [];
  loading.value = false;
}

function openEditModal(judge) {
  editingJudgeId.value = judge._id;
  Object.assign(form, {
    judgeId: judge.judgeId,
    name: judge.name,
    designation: judge.designation || '',
    username: judge.userId?.username || '',
    password: '',
    status: judge.status
  });
  showCreateModal.value = true;
}

async function saveJudge() {
  try {
    if (editingJudgeId.value) {
      await api.put(`/judges/${editingJudgeId.value}`, form);
    } else {
      await api.post('/judges', form);
    }
    showCreateModal.value = false;
    await load();
  } catch (err) {
    alert(err.response?.data?.message || 'Error saving judge.');
  }
}

async function toggleStatus(judge) {
  const next = judge.status === 'active' ? 'inactive' : 'active';
  await api.patch(`/judges/${judge._id}/status`, { status: next });
  await load();
}

function openPasswordReset(judge) {
  targetJudge.value = judge;
  newPassword.value = '';
  showResetModal.value = true;
}

function generateRandomPassword() {
  const random = 'judge' + Math.floor(10000 + Math.random() * 90000);
  newPassword.value = random;
}

async function executeResetPassword() {
  if (!targetJudge.value?._id || !newPassword.value) return;
  try {
    await api.post(`/judges/${targetJudge.value._id}/reset-password`, {
      password: newPassword.value
    });
    alert(`Password reset successful for ${targetJudge.value.name}. New password: ${newPassword.value}`);
    showResetModal.value = false;
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to reset password.');
  }
}

function printJudgeCredentials() {
  window.print();
}

onMounted(load);
</script>

<style scoped>
.judge-id-badge {
  font-size: 0.8rem;
  font-weight: 800;
  padding: 0.2rem 0.55rem;
  border-radius: var(--radius-sm);
  background: var(--surface-active);
  color: var(--text-main);
}

.designation-text {
  font-size: 0.85rem;
  color: var(--gold-dark);
  font-weight: 700;
}
</style>
