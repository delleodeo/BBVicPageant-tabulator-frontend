<template>
  <div v-if="open" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-panel modal-panel-lg">
      <div class="bio-modal-header">
        <div class="candidate-title-block">
          <span class="eyebrow">Candidate Profile</span>
          <h2>#{{ contestant?.contestantNumber }} {{ contestant?.name }}</h2>
          <p v-if="contestant?.hometown" class="candidate-hometown">
            <AppIcon name="mapPin" />
            {{ contestant.hometown }}
          </p>
        </div>
        <button type="button" class="close-btn" title="Close profile" @click="$emit('close')">
          <AppIcon name="xMark" />
        </button>
      </div>

      <div class="bio-modal-body">
        <div class="bio-photo-col">
          <div class="photo-frame-lg">
            <img v-if="contestant?.photo" :src="mediaUrl(contestant.photo)" :alt="contestant?.name" />
            <div v-else class="photo-fallback">
              <span>{{ contestant?.name?.slice(0, 2).toUpperCase() }}</span>
              <small>#{{ contestant?.contestantNumber }}</small>
            </div>
          </div>
        </div>

        <div class="bio-details-col">
          <div v-if="contestant?.advocacy" class="bio-section">
            <span class="bio-label">Official Advocacy</span>
            <p class="bio-advocacy">"{{ contestant.advocacy }}"</p>
          </div>

          <div class="bio-meta-grid">
            <div v-if="contestant?.age" class="meta-item">
              <span class="meta-label">Age</span>
              <strong>{{ contestant.age }} yrs old</strong>
            </div>
            <div v-if="contestant?.height" class="meta-item">
              <span class="meta-label">Height</span>
              <strong>{{ contestant.height }}</strong>
            </div>
            <div class="meta-item">
              <span class="meta-label">Status</span>
              <span class="status-pill">{{ contestant?.status }}</span>
            </div>
          </div>

          <div v-if="contestant?.bio" class="bio-section">
            <span class="bio-label">Biography</span>
            <p class="bio-text">{{ contestant.bio }}</p>
          </div>
        </div>
      </div>

      <div class="bio-modal-footer">
        <button type="button" class="btn btn-primary full" @click="$emit('close')">
          Close Profile
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import AppIcon from './AppIcon.vue';
import { mediaUrl } from '../services/api.js';

defineEmits(['close']);
defineProps({
  open: { type: Boolean, default: false },
  contestant: { type: Object, default: null }
});
</script>

<style scoped>
.bio-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--border);
  padding-bottom: 1rem;
}

.candidate-title-block h2 {
  font-size: 1.4rem;
  font-weight: 900;
  margin-top: 0.2rem;
}

.candidate-hometown {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--gold-dark);
}

.candidate-hometown .app-icon,
.close-btn .app-icon {
  width: 1rem;
  height: 1rem;
}

.close-btn {
  background: var(--surface-hover);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  font-weight: 800;
  cursor: pointer;
}

.bio-modal-body {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1.5rem;
}

.photo-frame-lg {
  aspect-ratio: 3 / 4;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: linear-gradient(135deg, var(--navy-dark), var(--navy));
  display: grid;
  place-items: center;
  box-shadow: var(--shadow-md);
}

.photo-frame-lg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bio-details-col {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.bio-section {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.bio-label {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.bio-advocacy {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--gold-dark);
  font-style: italic;
}

.bio-meta-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  background: var(--surface-hover);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.meta-label {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
}

.status-pill {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--success);
}

.bio-text {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text-main);
}

@media (max-width: 600px) {
  .bio-modal-body {
    grid-template-columns: 1fr;
  }
  .photo-frame-lg {
    max-width: 180px;
    margin: 0 auto;
  }
}
</style>
