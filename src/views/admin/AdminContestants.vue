<template>
  <AdminLayout title="Contestants Management">
    <!-- Header Control Bar -->
    <section class="contestants-hero-panel">
      <div class="contestants-hero-copy">
        <span class="eyebrow"><AppIcon name="contestants" /> Candidate Registry</span>
        <h2>Official Contestants</h2>
        <p>Manage candidate profiles, photos, hometowns, and advocacies.</p>

        <div class="contestant-stats-row" aria-label="Contestant status summary">
          <span><strong>{{ contestants.length }}</strong> Total</span>
          <span><strong>{{ statusCount('ACTIVE') }}</strong> Active</span>
          <span><strong>{{ statusCount('FINALIST') }}</strong> Finalists</span>
        </div>
      </div>

      <div class="contestants-hero-actions">
          <button type="button" class="btn btn-gold" @click="openCreateModal">
            <AppIcon name="plus" />
            Add New Candidate
          </button>
          <button type="button" class="btn btn-ghost" @click="showBulkImportModal = true">
            <AppIcon name="arrowDownTray" />
            Bulk Import CSV
          </button>
          <button type="button" class="btn btn-ghost" @click="exportContestantsCsv">
            <AppIcon name="arrowUpTray" />
            Export CSV
          </button>
          <button type="button" class="btn btn-ghost btn-icon" :title="mode === 'card' ? 'Switch to Table' : 'Switch to Cards'" @click="mode = mode === 'card' ? 'table' : 'card'">
            <AppIcon :name="mode === 'card' ? 'table' : 'contestants'" />
          </button>
      </div>
    </section>

    <!-- Filter & Search Bar -->
    <div class="filter-search-bar">
      <div class="filter-chips">
        <button
          type="button"
          class="filter-chip"
          :class="{ active: filterStatus === 'ALL' }"
          @click="filterStatus = 'ALL'"
        >
          All ({{ contestants.length }})
        </button>
        <button
          type="button"
          class="filter-chip"
          :class="{ active: filterStatus === 'ACTIVE' }"
          @click="filterStatus = 'ACTIVE'"
        >
          Active
        </button>
        <button
          type="button"
          class="filter-chip"
          :class="{ active: filterStatus === 'FINALIST' }"
          @click="filterStatus = 'FINALIST'"
        >
          <AppIcon name="finalists" />
          Finalists
        </button>
        <button
          type="button"
          class="filter-chip"
          :class="{ active: filterStatus === 'ELIMINATED' }"
          @click="filterStatus = 'ELIMINATED'"
        >
          Eliminated
        </button>
      </div>

      <div class="search-input-wrap">
        <AppIcon name="search" />
        <input v-model="searchQuery" placeholder="Search by name, # or hometown..." />
      </div>
    </div>

    <LoadingState v-if="loading" label="contestants" />

    <!-- Card View -->
    <section v-else-if="mode === 'card' && filteredContestants.length > 0" class="admin-contestants-grid">
      <article v-for="c in filteredContestants" :key="c._id" class="entity-card">
        <div class="contestant-card-top">
          <div class="admin-candidate-photo">
            <img v-if="c.photo" :src="mediaUrl(c.photo)" :alt="c.name" />
            <span v-else>{{ c.name.slice(0, 2).toUpperCase() }}</span>
          </div>

          <div class="entity-info">
            <span class="c-number-badge">#{{ c.contestantNumber }}</span>
            <h3 class="c-title">{{ c.name }}</h3>
            <p v-if="c.hometown" class="c-hometown">
              <AppIcon name="mapPin" />
              {{ c.hometown }}
            </p>
            <StatusBadge
              class="candidate-status-inline"
              :label="c.status"
              :tone="c.status === 'FINALIST' ? 'success' : c.status === 'ELIMINATED' ? 'warning' : 'neutral'"
            />
          </div>
        </div>

        <p class="c-advocacy-snippet">{{ c.advocacy || 'No advocacy added yet.' }}</p>

        <div class="entity-footer">
          <div class="button-row">
            <button type="button" class="btn btn-ghost btn-sm" @click="edit(c)">
              <AppIcon name="pencil" />
              Edit
            </button>
            <button type="button" class="btn btn-danger btn-sm" @click="remove(c)">
              <AppIcon name="trash" />
              Delete
            </button>
          </div>
        </div>
      </article>
    </section>

    <!-- Table View -->
    <section v-else-if="filteredContestants.length > 0" class="panel">
      <table class="plain-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Photo</th>
            <th>Name</th>
            <th>Hometown</th>
            <th>Age</th>
            <th>Advocacy</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in filteredContestants" :key="c._id">
            <td><strong>#{{ c.contestantNumber }}</strong></td>
            <td>
              <div class="photo-frame small" style="width: 38px; height: 38px;">
                <img v-if="c.photo" :src="mediaUrl(c.photo)" :alt="c.name" />
                <span v-else>{{ c.name.slice(0, 2).toUpperCase() }}</span>
              </div>
            </td>
            <td><strong>{{ c.name }}</strong></td>
            <td>{{ c.hometown || '-' }}</td>
            <td>{{ c.age || '-' }}</td>
            <td class="advocacy-cell">{{ c.advocacy || '-' }}</td>
            <td>
              <StatusBadge :label="c.status" :tone="c.status === 'FINALIST' ? 'success' : 'neutral'" />
            </td>
            <td>
              <div class="button-row">
                <button type="button" class="btn btn-ghost btn-sm" @click="edit(c)">Edit</button>
                <button type="button" class="btn btn-danger btn-sm" @click="remove(c)">Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <EmptyState v-else message="No contestants match your current filters." />

    <!-- Candidate Modal Editor -->
    <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
      <div class="modal-panel modal-panel-lg">
        <div class="section-head">
          <h3>{{ form._id ? 'Edit Candidate Profile' : 'Register New Candidate' }}</h3>
          <button type="button" class="btn btn-ghost btn-icon btn-sm" title="Close" @click="showModal = false">
            <AppIcon name="xMark" />
          </button>
        </div>

        <form class="stack-form" @submit.prevent="save">
          <div class="form-row-2">
            <label>
              Candidate Number *
              <input v-model="form.contestantNumber" placeholder="e.g. 01, 02" required />
            </label>
            <label>
              Full Name *
              <input v-model="form.name" placeholder="e.g. Maria Santos" required />
            </label>
          </div>

          <div class="form-row-2">
            <label>
              Hometown / Province / City
              <input v-model="form.hometown" placeholder="e.g. Cebu City, Manila" />
            </label>
            <label>
              Age (optional)
              <input v-model="form.age" type="number" min="0" max="120" placeholder="Leave blank if unknown" />
            </label>
          </div>

          <div class="form-row-2">
            <label>
              Height
              <input v-model="form.height" placeholder="e.g. 5'8&quot;" />
            </label>
            <label>
              Competition Status
              <select v-model="form.status">
                <option value="ACTIVE">ACTIVE</option>
                <option value="FINALIST">FINALIST</option>
                <option value="ELIMINATED">ELIMINATED</option>
              </select>
            </label>
          </div>

          <label>
            Photo URL
            <input v-model="form.photo" placeholder="https://example.com/photo.jpg" />
          </label>

          <label>
            Upload Candidate Photo (max 15 MB)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              :disabled="photoUpload.uploading"
              @change="handlePhotoFileChange"
            />
          </label>

          <div v-if="form.photo || photoUpload.uploading || photoUpload.error" class="photo-upload-preview">
            <div class="photo-frame small">
              <img v-if="form.photo" :src="mediaUrl(form.photo)" alt="Candidate photo preview" />
              <AppIcon v-else name="contestants" />
            </div>
            <div>
              <strong>{{ photoUpload.uploading ? 'Uploading image...' : 'Photo ready' }}</strong>
              <p v-if="photoUpload.error">{{ photoUpload.error }}</p>
              <p v-else-if="form.photo">{{ form.photo }}</p>
            </div>
          </div>

          <label>
            Official Advocacy
            <input v-model="form.advocacy" placeholder="e.g. Youth Education & Environmental Literacy" />
          </label>

          <label>
            Biographical Profile
            <textarea v-model="form.bio" rows="3" placeholder="Background, accomplishments, hobbies..."></textarea>
          </label>

          <div class="button-row" style="margin-top: 1rem;">
            <button type="submit" class="btn btn-primary full">
              {{ form._id ? 'Save Candidate Updates' : 'Create Candidate' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Bulk Import Modal -->
    <div v-if="showBulkImportModal" class="modal-backdrop" @click.self="showBulkImportModal = false">
      <div class="modal-panel">
        <div class="section-head">
          <h3>Bulk Import Candidates (CSV/JSON)</h3>
          <button type="button" class="btn btn-ghost btn-icon btn-sm" title="Close" @click="showBulkImportModal = false">
            <AppIcon name="xMark" />
          </button>
        </div>

        <p style="font-size: 0.85rem; color: var(--text-muted);">
          Paste comma-separated rows with headers (Number, Name, Hometown, Advocacy, Age, Photo):
        </p>

        <textarea
          v-model="bulkCsvText"
          rows="8"
          placeholder="01, Maria Santos, Cebu City, Youth Education, 23
02, Sofia Reyes, Davao City, Mental Health, 22
03, Ana Cruz, Manila, Environment, 24"
        ></textarea>

        <div class="button-row" style="margin-top: 1rem;">
          <button type="button" class="btn btn-primary full" @click="processBulkImport">
            Import Candidates
          </button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import AppIcon from '../../components/AppIcon.vue';
import EmptyState from '../../components/EmptyState.vue';
import LoadingState from '../../components/LoadingState.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import AdminLayout from '../../layouts/AdminLayout.vue';
import { api, mediaUrl } from '../../services/api.js';

const contestants = ref([]);
const loading = ref(true);
const mode = ref('card');
const filterStatus = ref('ALL');
const searchQuery = ref('');
const showModal = ref(false);
const showBulkImportModal = ref(false);
const bulkCsvText = ref('');
const photoUpload = reactive({ uploading: false, error: '' });
const MAX_CANDIDATE_PHOTO_BYTES = 15 * 1024 * 1024;

const form = reactive({
  _id: '',
  contestantNumber: '',
  name: '',
  hometown: '',
  advocacy: '',
  age: '',
  height: '',
  bio: '',
  photo: '',
  status: 'ACTIVE'
});

async function load() {
  loading.value = true;
  const { data } = await api.get('/contestants');
  contestants.value = data.contestants || [];
  loading.value = false;
}

const filteredContestants = computed(() => {
  return contestants.value.filter((c) => {
    if (filterStatus.value !== 'ALL' && c.status !== filterStatus.value) return false;
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const mName = c.name?.toLowerCase().includes(q);
      const mNum = c.contestantNumber?.includes(q);
      const mHome = c.hometown?.toLowerCase().includes(q);
      return mName || mNum || mHome;
    }
    return true;
  });
});

function statusCount(status) {
  return contestants.value.filter((contestant) => contestant.status === status).length;
}

function openCreateModal() {
  Object.assign(form, {
    _id: '',
    contestantNumber: '',
    name: '',
    hometown: '',
    advocacy: '',
    age: '',
    height: '',
    bio: '',
    photo: '',
    status: 'ACTIVE'
  });
  Object.assign(photoUpload, { uploading: false, error: '' });
  showModal.value = true;
}

function edit(c) {
  Object.assign(form, { ...c, age: c.age ?? '' });
  Object.assign(photoUpload, { uploading: false, error: '' });
  showModal.value = true;
}

async function handlePhotoFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (file.size > MAX_CANDIDATE_PHOTO_BYTES) {
    photoUpload.error = 'Image file must be 15 MB or smaller.';
    event.target.value = '';
    return;
  }

  photoUpload.uploading = true;
  photoUpload.error = '';

  try {
    const payload = new FormData();
    payload.append('image', file);

    const { data } = await api.post('/uploads/contestant-photo', payload);
    form.photo = data.path || data.url;
  } catch (err) {
    photoUpload.error = err.response?.status === 413
      ? 'Upload rejected as too large. Photos must be 15 MB or smaller; if this file is under 15 MB, the server request-size limit also needs to be increased.'
      : err.response?.data?.message || 'Unable to upload image.';
  } finally {
    photoUpload.uploading = false;
    event.target.value = '';
  }
}

