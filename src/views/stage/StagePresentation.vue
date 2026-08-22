<template>
  <div class="stage-screen">
    <!-- Floating Stage Control Toolbar -->
    <div class="stage-control-bar no-print" :class="{ 'bar-minimized': hideToolbar }">
      <div class="stage-mode-tabs">
        <button
          v-for="m in modes"
          :key="m.key"
          type="button"
          class="stage-tab-btn"
          :class="{ active: currentMode === m.key }"
          @click="currentMode = m.key"
        >
          <span>{{ m.icon }}</span> {{ m.label }}
        </button>
      </div>

      <div class="stage-control-actions">
        <button type="button" class="stage-tab-btn" @click="triggerCelebration">
          🎉 Confetti Cannon
        </button>
        <button type="button" class="stage-tab-btn" @click="toggleFullscreen">
          ⛶ Fullscreen
        </button>
        <button type="button" class="stage-tab-btn" @click="hideToolbar = !hideToolbar">
          {{ hideToolbar ? '👁️ Show Controls' : '✕ Hide Controls' }}
        </button>
      </div>
    </div>

    <!-- Stage Header -->
    <header class="stage-header">
      <div class="stage-org-tag">{{ pageant.organizationName || 'OFFICIAL TABULATION' }}</div>
      <h1 class="stage-title">{{ pageant.pageantName || 'PAGEANT TABULATION' }}</h1>
      <div class="stage-subtitle">{{ pageant.eventName || 'GRAND CORONATION NIGHT' }}</div>
      <p v-if="pageant.motto" class="stage-motto">"{{ pageant.motto }}"</p>
    </header>

    <!-- MODE 1: CANDIDATE SPOTLIGHT / SHOWCASE -->
    <section v-if="currentMode === 'SHOWCASE'" class="stage-mode-section">
      <div class="showcase-candidate-card" v-if="activeContestant">
        <div class="showcase-photo-frame">
          <img v-if="activeContestant.photo" :src="activeContestant.photo" :alt="activeContestant.name" />
          <div v-else class="showcase-fallback">
            <span>{{ activeContestant.name.slice(0, 2).toUpperCase() }}</span>
            <small>#{{ activeContestant.contestantNumber }}</small>
          </div>
        </div>

        <div class="showcase-candidate-details">
          <div class="showcase-num-badge">CANDIDATE #{{ activeContestant.contestantNumber }}</div>
          <h2 class="showcase-name">{{ activeContestant.name }}</h2>
          <div v-if="activeContestant.hometown" class="showcase-hometown">📍 {{ activeContestant.hometown }}</div>

          <div v-if="activeContestant.advocacy" class="showcase-advocacy-box">
            <span class="advocacy-label">OFFICIAL ADVOCACY</span>
            <p class="advocacy-quote">"{{ activeContestant.advocacy }}"</p>
          </div>

          <div class="showcase-meta-row">
            <span v-if="activeContestant.age">Age: {{ activeContestant.age }}</span>
            <span v-if="activeContestant.height">Height: {{ activeContestant.height }}</span>
          </div>
        </div>
      </div>

      <!-- Candidate Selector Stepper at Bottom -->
      <div class="showcase-selector-bar no-print">
        <button
          v-for="c in contestants"
          :key="c._id"
          type="button"
          class="candidate-chip-btn"
          :class="{ active: activeContestant?._id === c._id }"
          @click="activeContestant = c"
        >
          #{{ c.contestantNumber }} {{ c.name.split(' ')[0] }}
        </button>
      </div>
    </section>

    <!-- MODE 2: TOP 5 FINALISTS DRAMATIC REVEAL -->
    <section v-else-if="currentMode === 'FINALISTS'" class="stage-mode-section">
      <div class="reveal-header">
        <span class="reveal-badge">OFFICIAL QUALIFIERS</span>
        <h2>TOP 5 FINALISTS REVEAL</h2>
      </div>

      <div class="stage-finalists-grid">
        <div
          v-for="(finalist, idx) in finalists"
          :key="finalist._id"
          class="stage-reveal-card"
          :class="{ is_revealed: revealedFinalists.includes(idx) }"
          @click="toggleRevealFinalist(idx)"
        >
          <div class="card-inner">
            <div class="card-front">
              <span class="mystery-icon">👑</span>
              <span class="mystery-text">FINALIST #{{ idx + 1 }}</span>
              <small class="click-prompt no-print">(Click to Reveal)</small>
            </div>

            <div class="card-back">
              <div class="reveal-photo">
                <img v-if="finalist.contestantId?.photo" :src="finalist.contestantId.photo" :alt="finalist.contestantId.name" />
                <span v-else>{{ finalist.contestantId?.name?.slice(0, 2).toUpperCase() }}</span>
              </div>
              <span class="finalist-candidate-num">#{{ finalist.contestantId?.contestantNumber }}</span>
              <strong class="finalist-candidate-name">{{ finalist.contestantId?.name }}</strong>
              <span class="finalist-candidate-hometown">{{ finalist.contestantId?.hometown }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="reveal-controls no-print">
        <button type="button" class="btn btn-gold" @click="revealAllFinalists">
          ✨ Reveal All Top 5
        </button>
        <button type="button" class="btn btn-ghost" @click="revealedFinalists = []">
          🔄 Reset Reveal Cards
        </button>
      </div>
    </section>

    <!-- MODE 3: GRAND CORONATION & WINNERS PROCLAMATION -->
    <section v-else-if="currentMode === 'CORONATION'" class="stage-mode-section">
      <div class="reveal-header">
        <span class="reveal-badge">ROYAL PROCLAMATION</span>
        <h2>GRAND CORONATION CEREMONY</h2>
      </div>

      <div class="coronation-stage-display">
        <!-- 4th Runner Up -->
        <div class="coronation-title-row" :class="{ winner_revealed: revealedWinners.includes(4) }">
          <div class="title-meta">
            <span class="title-rank-num">4th Runner Up</span>
            <button type="button" class="btn btn-ghost btn-sm no-print" @click="toggleWinnerReveal(4)">
              {{ revealedWinners.includes(4) ? 'Hide' : 'Reveal' }}
            </button>
          </div>
          <div class="title-candidate-info" v-if="getWinnerByRank(5)">
            <strong>#{{ getWinnerByRank(5)?.contestant?.contestantNumber }} {{ getWinnerByRank(5)?.contestant?.name }}</strong>
            <span>{{ getWinnerByRank(5)?.contestant?.hometown }}</span>
          </div>
        </div>

        <!-- 3rd Runner Up -->
        <div class="coronation-title-row" :class="{ winner_revealed: revealedWinners.includes(3) }">
          <div class="title-meta">
            <span class="title-rank-num">3rd Runner Up</span>
            <button type="button" class="btn btn-ghost btn-sm no-print" @click="toggleWinnerReveal(3)">
              {{ revealedWinners.includes(3) ? 'Hide' : 'Reveal' }}
            </button>
          </div>
          <div class="title-candidate-info" v-if="getWinnerByRank(4)">
            <strong>#{{ getWinnerByRank(4)?.contestant?.contestantNumber }} {{ getWinnerByRank(4)?.contestant?.name }}</strong>
            <span>{{ getWinnerByRank(4)?.contestant?.hometown }}</span>
          </div>
        </div>

        <!-- 2nd Runner Up -->
        <div class="coronation-title-row bronze-row" :class="{ winner_revealed: revealedWinners.includes(2) }">
          <div class="title-meta">
            <span class="title-rank-num">🥉 2nd Runner Up</span>
            <button type="button" class="btn btn-ghost btn-sm no-print" @click="toggleWinnerReveal(2)">
              {{ revealedWinners.includes(2) ? 'Hide' : 'Reveal' }}
            </button>
          </div>
          <div class="title-candidate-info" v-if="getWinnerByRank(3)">
            <strong>#{{ getWinnerByRank(3)?.contestant?.contestantNumber }} {{ getWinnerByRank(3)?.contestant?.name }}</strong>
            <span>{{ getWinnerByRank(3)?.contestant?.hometown }}</span>
          </div>
        </div>

        <!-- 1st Runner Up -->
        <div class="coronation-title-row silver-row" :class="{ winner_revealed: revealedWinners.includes(1) }">
          <div class="title-meta">
            <span class="title-rank-num">🥈 1st Runner Up</span>
            <button type="button" class="btn btn-ghost btn-sm no-print" @click="toggleWinnerReveal(1)">
              {{ revealedWinners.includes(1) ? 'Hide' : 'Reveal' }}
            </button>
          </div>
          <div class="title-candidate-info" v-if="getWinnerByRank(2)">
            <strong>#{{ getWinnerByRank(2)?.contestant?.contestantNumber }} {{ getWinnerByRank(2)?.contestant?.name }}</strong>
            <span>{{ getWinnerByRank(2)?.contestant?.hometown }}</span>
          </div>
        </div>

        <!-- Grand Title Winner -->
        <div class="coronation-title-row gold-grand-winner" :class="{ winner_revealed: revealedWinners.includes(0) }">
          <div class="title-meta">
            <span class="title-rank-num grand-title-crown">👑 TITLE WINNER 👑</span>
            <button type="button" class="btn btn-gold btn-sm no-print" @click="proclaimGrandWinner">
              {{ revealedWinners.includes(0) ? 'Proclaim Again' : 'Crown & Proclaim!' }}
            </button>
          </div>
          <div class="title-candidate-info grand-info" v-if="getWinnerByRank(1)">
            <div class="grand-photo-ring">
              <img v-if="getWinnerByRank(1)?.contestant?.photo" :src="getWinnerByRank(1)?.contestant?.photo" :alt="getWinnerByRank(1)?.contestant?.name" />
              <span v-else>{{ getWinnerByRank(1)?.contestant?.name?.slice(0, 2).toUpperCase() }}</span>
            </div>
            <div>
              <h2 class="grand-winner-name">#{{ getWinnerByRank(1)?.contestant?.contestantNumber }} {{ getWinnerByRank(1)?.contestant?.name }}</h2>
              <span class="grand-winner-hometown">📍 {{ getWinnerByRank(1)?.contestant?.hometown }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- MODE 4: LIVE BROADCAST SCOREBOARD -->
    <section v-else-if="currentMode === 'LEADERBOARD'" class="stage-mode-section">
      <div class="reveal-header">
        <span class="reveal-badge">LIVE TABULATION SCOREBOARD</span>
        <h2>OFFICIAL RANKINGS</h2>
      </div>

      <div class="stage-leaderboard-wrap">
        <table class="stage-leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>#</th>
              <th>Candidate</th>
              <th>Hometown</th>
              <th>Round 1</th>
              <th v-if="finalRankings.length">Final Score</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in displayedRankings"
              :key="row.contestant?._id"
              :class="{ 'gold-row': row.rank === 1, 'silver-row': row.rank === 2, 'bronze-row': row.rank === 3 }"
            >
              <td class="font-bold">
                <span v-if="row.rank === 1">👑 1st</span>
                <span v-else-if="row.rank === 2">🥈 2nd</span>
                <span v-else-if="row.rank === 3">🥉 3rd</span>
                <span v-else>#{{ row.rank }}</span>
              </td>
              <td>#{{ row.contestant?.contestantNumber }}</td>
              <td class="font-bold">{{ row.contestant?.name }}</td>
              <td>{{ row.contestant?.hometown || '-' }}</td>
              <td>{{ fmt(row.roundOneTotal ?? row.total) }}</td>
              <td v-if="finalRankings.length" class="font-bold score-gold">
                {{ fmt(row.finalScore) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import confetti from 'canvas-confetti';
import { api } from '../../services/api.js';
import { connectSocket } from '../../services/socket.js';
import { fmt } from '../../utils/score.js';

const modes = [
  { key: 'SHOWCASE', label: 'Candidate Showcase', icon: '👤' },
  { key: 'FINALISTS', label: 'Top 5 Reveal', icon: '👑' },
  { key: 'CORONATION', label: 'Grand Coronation', icon: '✨' },
  { key: 'LEADERBOARD', label: 'Live Scoreboard', icon: '📊' }
];

const currentMode = ref('SHOWCASE');
const hideToolbar = ref(false);
const pageant = ref({});
const contestants = ref([]);
const activeContestant = ref(null);
const finalists = ref([]);
const roundOneRankings = ref([]);
const finalRankings = ref([]);

const revealedFinalists = ref([]);
const revealedWinners = ref([]);

const displayedRankings = computed(() => {
  return finalRankings.value.length ? finalRankings.value : roundOneRankings.value;
});

function getWinnerByRank(targetRank) {
  return finalRankings.value.find((r) => r.rank === targetRank) || roundOneRankings.value.find((r) => r.rank === targetRank);
}

function toggleRevealFinalist(idx) {
  if (revealedFinalists.value.includes(idx)) {
    revealedFinalists.value = revealedFinalists.value.filter((i) => i !== idx);
  } else {
    revealedFinalists.value.push(idx);
    triggerCelebration();
  }
}

function revealAllFinalists() {
  revealedFinalists.value = finalists.value.map((_, i) => i);
  triggerCelebration();
}

function toggleWinnerReveal(rankIdx) {
  if (revealedWinners.value.includes(rankIdx)) {
    revealedWinners.value = revealedWinners.value.filter((i) => i !== rankIdx);
  } else {
    revealedWinners.value.push(rankIdx);
    triggerCelebration();
  }
}

function proclaimGrandWinner() {
  if (!revealedWinners.value.includes(0)) {
    revealedWinners.value.push(0);
  }
  // Explosive confetti cannon
  const duration = 5 * 1000;
  const animationEnd = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 7,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#d4af37', '#ffffff', '#e5c158']
    });
    confetti({
      particleCount: 7,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#d4af37', '#ffffff', '#c99a2e']
    });

    if (Date.now() < animationEnd) {
      requestAnimationFrame(frame);
    }
  };
  frame();
}

function triggerCelebration() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#d4af37', '#ffffff', '#10233f', '#e5c158']
  });
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

