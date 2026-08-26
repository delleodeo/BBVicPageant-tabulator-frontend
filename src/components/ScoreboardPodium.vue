<template>
  <div class="podium-wrapper">
    <div class="podium-header">
      <div class="eyebrow"><AppIcon name="finalists" /> Live Leaderboard</div>
      <h3>Top Contenders</h3>
    </div>

    <div v-if="items.length === 0" class="empty-podium">
      <p>No rankings available yet.</p>
    </div>

    <div v-else class="podium-display">
      <!-- 2nd Place (Silver) -->
      <div v-if="items[1]" class="podium-col rank-2">
        <div class="candidate-avatar">
          <div class="avatar-ring silver">
            <span class="rank-crown"><AppIcon name="awards" /></span>
            <img v-if="items[1].contestant?.photo" :src="mediaUrl(items[1].contestant.photo)" :alt="items[1].contestant.name" />
            <span v-else class="avatar-initials">{{ items[1].contestant?.name?.slice(0, 2) }}</span>
          </div>
        </div>
        <div class="candidate-info">
          <span class="c-number">#{{ items[1].contestant?.contestantNumber }}</span>
          <strong class="c-name">{{ items[1].contestant?.name }}</strong>
          <span class="c-score">{{ fmt(items[1].finalScore ?? items[1].total) }} pts</span>
        </div>
        <div class="podium-block block-2">
          <span class="podium-num">2</span>
        </div>
      </div>

      <!-- 1st Place (Gold) -->
      <div v-if="items[0]" class="podium-col rank-1">
        <div class="candidate-avatar">
          <div class="avatar-ring gold">
            <span class="rank-crown"><AppIcon name="finalists" /></span>
            <img v-if="items[0].contestant?.photo" :src="mediaUrl(items[0].contestant.photo)" :alt="items[0].contestant.name" />
            <span v-else class="avatar-initials">{{ items[0].contestant?.name?.slice(0, 2) }}</span>
          </div>
        </div>
        <div class="candidate-info">
          <span class="c-number">#{{ items[0].contestant?.contestantNumber }}</span>
          <strong class="c-name">{{ items[0].contestant?.name }}</strong>
          <span class="c-score gold-score">{{ fmt(items[0].finalScore ?? items[0].total) }} pts</span>
        </div>
        <div class="podium-block block-1">
          <span class="podium-num">1</span>
        </div>
      </div>

      <!-- 3rd Place (Bronze) -->
      <div v-if="items[2]" class="podium-col rank-3">
        <div class="candidate-avatar">
          <div class="avatar-ring bronze">
            <span class="rank-crown"><AppIcon name="awards" /></span>
            <img v-if="items[2].contestant?.photo" :src="mediaUrl(items[2].contestant.photo)" :alt="items[2].contestant.name" />
            <span v-else class="avatar-initials">{{ items[2].contestant?.name?.slice(0, 2) }}</span>
          </div>
        </div>
        <div class="candidate-info">
          <span class="c-number">#{{ items[2].contestant?.contestantNumber }}</span>
          <strong class="c-name">{{ items[2].contestant?.name }}</strong>
          <span class="c-score">{{ fmt(items[2].finalScore ?? items[2].total) }} pts</span>
        </div>
        <div class="podium-block block-3">
          <span class="podium-num">3</span>
        </div>
      </div>
    </div>

    <!-- 4th and 5th Runners List -->
    <div v-if="items.length > 3" class="runners-list">
      <div v-for="item in items.slice(3, 5)" :key="item.contestant?._id" class="runner-row">
        <span class="runner-rank">Rank {{ item.rank }}</span>
        <span class="runner-num">#{{ item.contestant?.contestantNumber }}</span>
        <span class="runner-name">{{ item.contestant?.name }}</span>
        <strong class="runner-score">{{ fmt(item.finalScore ?? item.total) }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup>
import AppIcon from './AppIcon.vue';
import { mediaUrl } from '../services/api.js';
import { fmt } from '../utils/score.js';

defineProps({
  items: { type: Array, default: () => [] }
});
</script>

<style scoped>
.podium-wrapper {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.podium-header h3 {
  font-size: 1.25rem;
  font-weight: 800;
}

.podium-display {
  display: grid;
  grid-template-columns: 1fr 1.15fr 1fr;
  align-items: end;
  gap: 0.75rem;
  min-height: 250px;
  padding-top: 1.5rem;
}

.podium-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  text-align: center;
}

.candidate-avatar {
  position: relative;
}

.avatar-ring {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  display: grid;
  place-items: center;
  background: var(--navy);
  box-shadow: var(--shadow-md);
}

.avatar-ring.gold {
  width: 80px;
  height: 80px;
  border: 3px solid var(--gold);
  box-shadow: var(--shadow-gold);
}

.avatar-ring.silver {
  border: 2px solid #94a3b8;
}

.avatar-ring.bronze {
  border: 2px solid #b45309;
}

.avatar-ring img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  color: #fff;
  font-weight: 800;
  font-size: 1.2rem;
}

.rank-crown {
  position: absolute;
  top: -12px;
  z-index: 2;
  color: var(--gold);
}

.rank-crown .app-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.candidate-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.c-number {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--text-muted);
}

.c-name {
  font-size: 0.88rem;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 110px;
}

.c-score {
  font-size: 0.85rem;
  font-weight: 900;
  color: var(--text-main);
}

.c-score.gold-score {
  color: var(--gold-dark);
  font-size: 0.95rem;
}

.podium-block {
  width: 100%;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  color: #fff;
  box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.2);
}

.block-1 {
  height: 90px;
  background: linear-gradient(180deg, #d4af37 0%, #996515 100%);
  font-size: 1.8rem;
}

.block-2 {
  height: 65px;
  background: linear-gradient(180deg, #94a3b8 0%, #475569 100%);
  font-size: 1.5rem;
}

.block-3 {
  height: 48px;
  background: linear-gradient(180deg, #d97706 0%, #78350f 100%);
  font-size: 1.3rem;
}

.runners-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-top: 1px solid var(--border);
  padding-top: 1rem;
}

.runner-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--surface-hover);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
}

.runner-rank {
  font-weight: 800;
  color: var(--text-muted);
}

.runner-num {
  font-weight: 700;
}

.runner-name {
  flex: 1;
  font-weight: 700;
}

.runner-score {
  color: var(--navy);
  font-weight: 900;
}

.empty-podium {
  text-align: center;
  color: var(--text-muted);
  padding: 2rem 0;
}
</style>