async function save() {
  try {
    const payload = { ...form, age: form.age === '' || form.age == null ? null : Number(form.age) };
    if (form._id) {
      await api.put(`/contestants/${form._id}`, payload);
    } else {
      await api.post('/contestants', payload);
    }
    showModal.value = false;
    await load();
  } catch (err) {
    alert(err.response?.data?.message || 'Error saving contestant.');
  }
}

async function remove(c) {
  if (!confirm(`Are you sure you want to delete candidate #${c.contestantNumber} ${c.name}?`)) return;
  await api.delete(`/contestants/${c._id}`);
  await load();
}

async function processBulkImport() {
  const lines = bulkCsvText.value.split('\n').map((l) => l.trim()).filter(Boolean);
  const parsed = [];
  for (const line of lines) {
    const parts = line.split(',').map((p) => p.trim());
    if (parts.length >= 2) {
      parsed.push({
        contestantNumber: parts[0],
        name: parts[1],
        hometown: parts[2] || '',
        advocacy: parts[3] || '',
        age: parts[4] ? Number(parts[4]) : undefined,
        photo: parts[5] || ''
      });
    }
  }

  if (!parsed.length) {
    alert('No valid candidate rows found.');
    return;
  }

  await api.post('/contestants/bulk-import', { contestants: parsed });
  showBulkImportModal.value = false;
  bulkCsvText.value = '';
  await load();
}