async function load() {
  const [pageantRes, contestantsRes, finalistsRes, r1Res, finalRes] = await Promise.all([
    api.get('/pageant').catch(() => ({ data: { pageant: {} } })),
    api.get('/contestants').catch(() => ({ data: { contestants: [] } })),
    api.get('/admin/finalists').catch(() => ({ data: { finalists: [] } })),
    api.get('/admin/round-one/results').catch(() => ({ data: { rankings: [] } })),
    api.get('/admin/final/results').catch(() => ({ data: { rankings: [] } }))
  ]);

  pageant.value = pageantRes.data.pageant || {};
  contestants.value = contestantsRes.data.contestants || [];
  if (!activeContestant.value && contestants.value.length) {
    activeContestant.value = contestants.value[0];
  }
  finalists.value = finalistsRes.data?.finalists || [];
  roundOneRankings.value = r1Res.data?.rankings || [];
  finalRankings.value = finalRes.data?.rankings || [];
}

onMounted(() => {
  load();
  const socket = connectSocket();
  socket.on('results:updated', load);
  socket.on('finalists:generated', load);
});
</script>

<style scoped>
.stage-screen {
  min-height: 100vh;
  background: radial-gradient(circle at center, #10233f 0%, #060c17 100%);
  color: #ffffff;
  padding: 1.5rem 2rem 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow-x: hidden;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.stage-control-bar {
  position: fixed;
  top: 1rem;
  z-index: 50;
  background: rgba(13, 27, 42, 0.9);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(201, 154, 46, 0.4);
  border-radius: var(--radius-full);
  padding: 0.4rem 0.8rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
  transition: all 250ms ease;
}

.bar-minimized {
  opacity: 0.15;
  transform: translateY(-80%);
}

.bar-minimized:hover {
  opacity: 1;
  transform: translateY(0);
}

.stage-mode-tabs {
  display: flex;
  gap: 0.4rem;
}

.stage-tab-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: var(--radius-full);
  padding: 0.4rem 0.85rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 150ms ease;
}

.stage-tab-btn:hover {
  background: rgba(201, 154, 46, 0.2);
}

.stage-tab-btn.active {
  background: linear-gradient(135deg, var(--gold), var(--gold-dark));
  color: #0b1528;
  font-weight: 900;
}

.stage-control-actions {
  display: flex;
  gap: 0.4rem;
  border-left: 1px solid rgba(255, 255, 255, 0.15);
  padding-left: 0.75rem;
}

/* Header */
.stage-header {
  text-align: center;
  margin-top: 3.5rem;
  margin-bottom: 2rem;
}

.stage-org-tag {
  font-size: 0.85rem;
  color: var(--gold-light);
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.stage-title {
  font-family: 'Cinzel', serif;
  font-size: clamp(2.2rem, 5vw, 3.8rem);
  font-weight: 900;
  letter-spacing: 0.06em;
  background: linear-gradient(135deg, #ffffff 0%, #e5c158 50%, #c99a2e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0.2rem 0;
}

.stage-subtitle {
  font-size: clamp(1rem, 2vw, 1.3rem);
  color: #ffffff;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.stage-motto {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
  margin-top: 0.35rem;
}

/* Stage Mode Section */
.stage-mode-section {
  width: 100%;
  max-width: 1100px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Showcase Card */
.showcase-candidate-card {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 3rem;
  background: rgba(13, 27, 42, 0.75);
  backdrop-filter: blur(16px);
  border: 2px solid var(--gold);
  border-radius: var(--radius-lg);
  padding: 2.5rem;
  box-shadow: 0 0 50px rgba(201, 154, 46, 0.25);
  width: 100%;
}

.showcase-photo-frame {
  aspect-ratio: 3 / 4;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 3px solid var(--gold-light);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
  background: #000;
}

.showcase-photo-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.showcase-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--gold-light);
  font-size: 4rem;
  font-weight: 900;
}

.showcase-candidate-details {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
}

.showcase-num-badge {
  display: inline-block;
  background: var(--gold);
  color: #0b1528;
  font-size: 1.1rem;
  font-weight: 900;
  padding: 0.3rem 0.85rem;
  border-radius: var(--radius-md);
  width: fit-content;
}

.showcase-name {
  font-size: clamp(2rem, 4vw, 3.2rem);
  font-weight: 900;
  line-height: 1.1;
}

.showcase-hometown {
  font-size: 1.4rem;
  color: var(--gold-light);
  font-weight: 800;
}

.showcase-advocacy-box {
  background: rgba(255, 255, 255, 0.05);
  border-left: 4px solid var(--gold);
  padding: 1rem 1.25rem;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.advocacy-label {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: var(--gold-light);
}

.advocacy-quote {
  font-size: 1.15rem;
  font-style: italic;
  line-height: 1.5;
  margin-top: 0.3rem;
}

.showcase-meta-row {
  display: flex;
  gap: 2rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
}

.showcase-selector-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 2rem;
}

.candidate-chip-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 150ms ease;
}

.candidate-chip-btn.active {
  background: var(--gold);
  color: #0b1528;
  font-weight: 900;
  border-color: var(--gold-light);
}

/* Reveal Mode Styles */
.reveal-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.reveal-badge {
  font-size: 0.85rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  color: var(--gold-light);
}

.reveal-header h2 {
  font-family: 'Cinzel', serif;
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  letter-spacing: 0.05em;
  margin-top: 0.25rem;
}

.stage-finalists-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1.25rem;
  width: 100%;
}

