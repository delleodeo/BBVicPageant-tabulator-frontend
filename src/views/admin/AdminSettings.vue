<template>
  <AdminLayout title="Settings & Pageant Configuration">
    <!-- Pageant Information Panel -->
    <section class="panel panel-gold">
      <div class="section-head">
        <div>
          <span class="eyebrow"><AppIcon name="settings" /> Pageant Branding</span>
          <h2>Pageant Information & Branding</h2>
          <p class="section-subhead">These details appear on official PDF certificates and printouts</p>
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

        <label>
          Logo Image URL
          <input v-model="form.logo" placeholder="https://example.com/logo.png" />
        </label>

        <div class="button-row" style="margin-top: 1rem;">
          <button class="btn btn-primary" type="submit" :disabled="saving">
            <AppIcon name="check" />
            {{ saving ? 'Saving...' : 'Save Pageant Settings' }}
          </button>
        </div>
      </form>
    </section>

    <!-- Official Criteria Configuration -->
    <section class="panel">
      <div class="section-head">
        <div>
          <h3>Official Scoring Criteria & Weight Distribution</h3>
          <p class="section-subhead">Add criteria or change their names and weights. Saved changes are used immediately in judge scoring and all calculations.</p>
        </div>
      </div>

      <form class="stack-form" @submit.prevent="save">
      <div class="criteria-preview-grid">
        <div class="criteria-section-box">
          <h4>Round 1 (Preliminary Phase)</h4>
          <p class="criteria-help">Each judge scores every criterion from 0.0 to 10.0.</p>
          <div class="criteria-editor">
            <div v-for="(criterion, index) in form.roundOneCategories" :key="criterion.key" class="criterion-row">
              <label>
                Criterion name
                <input v-model.trim="criterion.label" required maxlength="80" />
              </label>
              <label class="weight-field">
                Weight
                <span class="weight-input"><input v-model.number="criterion.weight" type="number" min="0.1" max="100" step="0.1" required /><span>%</span></span>
              </label>
              <button class="btn btn-ghost criterion-remove" type="button" :disabled="isProtectedCriterion('roundOneCategories', criterion.key)" :title="isProtectedCriterion('roundOneCategories', criterion.key) ? 'Current criteria can be changed but not removed.' : 'Remove added criterion'" :aria-label="`Remove ${criterion.label || `criterion ${index + 1}`}`" @click="removeCriterion('roundOneCategories', index)">
                <AppIcon name="trash" />
              </button>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" type="button" :disabled="form.roundOneCategories.length >= 12" @click="addCriterion('roundOneCategories')"><AppIcon name="plus" /> Add Round 1 Criterion</button>
          <div class="criteria-total-row" :class="{ invalid: !roundOneWeightValid }"><span>Total Round 1:</span><strong>{{ roundOneWeight }}% / 100%</strong></div>
        </div>

        <div class="criteria-section-box">
          <h4>Final Round (Top 5 Championship)</h4>
          <p class="criteria-help">Round 1 remains a fixed 20% carry-over. Final criteria must total the remaining 80%.</p>
          <div class="fixed-criterion"><span>Round 1 Weighted Carry-over</span><strong>20%</strong></div>
          <div class="criteria-editor">
            <div v-for="(criterion, index) in form.finalCategories" :key="criterion.key" class="criterion-row">
              <label>
                Criterion name
                <input v-model.trim="criterion.label" required maxlength="80" />
              </label>
              <label class="weight-field">
                Weight
                <span class="weight-input"><input v-model.number="criterion.weight" type="number" min="0.1" max="80" step="0.1" required /><span>%</span></span>
              </label>
              <button class="btn btn-ghost criterion-remove" type="button" :disabled="isProtectedCriterion('finalCategories', criterion.key)" :title="isProtectedCriterion('finalCategories', criterion.key) ? 'Current criteria can be changed but not removed.' : 'Remove added criterion'" :aria-label="`Remove ${criterion.label || `criterion ${index + 1}`}`" @click="removeCriterion('finalCategories', index)">
                <AppIcon name="trash" />
              </button>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" type="button" :disabled="form.finalCategories.length >= 12" @click="addCriterion('finalCategories')"><AppIcon name="plus" /> Add Final Criterion</button>
          <div class="criteria-total-row" :class="{ invalid: !finalWeightValid }"><span>Total Final Championship:</span><strong>20% + {{ finalWeight }}% = {{ finalWeight + 20 }}%</strong></div>
        </div>
      </div>
      <p class="criteria-warning"><AppIcon name="warning" /> Adding a criterion makes each score sheet incomplete until every judge submits a score for it. Existing scores and criteria are kept.</p>
      <div class="button-row">
        <button class="btn btn-primary" type="submit" :disabled="saving || !criteriaValid"><AppIcon name="check" /> {{ saving ? 'Saving...' : 'Save Scoring Criteria' }}</button>
      </div>
      </form>
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
          <div class="tool-icon"><AppIcon name="arrowDownTray" /></div>
          <div>
            <h4>Download Full Backup Snapshot</h4>
            <p style="font-size: 0.84rem; color: var(--text-muted);">
              Exports all candidates, scores, judges, audit logs, and settings to a standalone JSON file.
            </p>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" @click="downloadBackup">
            <AppIcon name="arrowDownTray" />
            Download JSON Backup
          </button>
        </div>

        <div class="backup-tool-card">
          <div class="tool-icon"><AppIcon name="arrowPath" /></div>
          <div>
            <h4>Reset Pageant with Sample Demo Data</h4>
            <p style="font-size: 0.84rem; color: var(--text-muted);">
              Re-populates the database with 10 sample candidates with photos, 5 active judges, and Round 1 scores for testing.
            </p>
          </div>
          <button type="button" class="btn btn-danger btn-sm" @click="resetDemoData">
            <AppIcon name="arrowPath" />
            Reset Demo Data
          </button>
        </div>

        <div class="backup-tool-card score-reset-card">
          <div class="tool-icon danger"><AppIcon name="trash" /></div>
          <div>
            <h4>Reset All Judge Scores</h4>
            <p style="font-size: 0.84rem; color: var(--text-muted);">
              Deletes every score, reopens Round 1, clears generated finalists, and returns the Final Round to setup.
            </p>
          </div>
          <button type="button" class="btn btn-danger btn-sm" @click="openScoreReset">
            <AppIcon name="trash" />
            Reset All Scores
          </button>
        </div>
      </div>
    </section>

    <Modal :open="scoreResetOpen">
      <div class="score-reset-dialog" role="dialog" aria-modal="true" aria-labelledby="score-reset-title">
        <div class="reset-dialog-icon"><AppIcon name="warning" /></div>
        <div>
          <span class="eyebrow">Permanent Action</span>
          <h2 id="score-reset-title">Reset All Judge Scores?</h2>
          <p>
            This cannot be undone. It deletes every Round 1 and Final Round score, removes the generated finalist roster, reopens Round 1, and locks Final Round scoring until Round 1 is completed again. Contestants, judges, settings, and audit history are preserved.
          </p>
        </div>

        <label class="confirmation-field">
          Type <code>tabulation</code> to confirm
          <input
            v-model="scoreResetConfirmation"
            autocomplete="off"
            autocapitalize="none"
            spellcheck="false"
            placeholder="Type tabulation"
            @input="scoreResetError = ''"
            @keyup.enter="resetAllJudgeScores"
          />
        </label>
        <p v-if="scoreResetError" class="error-text">{{ scoreResetError }}</p>

        <div class="button-row reset-dialog-actions">
          <button type="button" class="btn btn-ghost" :disabled="resettingScores" @click="closeScoreReset">
            Cancel
          </button>
          <button type="button" class="btn btn-danger" :disabled="!canResetScores || resettingScores" @click="resetAllJudgeScores">
            <AppIcon name="trash" />
            {{ resettingScores ? 'Resetting Scores...' : 'Permanently Reset Scores' }}
          </button>
        </div>
      </div>
    </Modal>

    <Toast :message="message" />
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import AppIcon from '../../components/AppIcon.vue';
import Modal from '../../components/Modal.vue';
import Toast from '../../components/Toast.vue';
import AdminLayout from '../../layouts/AdminLayout.vue';
import { api } from '../../services/api.js';
import { finalCategories, roundOneCategories } from '../../utils/score.js';