function exportContestantsCsv() {
  const headers = ['Number', 'Name', 'Hometown', 'Advocacy', 'Age', 'Height', 'Status'];
  const rows = contestants.value.map((c) => [
    `"${c.contestantNumber}"`,
    `"${c.name}"`,
    `"${c.hometown || ''}"`,
    `"${c.advocacy || ''}"`,
    `"${c.age || ''}"`,
    `"${c.height || ''}"`,
    `"${c.status}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `contestants-registry-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

onMounted(load);
</script>

<style scoped>
.contestants-hero-panel {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
  border: 1px solid var(--border-gold);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--surface) 0%, var(--surface-hover) 100%);
  box-shadow: var(--shadow-md);
}

.contestants-hero-copy h2 {
  margin-top: 0.25rem;
  font-size: clamp(1.35rem, 4vw, 1.9rem);
  font-weight: 900;
}

.contestants-hero-copy p {
  margin-top: 0.25rem;
  color: var(--text-muted);
  font-size: 0.88rem;
}

.contestant-stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 1rem;
}

.contestant-stats-row span {
  display: inline-flex;
  align-items: baseline;
  gap: 0.3rem;
  padding: 0.35rem 0.65rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 0.76rem;
  font-weight: 800;
}

.contestant-stats-row strong {
  color: var(--gold-dark);
  font-size: 0.9rem;
}

