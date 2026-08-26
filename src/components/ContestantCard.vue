<template>
  <RouterLink class="contestant-card" :to="to">
    <div class="contestant-badge-num">
      #{{ contestant?.contestantNumber }}
    </div>

    <div class="photo-frame">
      <img v-if="contestant?.photo" :src="contestant.photo" :alt="contestant.name" />
      <div v-else class="photo-fallback">
        <span>{{ initials }}</span>
        <small>#{{ contestant?.contestantNumber }}</small>
      </div>
    </div>

    <div class="card-details">
      <h3 class="card-candidate-name">{{ contestant?.name }}</h3>
      <p v-if="contestant?.hometown" class="card-candidate-hometown">
        <AppIcon name="mapPin" />
        {{ contestant.hometown }}
      </p>
      <p v-if="contestant?.advocacy" class="card-candidate-advocacy">"{{ contestant.advocacy }}"</p>
    </div>

    <div class="card-footer-slot">
      <slot />
    </div>
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue';
import AppIcon from './AppIcon.vue';

const props = defineProps({
  contestant: { type: Object, required: true },
  to: { type: String, required: true }
});

const initials = computed(() =>
  props.contestant?.name
    ? props.contestant.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'C'
);
</script>

<style scoped>
.card-details {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.card-candidate-name {
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1.2;
}

.card-candidate-hometown {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: var(--gold-dark);
  font-weight: 700;
}

.card-candidate-hometown .app-icon {
  width: 0.9rem;
  height: 0.9rem;
}

.card-candidate-advocacy {
  font-size: 0.76rem;
  color: var(--text-muted);
  font-style: italic;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer-slot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border);
  margin-top: auto;
}
</style>