const message = ref('');
const saving = ref(false);
const scoreResetOpen = ref(false);
const scoreResetConfirmation = ref('');
const scoreResetError = ref('');
const resettingScores = ref(false);
const canResetScores = computed(() => scoreResetConfirmation.value === 'tabulation');
let criterionSequence = 0;
const protectedKeys = {
  roundOneCategories: new Set(roundOneCategories.map(({ key }) => key)),
  finalCategories: new Set(finalCategories.map(({ key }) => key))
};
const form = reactive({
  pageantName: '',
  eventName: '',
  organizationName: '',
  motto: '',
  eventDate: '',
  venue: '',
  logo: '',
  roundOneCategories: roundOneCategories.map((criterion) => ({ ...criterion })),
  finalCategories: finalCategories.map((criterion) => ({ ...criterion }))
});

const sumWeights = (criteria) => Math.round(criteria.reduce((sum, criterion) => sum + (Number(criterion.weight) || 0), 0) * 10) / 10;
const roundOneWeight = computed(() => sumWeights(form.roundOneCategories));
const finalWeight = computed(() => sumWeights(form.finalCategories));
const roundOneWeightValid = computed(() => Math.abs(roundOneWeight.value - 100) < 0.001);
const finalWeightValid = computed(() => Math.abs(finalWeight.value - 80) < 0.001);
const criteriaValid = computed(() => {
  const allCriteria = [...form.roundOneCategories, ...form.finalCategories];
  const labelsValid = allCriteria.every((criterion) => criterion.label?.trim() && Number(criterion.weight) > 0);
  const uniqueWithinRound = (criteria) => new Set(criteria.map((criterion) => criterion.label.trim().toLowerCase())).size === criteria.length;
  return labelsValid && uniqueWithinRound(form.roundOneCategories) && uniqueWithinRound(form.finalCategories) && roundOneWeightValid.value && finalWeightValid.value;
});

