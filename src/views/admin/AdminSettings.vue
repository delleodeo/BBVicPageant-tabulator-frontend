<template>
  <AdminLayout title="Settings & Pageant Configuration">
    <!-- Pageant Information Panel -->
    <section class="panel panel-gold">
      <div class="section-head">
        <div>
          <span class="eyebrow">👑 Pageant Branding</span>
          <h2>Pageant Information & Branding</h2>
          <p class="section-subhead">These details appear on official PDF certificates, printouts, and the stage presentation screen</p>
        </div>
      </div>

      <form class="stack-form" @submit.prevent="save">
        <div class="form-row-2">
          <label>
            Pageant Name *
            <input v-model="form.pageantName" placeholder="e.g. Miss Universe Philippines" required />
          </label>

          <label>
            Event Title *
            <input v-model="form.eventName" placeholder="e.g. Grand Coronation Night 2026" required />
          </label>
        </div>

        <div class="form-row-2">
          <label>
            Board of Tabulators / Organization Name
            <input v-model="form.organizationName" placeholder="e.g. Official Board of Tabulators & Auditors" />
          </label>

          <label>
            Pageant Motto / Tagline
            <input v-model="form.motto" placeholder="e.g. Beauty, Brains, and Elegance" />
          </label>
        </div>

        <div class="form-row-2">
          <label>
            Venue
            <input v-model="form.venue" placeholder="e.g. Grand Ballroom, Waterfront Hotel" />
          </label>

          <label>
            Event Date
            <input v-model="form.eventDate" type="date" />
          </label>
        </div>

        <div class="form-row-2">
          <label>
            Logo Image URL
            <input v-model="form.logo" placeholder="https://example.com/logo.png" />
          </label>

          <label>
            Stage Confetti & Sound Effects
            <select v-model="form.soundEnabled">
              <option :value="true">Enabled (Auditorium & Fanfare)</option>
              <option :value="false">Disabled</option>
            </select>
          </label>
        </div>

        <div class="button-row" style="margin-top: 1rem;">
          <button class="btn btn-primary" type="submit">
            Save Pageant Settings
          </button>
        </div>
      </form>
    </section>

    <!-- Official Criteria Configuration Reference -->
    <section class="panel">
      <div class="section-head">
        <div>
          <h3>Official Scoring Criteria & Weight Distribution</h3>
          <p class="section-subhead">System-enforced scoring formulas for Round 1 & Final Championship</p>
        </div>
      </div>

      <div class="criteria-preview-grid">
        <div class="criteria-section-box">
          <h4>Round 1 (Preliminary Phase)</h4>
          <ul class="criteria-list">
            <li><span>Production Outfit:</span> <strong>10% (0.0 - 10.0 scale)</strong></li>
            <li><span>Swimsuit Competition:</span> <strong>10% (0.0 - 10.0 scale)</strong></li>
            <li><span>Festival Costume:</span> <strong>30% (0.0 - 10.0 scale)</strong></li>
            <li><span>Evening Gown:</span> <strong>20% (0.0 - 10.0 scale)</strong></li>
            <li><span>Beauty & Intelligence (Q&A):</span> <strong>30% (0.0 - 10.0 scale)</strong></li>
            <li class="criteria-total-row"><span>Total Round 1:</span> <strong>100% (100 Points Max)</strong></li>
          </ul>
        </div>

        <div class="criteria-section-box">
          <h4>Final Round (Top 5 Championship)</h4>
          <ul class="criteria-list">
            <li><span>Round 1 Weighted Carry-over:</span> <strong>20% (Max 20 pts)</strong></li>
            <li><span>Final Intelligence & Q&A:</span> <strong>40% (Max 40 pts)</strong></li>
            <li><span>Final Beauty & Charisma:</span> <strong>40% (Max 40 pts)</strong></li>
            <li class="criteria-total-row"><span>Total Final Championship:</span> <strong>100% (100 Points Max)</strong></li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Data Management, Backup & Reset Section -->
    <section class="panel">
      <div class="section-head">
        <div>
          <h3>System Backup & Demonstration Tools</h3>
          <p class="section-subhead">Export complete database snapshot or reset to clean sample pageant state</p>
        </div>
      </div>

      <div class="backup-tools-grid">
        <div class="backup-tool-card">
          <div class="tool-icon">💾</div>
          <div>
            <h4>Download Full Backup Snapshot</h4>
            <p style="font-size: 0.84rem; color: var(--text-muted);">
              Exports all candidates, scores, judges, audit logs, and settings to a standalone JSON file.
            </p>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" @click="downloadBackup">
            Download JSON Backup
          </button>
        </div>

        <div class="backup-tool-card">
          <div class="tool-icon">🔄</div>
          <div>
            <h4>Reset Pageant with Sample Demo Data</h4>
            <p style="font-size: 0.84rem; color: var(--text-muted);">
              Re-populates the database with 10 sample candidates with photos, 5 active judges, and Round 1 scores for testing.
            </p>
          </div>
          <button type="button" class="btn btn-danger btn-sm" @click="resetDemoData">
            Reset Demo Data
          </button>
        </div>
      </div>
    </section>

    <Toast :message="message" />
  </AdminLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import Toast from '../../components/Toast.vue';
import AdminLayout from '../../layouts/AdminLayout.vue';
import { api } from '../../services/api.js';

const message = ref('');
const form = reactive({
  pageantName: '',
  eventName: '',
  organizationName: '',
  motto: '',
  eventDate: '',
  venue: '',
  logo: '',
  soundEnabled: true
});

onMounted(async () => {
  const { data } = await api.get('/pageant');
  Object.assign(form, {
    ...data.pageant,
    eventDate: data.pageant.eventDate ? data.pageant.eventDate.slice(0, 10) : ''
  });
});

async function save() {
  await api.put('/pageant', form);
  message.value = 'Pageant settings updated successfully.';
  setTimeout(() => (message.value = ''), 2500);
}

async function downloadBackup() {
  const response = await api.get('/admin/system/backup', { responseType: 'blob' });
  const href = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = href;
  link.download = `pageant-tabulation-backup-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(href);
}

async function resetDemoData() {
  if (!confirm('Are you sure you want to reset all scores and load fresh sample candidates and scores?')) return;
  try {
    await api.post('/admin/system/reset-demo');
    message.value = 'Sample pageant data reloaded successfully.';
    setTimeout(() => (message.value = ''), 2500);
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to reset demo data.');
  }
}
</script>

<style scoped>
.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.criteria-preview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.criteria-section-box {
  background: var(--surface-hover);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1.25rem;
}

.criteria-section-box h4 {
  font-size: 1rem;
  font-weight: 800;
  color: var(--navy);
  margin-bottom: 0.75rem;
}

.criteria-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.criteria-list li {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  border-bottom: 1px dashed var(--border);
}

.criteria-total-row {
  border-top: 2px solid var(--gold) !important;
  border-bottom: none !important;
  font-weight: 900;
  color: var(--gold-dark);
  margin-top: 0.4rem;
  padding-top: 0.5rem !important;
}

.backup-tools-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.backup-tool-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: var(--surface-hover);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1.25rem;
}

.tool-icon {
  font-size: 1.8rem;
}

.backup-tool-card h4 {
  font-size: 1rem;
  font-weight: 800;
}

@media (max-width: 700px) {
  .form-row-2,
  .criteria-preview-grid,
  .backup-tools-grid {
    grid-template-columns: 1fr;
  }
}
</style>