.stage-reveal-card {
  perspective: 1000px;
  height: 320px;
  cursor: pointer;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.stage-reveal-card.is_revealed .card-inner {
  transform: rotateY(180deg);
}

.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.card-front {
  background: linear-gradient(180deg, #18385f 0%, #0d1b2a 100%);
  border: 2px solid rgba(201, 154, 46, 0.5);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
}

.mystery-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.mystery-text {
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--gold-light);
}

.click-prompt {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.5rem;
}

.card-back {
  background: linear-gradient(180deg, #1e3a5f 0%, #0d1b2a 100%);
  border: 2px solid var(--gold);
  transform: rotateY(180deg);
  box-shadow: 0 0 30px var(--gold-glow);
  gap: 0.4rem;
}

.reveal-photo {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--gold);
  margin-bottom: 0.5rem;
}

.reveal-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.finalist-candidate-num {
  font-size: 0.85rem;
  font-weight: 900;
  color: var(--gold-light);
}

.finalist-candidate-name {
  font-size: 1.15rem;
  font-weight: 800;
  line-height: 1.2;
}

.finalist-candidate-hometown {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
}

.reveal-controls {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

/* Coronation Ceremony */
.coronation-stage-display {
  display: flex;
  flex-direction: column-reverse;
  gap: 1rem;
  width: 100%;
  max-width: 800px;
}

.coronation-title-row {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  padding: 1.25rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  opacity: 0.35;
  transition: all 500ms ease;
}

.coronation-title-row.winner_revealed {
  opacity: 1;
  transform: scale(1.02);
  border-color: var(--gold);
  background: linear-gradient(90deg, rgba(201, 154, 46, 0.2) 0%, rgba(13, 27, 42, 0.9) 100%);
  box-shadow: 0 0 25px rgba(201, 154, 46, 0.3);
}

.gold-grand-winner {
  background: linear-gradient(135deg, rgba(201, 154, 46, 0.3) 0%, #0d1b2a 100%);
  border: 3px solid var(--gold) !important;
  padding: 2rem !important;
}

.gold-grand-winner.winner_revealed {
  box-shadow: 0 0 50px var(--gold-glow);
  transform: scale(1.05);
}

.title-rank-num {
  font-family: 'Cinzel', serif;
  font-size: 1.3rem;
  font-weight: 900;
  color: var(--gold-light);
}

.grand-title-crown {
  font-size: 1.8rem;
  color: #fff;
  text-shadow: 0 0 10px var(--gold);
}

.title-candidate-info strong {
  display: block;
  font-size: 1.25rem;
}

.grand-info {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.grand-photo-ring {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--gold);
}

.grand-photo-ring img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.grand-winner-name {
  font-size: 1.8rem;
  font-weight: 900;
}

.grand-winner-hometown {
  font-size: 1.05rem;
  color: var(--gold-light);
}

/* Stage Leaderboard */
.stage-leaderboard-wrap {
  width: 100%;
  background: rgba(13, 27, 42, 0.85);
  border: 1px solid var(--gold);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
}

.stage-leaderboard-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 1.05rem;
}

.stage-leaderboard-table th {
  background: #18385f;
  color: var(--gold-light);
  padding: 1.1rem 1.4rem;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.stage-leaderboard-table td {
  padding: 1rem 1.4rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.stage-leaderboard-table tr.gold-row {
  background: rgba(201, 154, 46, 0.2);
}

.score-gold {
  color: var(--gold-light);
  font-size: 1.2rem;
}

@media (max-width: 900px) {
  .showcase-candidate-card {
    grid-template-columns: 1fr;
  }
  .stage-finalists-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