.contestants-hero-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.filter-search-bar {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: stretch;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filter-chips {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.1rem;
  scrollbar-width: none;
}

.filter-chips::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.85rem;
  border-radius: var(--radius-full);
  background: var(--surface);
  border: 1px solid var(--border);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 150ms ease;
  white-space: nowrap;
  flex: 0 0 auto;
}

.filter-chip:hover {
  background: var(--surface-hover);
}

.filter-chip.active {
  background: linear-gradient(135deg, var(--gold-dark), var(--gold));
  color: #fff;
  border-color: var(--gold-dark);
}

.filter-chip .app-icon {
  width: 0.95rem;
  height: 0.95rem;
}

.search-input-wrap {
  width: 100%;
  position: relative;
}

.search-input-wrap .app-icon {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  width: 1rem;
  height: 1rem;
  color: var(--text-muted);
  transform: translateY(-50%);
  pointer-events: none;
}

.search-input-wrap input {
  padding-left: 2.35rem;
}

.admin-contestants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.admin-contestants-grid .entity-card {
  display: flex;
  flex-direction: column;
  min-height: 250px;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(135deg, rgba(201, 154, 46, 0.08), transparent 42%),
    var(--surface);
  box-shadow: var(--shadow-md);
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.admin-contestants-grid .entity-card:hover {
  border-color: var(--border-gold);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.contestant-card-top {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
}

.admin-candidate-photo {
  width: 72px;
  height: 78px;
  flex: 0 0 72px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-gold);
  background: linear-gradient(135deg, var(--navy-dark) 0%, var(--navy) 100%);
  color: var(--gold-light);
  font-size: 1.05rem;
  font-weight: 900;
  box-shadow: var(--shadow-sm);
}

.admin-candidate-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.entity-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  padding-top: 0.1rem;
}

