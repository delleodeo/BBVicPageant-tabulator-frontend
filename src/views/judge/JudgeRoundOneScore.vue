<template>
  <JudgeLayout :title="contestant ? `Candidate #${contestant.contestantNumber}` : 'Score Contestant'">
    <!-- Top Action Bar -->
    <div class="judge-scoring-topbar">
      <RouterLink class="btn btn-ghost btn-sm" to="/judge/round-one">
        <AppIcon name="arrowLeft" />
        Back
      </RouterLink>

      <div class="top-nav-steppers">
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          :disabled="!prevContestant"
          @click="navigateContestant(prevContestant)"
        >
          <AppIcon name="arrowLeft" />
          #{{ prevContestant?.contestantNumber || '-' }}
        </button>

        <button
          type="button"
          class="btn btn-ghost btn-sm"
          @click="showBioModal = true"
        >
          <AppIcon name="user" />
          Bio
        </button>

        <button
          type="button"
          class="btn btn-ghost btn-sm"
          :disabled="!nextContestant"
          @click="navigateContestant(nextContestant)"
        >
          #{{ nextContestant?.contestantNumber || '-' }}
          <AppIcon name="arrowRight" />
        </button>
      </div>
    </div>

    <LoadingState v-if="loading" label="contestant" />

    <template v-else>
      <!-- Candidate Summary & Live Calculated Rating Header -->
      <section class="panel panel-gold candidate-scoring-header">
        <div class="candidate-header-left">
          <div class="header-photo-wrap" @click="showBioModal = true">
            <img v-if="contestant.photo" :src="mediaUrl(contestant.photo)" :alt="contestant.name" />
            <div v-else class="header-photo-fallback">
              {{ contestant.name.slice(0, 2).toUpperCase() }}
            </div>
          </div>

          <div class="candidate-copy">
            <div class="eyebrow"><AppIcon name="roundOne" /> Round 1 Candidate #{{ contestant.contestantNumber }}</div>
            <h2>{{ contestant.name }}</h2>
            <p v-if="contestant.hometown" class="c-hometown">
              <AppIcon name="mapPin" />
              {{ contestant.hometown }}
            </p>
            <p v-if="contestant.advocacy" class="c-advocacy">"{{ contestant.advocacy }}"</p>
          </div>
        </div>

        <div class="total-score-card">
          <span class="total-label">Weighted Total</span>
          <div class="total-number-display">
            <span class="score-bold">{{ totalCalculatedScore }}</span>
            <span class="score-max">/ 100</span>
          </div>
          <div class="completion-pill" :class="{ complete: isAllCategoriesScored }">
            <AppIcon v-if="isAllCategoriesScored" name="check" />
            {{ isAllCategoriesScored ? 'All categories scored' : `${completedCategoryCount} / 5 scored` }}
          </div>
        </div>
      </section>

      <section class="score-progress-strip" aria-label="Category scoring progress">
        <div
          v-for="category in categories"
          :key="category.key"
          class="score-progress-chip"
          :class="{ complete: categoryScored(category.key) }"
        >
          <AppIcon :name="categoryScored(category.key) ? 'check' : 'scoreSheet'" />
          <span>{{ category.label }}</span>
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

      <!-- Judge Private Notes Section -->
      <section class="panel judge-notes-panel">
        <div class="section-head">
          <div>
            <h3>Judge's Confidential Notes</h3>
            <p class="section-subhead">Your private notes for candidate #{{ contestant.contestantNumber }}. Visible only to you.</p>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" :disabled="savingNote" @click="saveNote">
            <AppIcon :name="noteSaved ? 'check' : 'document'" />
            {{ savingNote ? 'Saving...' : noteSaved ? 'Saved' : 'Save Notes' }}
          </button>
        </div>
        <textarea
          v-model="judgeNote"
          rows="3"
          placeholder="Record candidate strengths, posture, eloquence, or personal remarks..."
          @blur="saveNote"
        ></textarea>
      </section>

      <!-- Navigation Footer -->
      <section class="panel scoring-footer-nav">
        <div class="button-row">
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="!prevContestant"
            @click="navigateContestant(prevContestant)"
          >
            <AppIcon name="arrowLeft" />
            Previous Candidate
          </button>

          <RouterLink class="btn btn-ghost" to="/judge/round-one">
            View All Candidates
          </RouterLink>

          <button
            type="button"
            class="btn btn-gold"
            :disabled="!nextContestant"
            @click="navigateContestant(nextContestant)"
          >
            Next Candidate
            <AppIcon name="arrowRight" />
          </button>
        </div>
      </section>

      <Toast :message="message" />
      <p v-if="error" class="error-text">{{ error }}</p>

      <!-- Candidate Bio Modal -->
      <ContestantBioModal
        :open="showBioModal"
        :contestant="contestant"
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
import AppIcon from '../../components/AppIcon.vue';
import LoadingState from '../../components/LoadingState.vue';
import Toast from '../../components/Toast.vue';
import JudgeLayout from '../../layouts/JudgeLayout.vue';
import { api, mediaUrl } from '../../services/api.js';
import { connectSocket } from '../../services/socket.js';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const contestant = ref(null);
const allContestants = ref([]);
const round = ref(null);
const score = ref(null);
const categories = ref([]);
const judgeNote = ref('');
const savingNote = ref(false);
const noteSaved = ref(false);
const message = ref('');
const error = ref('');
const showBioModal = ref(false);

const completedCategoryCount = computed(() => {
  if (!score.value || !categories.value.length) return 0;
  return categories.value.filter(
    (c) => score.value[c.key] !== undefined && score.value[c.key] !== null
  ).length;
});

