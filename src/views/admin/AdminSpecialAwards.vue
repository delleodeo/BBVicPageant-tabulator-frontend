<template>
  <AdminLayout title="Special & Minor Awards">
    <!-- Header Summary -->
    <section class="panel panel-gold">
      <div class="section-head">
        <div>
          <span class="eyebrow"><AppIcon name="awards" /> Tabulation Module</span>
          <h2>Special & Minor Awards Tabulator</h2>
          <p class="section-subhead">Category excellence titles calculated automatically from Round 1 scores, plus custom sponsor awards</p>
        </div>

        <div class="button-row">
          <button type="button" class="btn btn-primary" @click="openCreateModal">
            <AppIcon name="plus" />
            New Custom Special Award
          </button>
          <button type="button" class="btn btn-ghost" @click="printAllAwards">
            <AppIcon name="printer" />
            Print Awards Summary
          </button>
        </div>
      </div>
    </section>

    <LoadingState v-if="loading" label="special awards" />

    <template v-else>
      <!-- Section 1: Automatic Category Awards -->
      <section class="panel">
        <div class="section-head">
          <div>
            <h3>Official Category Awards (Top Scorers)</h3>
            <p class="section-subhead">Computed from judge score averages in Round 1</p>
          </div>
        </div>

        <div class="awards-grid">
          <div v-for="award in data.categoryAwards || []" :key="award.key" class="award-card">
            <div class="award-card-header">
              <span class="award-trophy"><AppIcon name="awards" /></span>
              <div>
                <h4 class="award-title">{{ award.title }}</h4>
                <span class="award-category-tag">{{ award.categoryLabel }} (Weight: {{ award.weight }}%)</span>
              </div>
            </div>

            <div v-if="award.winner" class="award-winner-block">
              <div class="award-winner-avatar">
                <img v-if="award.winner.photo" :src="mediaUrl(award.winner.photo)" :alt="award.winner.name" />
                <span v-else>{{ award.winner.name.slice(0, 2).toUpperCase() }}</span>
              </div>

              <div class="award-winner-info">
                <span class="winner-label"><AppIcon name="finalists" /> Award Winner</span>
                <strong class="winner-name">#{{ award.winner.contestantNumber }} {{ award.winner.name }}</strong>
                <span v-if="award.winner.hometown" class="winner-hometown"><AppIcon name="mapPin" /> {{ award.winner.hometown }}</span>
                <span class="winner-score-badge">Average: {{ award.topScore }} / 10.0 ({{ award.topScore100 }}%)</span>
              </div>
            </div>

            <div v-else class="award-unscored">
              <span>Awaiting round scoring</span>
            </div>

            <!-- Top 3 Ranking Sub-table -->
            <div v-if="award.rankings?.length" class="award-ranking-peek">
              <div class="peek-header">Top 3 Candidates:</div>
              <div v-for="r in award.rankings.slice(0, 3)" :key="r.contestant?._id" class="peek-row">
                <span>Rank {{ r.rank }}: #{{ r.contestant?.contestantNumber }} {{ r.contestant?.name }}</span>
                <strong>{{ r.average ?? '-' }}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 2: Custom Sponsor & Special Awards -->
      <section class="panel">
        <div class="section-head">
          <div>
            <h3>Custom & Sponsor Special Awards</h3>
            <p class="section-subhead">Miss Photogenic, Miss Congeniality, Darling of the Press, etc.</p>
          </div>
        </div>

        <div v-if="data.customAwards?.length === 0" class="empty-state-box">
          <p>No custom special awards added yet. Click "+ New Custom Special Award" to create one.</p>
        </div>

        <div v-else class="awards-grid">
          <div v-for="award in data.customAwards || []" :key="award._id" class="award-card custom-card">
            <div class="award-card-header">
              <span class="award-trophy"><AppIcon name="sparkles" /></span>
              <div>
                <h4 class="award-title">{{ award.title }}</h4>
                <span v-if="award.sponsor" class="award-sponsor-tag">Presented by: {{ award.sponsor }}</span>
              </div>
            </div>

            <p v-if="award.description" class="award-desc">{{ award.description }}</p>

            <div v-if="award.winnerDetails || award.winnerContestantId" class="award-winner-block">
              <div class="award-winner-avatar">
                <img v-if="award.winnerContestantId?.photo" :src="mediaUrl(award.winnerContestantId.photo)" :alt="award.winnerContestantId.name" />
                <span v-else>{{ (award.winnerDetails?.name || award.winnerContestantId?.name || 'W').slice(0, 2).toUpperCase() }}</span>
              </div>

              <div class="award-winner-info">
                <span class="winner-label"><AppIcon name="finalists" /> Declared Winner</span>
                <strong class="winner-name">
                  #{{ award.winnerDetails?.contestantNumber || award.winnerContestantId?.contestantNumber }}
                  {{ award.winnerDetails?.name || award.winnerContestantId?.name }}
                </strong>
                <span v-if="award.winnerContestantId?.hometown" class="winner-hometown"><AppIcon name="mapPin" /> {{ award.winnerContestantId.hometown }}</span>
              </div>
            </div>

            <div v-else class="award-unscored">
              <span>Winner Not Yet Assigned</span>
            </div>

            <div class="award-card-actions">
              <button type="button" class="btn btn-ghost btn-sm" @click="editCustomAward(award)">
                Edit / Assign
              </button>
              <button type="button" class="btn btn-danger btn-sm" @click="deleteCustomAward(award)">
                Delete
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Custom Award Edit / Create Modal -->
      <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
        <div class="modal-panel">
          <div class="section-head">
            <h3>{{ editingAwardId ? 'Edit Special Award' : 'Create Special Award' }}</h3>
            <button type="button" class="btn btn-ghost btn-icon btn-sm" title="Close" @click="showModal = false">
              <AppIcon name="xMark" />
            </button>
          </div>

          <form class="stack-form" @submit.prevent="saveCustomAward">
            <label>
              Award Title *
              <input v-model="form.title" placeholder="e.g. Miss Photogenic, Miss Congeniality" required />
            </label>

            <label>
              Award Description
              <input v-model="form.description" placeholder="Criteria or description of the award" />
            </label>

            <label>
              Sponsor / Presenter
              <input v-model="form.sponsor" placeholder="e.g. Luxe Studio, Grand Hotel, Press Club" />
            </label>

            <label>
              Assign Winner Candidate
              <select v-model="form.winnerContestantId">
                <option value="">-- Select Winner --</option>
                <option v-for="c in contestants" :key="c._id" :value="c._id">
                  #{{ c.contestantNumber }} {{ c.name }} ({{ c.hometown || 'Candidate' }})
                </option>
              </select>
            </label>

            <div class="button-row" style="margin-top: 1rem;">
              <button type="submit" class="btn btn-primary full">
                {{ editingAwardId ? 'Save Changes' : 'Create Special Award' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </template>
  </AdminLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import AppIcon from '../../components/AppIcon.vue';
import LoadingState from '../../components/LoadingState.vue';
import AdminLayout from '../../layouts/AdminLayout.vue';
import { api, mediaUrl } from '../../services/api.js';
import { connectSocket } from '../../services/socket.js';

const loading = ref(true);
const data = ref({ categoryAwards: [], customAwards: [] });
const contestants = ref([]);
const showModal = ref(false);
const editingAwardId = ref(null);

const form = reactive({
  title: '',
  description: '',
  sponsor: '',
  winnerContestantId: ''
});

async function load() {
  const [awardsRes, contestantsRes] = await Promise.all([
    api.get('/special-awards'),
    api.get('/contestants')
  ]);
  data.value = awardsRes.data;
  contestants.value = contestantsRes.data.contestants || [];
  loading.value = false;
}

function openCreateModal() {
  editingAwardId.value = null;
  Object.assign(form, { title: '', description: '', sponsor: '', winnerContestantId: '' });
  showModal.value = true;
}

function editCustomAward(award) {
  editingAwardId.value = award._id;
  Object.assign(form, {
    title: award.title,
    description: award.description || '',
    sponsor: award.sponsor || '',
    winnerContestantId: award.winnerContestantId?._id || award.winnerContestantId || ''
  });
  showModal.value = true;
}

async function saveCustomAward() {
  if (editingAwardId.value) {
    await api.put(`/admin/special-awards/${editingAwardId.value}`, form);
  } else {
    await api.post('/admin/special-awards', form);
  }
  showModal.value = false;
  await load();
}

async function deleteCustomAward(award) {
  if (!confirm(`Delete special award "${award.title}"?`)) return;
  await api.delete(`/admin/special-awards/${award._id}`);
  await load();
}

function printAllAwards() {
  window.print();
}

onMounted(() => {
  load();
  const socket = connectSocket();
  socket.on('special_awards:updated', load);
  socket.on('results:updated', load);
});
</script>

<style scoped>
.awards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

.award-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  transition: all 180ms ease;
}

.award-card:hover {
  border-color: var(--gold);
  transform: translateY(-2px);
}

.award-card-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.award-trophy {
  color: var(--gold-dark);
}

.award-trophy .app-icon {
  width: 1.8rem;
  height: 1.8rem;
}

.award-title {
  font-size: 1.15rem;
  font-weight: 800;
  line-height: 1.2;
}

.award-category-tag {
  font-size: 0.75rem;
  color: var(--gold-dark);
  font-weight: 700;
  text-transform: uppercase;
}

.award-sponsor-tag {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 700;
}

.award-desc {
  font-size: 0.84rem;
  color: var(--text-muted);
  font-style: italic;
}

.award-winner-block {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(135deg, var(--gold-soft), var(--surface-hover));
  border: 1px solid var(--border-gold);
  border-radius: var(--radius-md);
  padding: 0.85rem 1rem;
}

.award-winner-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--navy);
  color: var(--gold-light);
  font-size: 1.1rem;
  font-weight: 900;
  display: grid;
  place-items: center;
  border: 2px solid var(--gold);
}

.award-winner-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.award-winner-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.winner-label {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--gold-dark);
  text-transform: uppercase;
}

.winner-label .app-icon,
.winner-hometown .app-icon {
  width: 0.9rem;
  height: 0.9rem;
}

.winner-name {
  font-size: 1rem;
  font-weight: 900;
}

.winner-hometown {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 700;
}

.winner-score-badge {
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--navy);
}

.award-unscored {
  padding: 1.25rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.85rem;
  background: var(--surface-hover);
  border-radius: var(--radius-md);
  border: 1px dashed var(--border);
}

.award-ranking-peek {
  background: var(--surface-hover);
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-md);
  font-size: 0.78rem;
}

.peek-header {
  font-weight: 800;
  color: var(--text-muted);
  margin-bottom: 0.3rem;
}

.peek-row {
  display: flex;
  justify-content: space-between;
  padding: 0.2rem 0;
  border-bottom: 1px solid var(--border);
}

.peek-row:last-child {
  border-bottom: none;
}

.award-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: auto;
}

.empty-state-box {
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
}

@media (min-width: 760px) {
  .awards-grid {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  }
}
</style>