.c-number-badge {
  display: inline-flex;
  align-items: center;
  min-height: 1.35rem;
  padding: 0.12rem 0.4rem;
  border-radius: var(--radius-full);
  background: rgba(201, 154, 46, 0.12);
  border: 1px solid var(--border-gold);
  font-size: 0.68rem;
  font-weight: 800;
  color: var(--gold-dark);
}

.c-title {
  margin-top: 0.25rem;
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.12;
  overflow-wrap: anywhere;
}

.c-hometown {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.18rem;
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 700;
}

.c-hometown .app-icon {
  width: 0.9rem;
  height: 0.9rem;
}

.candidate-status-inline {
  margin-top: 0.55rem;
}

.candidate-status-inline.warning {
  background: var(--warning-soft);
  color: #b45309;
  border-color: rgba(245, 158, 11, 0.28);
}

[data-theme='dark'] .candidate-status-inline.warning {
  background: rgba(245, 158, 11, 0.14);
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.35);
}

.c-advocacy-snippet {
  min-height: 3.1rem;
  padding: 0.7rem 0.8rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: rgba(148, 163, 184, 0.06);
  font-size: 0.8rem;
  color: var(--text-muted);
  font-style: italic;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0.85rem 0;
}

.photo-upload-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--surface-hover);
  border: 1px dashed var(--border-gold);
  border-radius: var(--radius-md);
}

.photo-upload-preview strong {
  display: block;
  font-size: 0.82rem;
}

.photo-upload-preview p {
  max-width: 100%;
  margin-top: 0.15rem;
  font-size: 0.74rem;
  color: var(--text-muted);
  overflow-wrap: anywhere;
}

.photo-upload-preview .app-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--gold-light);
}

.entity-footer {
  display: block;
  border-top: 1px solid var(--border);
  padding-top: 0.75rem;
  margin-top: auto;
}

.entity-footer .button-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.55rem;
  width: 100%;
}

.entity-footer .btn {
  min-height: 38px;
  padding: 0.5rem 0.65rem;
  width: 100%;
}

[data-theme='dark'] .admin-contestants-grid .entity-card {
  background:
    linear-gradient(135deg, rgba(201, 154, 46, 0.1), transparent 42%),
    #0f1c2e;
}

[data-theme='dark'] .c-number-badge {
  color: var(--gold-light);
}

[data-theme='dark'] .c-advocacy-snippet {
  background: rgba(255, 255, 255, 0.035);
  color: #cbd5e1;
}

.form-row-2 {
  display: grid;
  gap: 1rem;
}

.advocacy-cell {
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.82rem;
}

@media (min-width: 600px) {
  .contestants-hero-panel {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    padding: 1.35rem 1.5rem;
  }

  .contestants-hero-actions {
    justify-content: flex-end;
  }

  .filter-search-bar {
    flex-direction: row;
    align-items: center;
  }

  .search-input-wrap {
    width: auto;
    min-width: 260px;
  }

  .form-row-2 {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1500px) {
  .admin-contestants-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}
</style>