onMounted(async () => {
  const { data } = await api.get('/pageant');
  Object.assign(form, {
    ...data.pageant,
    eventDate: data.pageant.eventDate ? data.pageant.eventDate.slice(0, 10) : '',
    roundOneCategories: (data.pageant.roundOneCategories?.length ? data.pageant.roundOneCategories : roundOneCategories).map((criterion) => ({ key: criterion.key, label: criterion.label, weight: Number(criterion.weight) })),
    finalCategories: (data.pageant.finalCategories?.length ? data.pageant.finalCategories : finalCategories).map((criterion) => ({ key: criterion.key, label: criterion.label, weight: Number(criterion.weight) }))
  });
});

async function save() {
  if (!criteriaValid.value) {
    message.value = 'Round 1 criteria must total 100% and Final criteria must total 80%. Names must be unique.';
    setTimeout(() => (message.value = ''), 4000);
    return;
  }
  saving.value = true;
  try {
    const { data } = await api.put('/pageant', form);
    form.roundOneCategories = data.pageant.roundOneCategories.map((criterion) => ({ key: criterion.key, label: criterion.label, weight: Number(criterion.weight) }));
    form.finalCategories = data.pageant.finalCategories.map((criterion) => ({ key: criterion.key, label: criterion.label, weight: Number(criterion.weight) }));
    message.value = 'Pageant settings and scoring criteria updated successfully.';
    setTimeout(() => (message.value = ''), 2500);
  } catch (err) {
    message.value = err.response?.data?.message || 'Unable to save scoring criteria.';
    setTimeout(() => (message.value = ''), 4000);
  } finally {
    saving.value = false;
  }
}

function addCriterion(field) {
  if (form[field].length >= 12) return;
  criterionSequence += 1;
  form[field].push({
    key: `custom${Date.now().toString(36)}${criterionSequence.toString(36)}`,
    label: 'New Criterion',
    weight: 10
  });
}

function removeCriterion(field, index) {
  if (!isProtectedCriterion(field, form[field][index]?.key)) form[field].splice(index, 1);
}

