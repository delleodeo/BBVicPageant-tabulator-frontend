<template>
  <JudgeLayout :title="finalist ? `#${finalist.contestantId.contestantNumber} ${finalist.contestantId.name}` : 'Final Score'">
    <!-- Top Action Bar -->
    <div class="judge-scoring-topbar">
      <RouterLink class="btn btn-ghost btn-sm" to="/judge/final">
        ← Back to Finalists
      </RouterLink>

      <div class="top-nav-steppers">
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          :disabled="!prevFinalist"
          @click="navigateFinalist(prevFinalist)"
        >
          ← Prev (#{{ prevFinalist?.contestantId?.contestantNumber || '-' }})
        </button>

        <button
          type="button"
          class="btn btn-ghost btn-sm"
          @click="showBioModal = true"
        >
          👑 View Bio & Advocacy
        </button>

        <button
          type="button"
          class="btn btn-ghost btn-sm"
          :disabled="!nextFinalist"
          @click="navigateFinalist(nextFinalist)"
        >
          Next (#{{ nextFinalist?.contestantId?.contestantNumber || '-' }}) →
        </button>
      </div>
    </div>

    <LoadingState v-if="loading" label="finalist" />

    <template v-else>
      <!-- Finalist Header Banner -->
      <section class="panel panel-gold candidate-scoring-header">
        <div class="candidate-header-left">
          <div class="header-photo-wrap" @click="showBioModal = true">
            <img v-if="finalist.contestantId.photo" :src="finalist.contestantId.photo" :alt="finalist.contestantId.name" />
            <div v-else class="header-photo-fallback">
              {{ finalist.contestantId.name.slice(0, 2).toUpperCase() }}
            </div>
          </div>

          <div>
            <div class="eyebrow">👑 Finalist • Candidate #{{ finalist.contestantId.contestantNumber }}</div>
            <h2>{{ finalist.contestantId.name }}</h2>
            <p v-if="finalist.contestantId.hometown" class="c-hometown">📍 {{ finalist.contestantId.hometown }}</p>
            <div class="r1-carryover-badge">
              <span>Round 1 Carry-over (20%):</span>
              <strong>{{ fmt(roundOne?.total) }} pts</strong>
              <small>({{ ((roundOne?.total || 0) * 0.2).toFixed(2) }} weighted)</small>
            </div>
          </div>
        </div>

        <div class="candidate-header-right">
          <div class="total-score-card">
            <span class="total-label">Final Projected Score</span>
            <div class="total-number-display">
              <span class="score-bold">{{ totalCalculatedFinalScore }}</span>
              <span class="score-max">/ 100</span>
            </div>
            <div class="completion-pill" :class="{ complete: isAllScored }">
              {{ isAllScored ? '✓ Intelligence & Beauty Scored' : 'Pending Final Ratings' }}
            </div>
          </div>
        </div>
      </section>

      <!-- Category Scoring Cards Grid -->
      <section class="score-grid">
        <CategoryScoreCard
          v-for="category in categories"
          :key="category.key"
          :category="category"
          :current-value="score?.[category.key]"
          :disabled="round?.status !== 'OPEN'"
          @save="save"
          @invalid="showError"
        />
      </section>

      <!-- Judge Notes for Final Round -->
      <section class="panel judge-notes-panel">
        <div class="section-head">
          <div>
            <h3>Judge's Final Q&A & Stage Notes</h3>
            <p class="section-subhead">Record speech clarity, articulation, composure, and charisma.</p>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" :disabled="savingNote" @click="saveNote">
            {{ savingNote ? 'Saving...' : noteSaved ? '✓ Saved' : 'Save Notes' }}
          </button>
        </div>
        <textarea
          v-model="judgeNote"
          rows="3"
          placeholder="Private notes for final question and stage presence..."
          @blur="saveNote"
        ></textarea>
      </section>

      <!-- Navigation Footer -->
      <section class="panel scoring-footer-nav">
        <div class="button-row">
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="!prevFinalist"
            @click="navigateFinalist(prevFinalist)"
          >
            ← Previous Finalist
          </button>

          <RouterLink class="btn btn-ghost" to="/judge/final">
            View All Finalists
          </RouterLink>

          <button
            type="button"
            class="btn btn-gold"
            :disabled="!nextFinalist"
            @click="navigateFinalist(nextFinalist)"
          >
            Next Finalist →
          </button>
        </div>
      </section>

      <Toast :message="message" />
      <p v-if="error" class="error-text">{{ error }}</p>

      <!-- Bio Modal -->
      <ContestantBioModal
        :open="showBioModal"
        :contestant="finalist.contestantId"
        @close="showBioModal = false"
      />
    </template>
  </JudgeLayout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CategoryScoreCard from '../../components/CategoryScoreCard.vue';
import ContestantBioModal from '../../components/ContestantBioModal.vue';
import LoadingState from '../../components/LoadingState.vue';
import Toast from '../../components/Toast.vue';
import JudgeLayout from '../../layouts/JudgeLayout.vue';
import { api } from '../../services/api.js';
import { connectSocket } from '../../services/socket.js';
import { fmt } from '../../utils/score.js';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const finalist = ref(null);
const allFinalists = ref([]);
const roundOne = ref(null);
const round = ref(null);
const score = ref(null);
const categories = ref([]);
const judgeNote = ref('');
const savingNote = ref(false);
const noteSaved = ref(false);
const message = ref('');
const error = ref('');
const showBioModal = ref(false);

const isAllScored = computed(() => {
  return score.value?.intelligence != null && score.value?.beauty != null;
});

const totalCalculatedFinalScore = computed(() => {
  const r1 = Number(roundOne.value?.total || 0);
  const intel = Number(score.value?.intelligence);
  const bty = Number(score.value?.beauty);

  if (!Number.isFinite(intel) || !Number.isFinite(bty)) {
    return '0.00';
  }

  // Formula: Round 1 (20%) + Intelligence (40%) + Beauty (40%)
  const total = r1 * 0.2 + intel * 10 * 0.4 + bty * 10 * 0.4;
  return total.toFixed(2);
});

const currentFinalistIndex = computed(() => {
  return allFinalists.value.findIndex(
    (f) => String(f.contestantId?._id) === String(route.params.contestantId)
  );
});

const prevFinalist = computed(() => {
  const idx = currentFinalistIndex.value;
  return idx > 0 ? allFinalists.value[idx - 1] : null;
});

const nextFinalist = computed(() => {
  const idx = currentFinalistIndex.value;
  return idx >= 0 && idx < allFinalists.value.length - 1 ? allFinalists.value[idx + 1] : null;
});

async function load() {
  loading.value = true;
  const [res, allRes, noteRes] = await Promise.all([
    api.get(`/judge/final/${route.params.contestantId}`),
    api.get('/judge/final'),
    api.get(`/judge/notes/FINAL/${route.params.contestantId}`).catch(() => ({ data: { note: '' } }))
  ]);

  finalist.value = res.data.finalist;
  roundOne.value = res.data.roundOne;
  round.value = res.data.round;
  score.value = res.data.score;
  categories.value = res.data.categories;
  allFinalists.value = allRes.data.finalists || [];
  judgeNote.value = noteRes.data?.note || '';
  loading.value = false;

  const socket = connectSocket();
  socket.emit('judge:activity', {
    contestantId: finalist.value?.contestantId?._id,
    contestantNumber: finalist.value?.contestantId?.contestantNumber,
    round: 'FINAL'
  });
}

function navigateFinalist(target) {
  if (target?.contestantId?._id) {
    router.push(`/judge/final/${target.contestantId._id}`);
  }
}

watch(
  () => route.params.contestantId,
  () => {
    load();
  }
);

function showError(value) {
  error.value = value;
}

async function save(categoryKey, value) {
  error.value = '';
  const payload = { contestantId: finalist.value.contestantId._id, [categoryKey]: value };
  const response = score.value?._id
    ? await api.put(`/judge/final/scores/${score.value._id}`, payload)
    : await api.post('/judge/final/scores', payload);
  score.value = response.data.score;
  message.value = `${categoryKey} score saved successfully.`;
  setTimeout(() => (message.value = ''), 2000);
}

async function saveNote() {
  if (!finalist.value?.contestantId?._id) return;
  savingNote.value = true;
  try {
    await api.post('/judge/notes', {
      contestantId: finalist.value.contestantId._id,
      round: 'FINAL',
      note: judgeNote.value
    });
    noteSaved.value = true;
    setTimeout(() => (noteSaved.value = false), 2500);
  } finally {
    savingNote.value = false;
  }
}

onMounted(() => {
  load();
});

onBeforeUnmount(() => {
  const socket = connectSocket();
  socket.emit('judge:activity', {
    contestantId: null,
    round: null
  });
});
</script>

<style scoped>
.judge-scoring-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.top-nav-steppers {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.candidate-scoring-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.candidate-header-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.header-photo-wrap {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 2px solid var(--gold);
  background: var(--navy-dark);
  cursor: pointer;
  box-shadow: var(--shadow-md);
}

.header-photo-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.header-photo-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--gold-light);
  font-weight: 900;
  font-size: 1.4rem;
}

.c-hometown {
  font-size: 0.85rem;
  color: var(--gold-dark);
  font-weight: 700;
}

.r1-carryover-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-full);
  margin-top: 0.3rem;
}

.r1-carryover-badge strong {
  color: var(--gold-dark);
}

.total-score-card {
  background: var(--surface);
  border: 1px solid var(--border-gold);
  border-radius: var(--radius-md);
  padding: 0.85rem 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
  box-shadow: var(--shadow-sm);
}

.total-label {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--text-muted);
}

.total-number-display {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
}

.score-bold {
  font-size: 2rem;
  font-weight: 900;
  color: var(--gold-dark);
}

.score-max {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted);
}

.completion-pill {
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--text-muted);
  background: var(--surface-hover);
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-full);
}

.completion-pill.complete {
  background: var(--success-soft);
  color: var(--success);
}

.judge-notes-panel textarea {
  resize: vertical;
  min-height: 80px;
}

.scoring-footer-nav {
  margin-top: 1rem;
}

.scoring-footer-nav .button-row {
  justify-content: space-between;
}
</style>
