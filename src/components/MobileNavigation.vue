<template>
  <nav ref="navigation" class="mobile-nav" aria-label="Mobile primary navigation">
    <RouterLink
      v-for="item in items"
      :key="item.to"
      class="mobile-nav-link"
      :class="{ 'router-link-active': isItemActive(item) }"
      :to="item.to"
      active-class="mobile-nav-route-active"
      exact-active-class="mobile-nav-route-exact-active"
      :aria-label="item.label"
      :title="item.label"
    >
      <span class="mobile-nav-icon" aria-hidden="true">
        <AppIcon :name="item.icon || 'sparkles'" />
      </span>
      <span class="mobile-nav-label">{{ item.short || item.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from './AppIcon.vue';

const props = defineProps({
  items: { type: Array, required: true }
});

const route = useRoute();
const router = useRouter();
const navigation = ref(null);

function isItemActive(item) {
  const target = router.resolve(item.to);
  if (target.hash) {
    return route.path === target.path && route.hash === target.hash;
  }

  const matchingHashDestination = props.items.some((candidate) => {
    const resolved = router.resolve(candidate.to);
    return resolved.hash && resolved.path === route.path && resolved.hash === route.hash;
  });

  if (matchingHashDestination && target.path === route.path) return false;
  return route.path === target.path || route.path.startsWith(`${target.path}/`);
}

async function revealActiveItem(behavior = 'smooth') {
  await nextTick();
  navigation.value?.querySelector('.router-link-active')?.scrollIntoView({
    behavior,
    block: 'nearest',
    inline: 'center'
  });
}

onMounted(() => revealActiveItem('auto'));
watch(() => route.fullPath, () => revealActiveItem());
</script>
