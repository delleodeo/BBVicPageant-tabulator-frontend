<template>
  <AdminLayout title="Contestants Management">
    <!-- Header Control Bar -->
    <section class="panel panel-gold">
      <div class="section-head">
        <div>
          <span class="eyebrow">👥 Candidate Registry</span>
          <h2>Official Contestants ({{ contestants.length }})</h2>
          <p class="section-subhead">Manage candidate profiles, photos, hometowns, and advocacies</p>
        </div>

        <div class="button-row">
          <button type="button" class="btn btn-gold" @click="openCreateModal">
            + Add New Candidate
          </button>
          <button type="button" class="btn btn-ghost" @click="showBulkImportModal = true">
            📥 Bulk Import CSV
          </button>
          <button type="button" class="btn btn-ghost" @click="exportContestantsCsv">
            📤 Export CSV
          </button>
          <button type="button" class="btn btn-ghost btn-icon" :title="mode === 'card' ? 'Switch to Table' : 'Switch to Cards'" @click="mode = mode === 'card' ? 'table' : 'card'">
            {{ mode === 'card' ? '📋' : '🪪' }}
          </button>
        </div>
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
          👑 Finalists
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
        <input v-model="searchQuery" placeholder="Search by name, # or hometown..." />
      </div>
    </div>

    <LoadingState v-if="loading" label="contestants" />

    <!-- Card View -->
    <section v-else-if="mode === 'card' && filteredContestants.length > 0" class="card-grid">
      <article v-for="c in filteredContestants" :key="c._id" class="entity-card">
        <div class="contestant-card-top">
          <div class="photo-frame small">
            <img v-if="c.photo" :src="c.photo" :alt="c.name" />
            <span v-else>{{ c.name.slice(0, 2).toUpperCase() }}</span>
          </div>

          <div class="entity-info">
            <span class="c-number-badge">#{{ c.contestantNumber }}</span>
            <h3 class="c-title">{{ c.name }}</h3>
            <p v-if="c.hometown" class="c-hometown">📍 {{ c.hometown }}</p>
          </div>
        </div>

        <p v-if="c.advocacy" class="c-advocacy-snippet">"{{ c.advocacy }}"</p>

        <div class="entity-footer">
          <StatusBadge :label="c.status" :tone="c.status === 'FINALIST' ? 'success' : 'neutral'" />
          <div class="button-row">
            <button type="button" class="btn btn-ghost btn-sm" @click="edit(c)">Edit</button>
            <button type="button" class="btn btn-danger btn-sm" @click="remove(c)">Delete</button>
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
                <img v-if="c.photo" :src="c.photo" :alt="c.name" />
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
          <button type="button" class="btn btn-ghost btn-sm" @click="showModal = false">✕</button>
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
              Age
              <input v-model="form.age" type="number" min="0" max="120" placeholder="e.g. 23" />
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
          <button type="button" class="btn btn-ghost btn-sm" @click="showBulkImportModal = false">✕</button>
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
import EmptyState from '../../components/EmptyState.vue';
import LoadingState from '../../components/LoadingState.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import AdminLayout from '../../layouts/AdminLayout.vue';
import { api } from '../../services/api.js';

const contestants = ref([]);
const loading = ref(true);
const mode = ref('card');
const filterStatus = ref('ALL');
const searchQuery = ref('');
const showModal = ref(false);
const showBulkImportModal = ref(false);
const bulkCsvText = ref('');

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
  showModal.value = true;
}

function edit(c) {
  Object.assign(form, c);
  showModal.value = true;
}

async function save() {
  try {
    if (form._id) {
      await api.put(`/contestants/${form._id}`, form);
    } else {
      await api.post('/contestants', form);
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
.filter-search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filter-chips {
  display: flex;
  gap: 0.5rem;
}

.filter-chip {
  padding: 0.45rem 0.85rem;
  border-radius: var(--radius-full);
  background: var(--surface);
  border: 1px solid var(--border);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 150ms ease;
}

.filter-chip:hover {
  background: var(--surface-hover);
}

.filter-chip.active {
  background: linear-gradient(135deg, var(--gold-dark), var(--gold));
  color: #fff;
  border-color: var(--gold-dark);
}

.search-input-wrap {
  min-width: 260px;
}

.contestant-card-top {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.entity-info {
  display: flex;
  flex-direction: column;
}

.c-number-badge {
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--gold-dark);
}

.c-title {
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1.2;
}

.c-hometown {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 600;
}

.c-advocacy-snippet {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-style: italic;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0.25rem 0;
}

.entity-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border);
  padding-top: 0.75rem;
  margin-top: auto;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.advocacy-cell {
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.82rem;
}

@media (max-width: 600px) {
  .form-row-2 {
    grid-template-columns: 1fr;
  }
}
</style>