const isAllCategoriesScored = computed(() => completedCategoryCount.value === categories.value.length);

function categoryScored(categoryKey) {
  return score.value?.[categoryKey] !== undefined && score.value?.[categoryKey] !== null;
}

const totalCalculatedScore = computed(() => {
  if (!score.value || !categories.value.length) return '0.00';
  let total = 0;
  for (const cat of categories.value) {
    const val = score.value[cat.key];
    if (val !== undefined && val !== null && Number.isFinite(Number(val))) {
      total += Number(val) * (cat.weight / 10);
    }
  }
  return total.toFixed(2);
});

const currentContestantIndex = computed(() => {
  return allContestants.value.findIndex(
    (c) => String(c._id) === String(route.params.contestantId)
  );
});

const prevContestant = computed(() => {
  const idx = currentContestantIndex.value;
  return idx > 0 ? allContestants.value[idx - 1] : null;
});

const nextContestant = computed(() => {
  const idx = currentContestantIndex.value;
  return idx >= 0 && idx < allContestants.value.length - 1 ? allContestants.value[idx + 1] : null;
});

async function load() {
  loading.value = true;
  const [candidateRes, allRes, noteRes] = await Promise.all([
    api.get(`/judge/round-one/${route.params.contestantId}`),
    api.get('/judge/round-one'),
    api.get(`/judge/notes/ROUND_1/${route.params.contestantId}`).catch(() => ({ data: { note: '' } }))
  ]);

  contestant.value = candidateRes.data.contestant;
  round.value = candidateRes.data.round;
  score.value = candidateRes.data.score;
  categories.value = candidateRes.data.categories;
  allContestants.value = allRes.data.contestants || [];
  judgeNote.value = noteRes.data?.note || '';
  loading.value = false;

  // Emit live activity
  const socket = connectSocket();
  socket.emit('judge:activity', {
    contestantId: contestant.value?._id,
    contestantNumber: contestant.value?.contestantNumber,
    round: 'ROUND_1'
  });
}

function navigateContestant(target) {
  if (target?._id) {
    router.push(`/judge/round-one/${target._id}`);
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
  const payload = { contestantId: contestant.value._id, [categoryKey]: value };
  const response = score.value?._id
    ? await api.put(`/judge/round-one/scores/${score.value._id}`, payload)
    : await api.post('/judge/round-one/scores', payload);
  score.value = response.data.score;
  message.value = `${categoryKey} score saved.`;
  setTimeout(() => (message.value = ''), 2000);
}

async function saveNote() {
  if (!contestant.value?._id) return;
  savingNote.value = true;
  try {
    await api.post('/judge/notes', {
      contestantId: contestant.value._id,
      round: 'ROUND_1',
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
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: stretch;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.top-nav-steppers {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

.candidate-scoring-header {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 1rem;
  border-radius: var(--radius-md);
}

.candidate-header-left {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: flex-start;
  gap: 0.85rem;
}

.header-photo-wrap {
  width: 58px;
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

.candidate-copy {
  min-width: 0;
}

.candidate-copy .eyebrow {
  gap: 0.35rem;
  color: var(--gold-dark);
  font-size: clamp(0.62rem, 3vw, 0.72rem);
  line-height: 1.25;
  letter-spacing: 0.04em;
}

.candidate-copy .eyebrow .app-icon {
  width: 1.05rem;
  height: 1.05rem;
}

.candidate-copy h2 {
  margin-top: 0.35rem;
  font-size: clamp(1.25rem, 6.4vw, 1.75rem);
  line-height: 1.08;
  letter-spacing: 0;
  word-break: break-word;
}

.c-hometown {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.25rem;
  font-size: clamp(0.78rem, 3.6vw, 0.86rem);
  line-height: 1.25;
  color: var(--gold-dark);
  font-weight: 700;
}

.c-hometown .app-icon {
  width: 1rem;
  height: 1rem;
}

.c-advocacy {
  display: -webkit-box;
  margin-top: 0.45rem;
  max-width: 34ch;
  font-size: clamp(0.76rem, 3.4vw, 0.84rem);
  line-height: 1.35;
  color: var(--text-muted);
  font-style: italic;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.total-score-card {
  background: var(--surface);
  border: 1px solid var(--border-gold);
  border-radius: var(--radius-md);
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  align-items: center;
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
  font-size: clamp(1.65rem, 9vw, 2.25rem);
  font-weight: 900;
  color: var(--gold-dark);
}

.score-max {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted);
}

.completion-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  max-width: 100%;
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--text-muted);
  background: var(--surface-hover);
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-full);
}

.completion-pill .app-icon {
  width: 0.95rem;
  height: 0.95rem;
}

.completion-pill.complete {
  background: var(--success-soft);
  color: var(--success);
}

.score-progress-strip {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.score-progress-chip {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 40px;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 0.76rem;
  font-weight: 800;
}

.score-progress-chip .app-icon {
  width: 1rem;
  height: 1rem;
  flex: 0 0 1rem;
}

.score-progress-chip.complete {
  border-color: rgba(16, 185, 129, 0.25);
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
  display: grid;
  grid-template-columns: 1fr;
  justify-content: stretch;
}

@media (min-width: 720px) {
  .judge-scoring-topbar {
    grid-template-columns: auto auto;
    justify-content: space-between;
  }

  .top-nav-steppers {
    align-items: center;
  }

  .candidate-scoring-header {
    grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
    align-items: center;
    padding: 1.35rem;
  }

  .score-progress-strip {
    grid-template-columns: repeat(5, 1fr);
  }

  .scoring-footer-nav .button-row {
    display: flex;
    justify-content: space-between;
  }
}
</style>