function isProtectedCriterion(field, key) {
  return protectedKeys[field].has(key);
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

function openScoreReset() {
  scoreResetConfirmation.value = '';
  scoreResetError.value = '';
  scoreResetOpen.value = true;
}

function closeScoreReset() {
  if (resettingScores.value) return;
  scoreResetOpen.value = false;
  scoreResetConfirmation.value = '';
  scoreResetError.value = '';
}

async function resetAllJudgeScores() {
  if (!canResetScores.value || resettingScores.value) {
    scoreResetError.value = 'Type "tabulation" exactly to continue.';
    return;
  }

  resettingScores.value = true;
  scoreResetError.value = '';
  try {
    const { data } = await api.post('/admin/system/reset-scores', {
      confirmation: scoreResetConfirmation.value
    });
    scoreResetOpen.value = false;
    scoreResetConfirmation.value = '';
    const total = data.deletedScores?.total || 0;
    message.value = `${total} judge score record${total === 1 ? '' : 's'} reset. Round 1 reopened and the Final Round returned to setup.`;
    setTimeout(() => (message.value = ''), 3500);
  } catch (err) {
    scoreResetError.value = err.response?.data?.message || 'Unable to reset judge scores.';
  } finally {
    resettingScores.value = false;
  }
}
</script>

<style scoped>
.form-row-2 {
  display: grid;
  gap: 1rem;
}

.criteria-preview-grid {
  display: grid;
  gap: 1.5rem;
  min-width: 0;
}

.criteria-section-box {
  min-width: 0;
  max-width: 100%;
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

.criteria-help {
  color: var(--text-muted);
  font-size: 0.82rem;
  margin-bottom: 0.9rem;
}

.criteria-editor {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.criterion-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 105px auto;
  align-items: end;
  gap: 0.6rem;
}

.criterion-row label {
  min-width: 0;
  font-size: 0.74rem;
  color: var(--text-muted);
}

.criterion-row input {
  width: 100%;
  min-width: 0;
  margin-top: 0.25rem;
}

.weight-input {
  display: flex;
  align-items: center;
  position: relative;
}

.weight-input input {
  padding-right: 1.7rem;
}

.weight-input span {
  position: absolute;
  right: 0.65rem;
  top: 50%;
  transform: translateY(-38%);
  font-weight: 800;
}

.criterion-remove {
  padding: 0.65rem;
}

.fixed-criterion,
.criteria-total-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.84rem;
}

.fixed-criterion {
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  padding: 0.7rem;
  margin-bottom: 0.75rem;
}

.criteria-total-row {
  border-top: 2px solid var(--gold);
  font-weight: 900;
  color: var(--gold-dark);
  margin-top: 0.4rem;
  padding-top: 0.65rem;
}

.criteria-total-row.invalid {
  color: var(--danger);
  border-color: var(--danger);
}

.criteria-warning {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  min-width: 0;
  max-width: 100%;
  color: var(--text-muted);
  font-size: 0.8rem;
  line-height: 1.45;
  margin: 1rem 0;
}

.criteria-warning .app-icon {
  width: 1.1rem;
  height: 1.1rem;
  color: var(--gold-dark);
  flex: 0 0 1.1rem;
  margin-top: 0.05rem;
}

.backup-tools-grid {
  display: grid;
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
  color: var(--gold-dark);
}

.tool-icon .app-icon {
  width: 1.8rem;
  height: 1.8rem;
}

.tool-icon.danger {
  color: var(--danger);
}

.score-reset-card {
  border-color: color-mix(in srgb, var(--danger) 35%, var(--border));
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--danger) 6%, var(--surface-hover)), var(--surface-hover));
}

.score-reset-dialog {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reset-dialog-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  color: var(--danger);
  background: var(--danger-soft);
}

.reset-dialog-icon .app-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.score-reset-dialog h2 {
  margin: 0.25rem 0 0.4rem;
  font-size: 1.35rem;
}

.score-reset-dialog p {
  color: var(--text-muted);
  font-size: 0.86rem;
  line-height: 1.55;
}

.confirmation-field code {
  padding: 0.12rem 0.35rem;
  border-radius: var(--radius-sm);
  color: var(--danger);
  background: var(--danger-soft);
  font-weight: 900;
}

.confirmation-field input {
  margin-top: 0.35rem;
}

.reset-dialog-actions {
  justify-content: flex-end;
}

.score-reset-dialog .error-text {
  color: var(--danger);
  font-weight: 700;
}

.backup-tool-card h4 {
  font-size: 1rem;
  font-weight: 800;
}

@media (max-width: 520px) {
  .criterion-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .criterion-row > label:first-child {
    grid-column: 1 / -1;
  }
}

@media (min-width: 700px) {
  .form-row-2,
  .criteria-preview-grid,
  .backup-tools-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
