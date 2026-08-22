<template>
  <div v-if="open" class="modal-backdrop">
    <section class="modal-panel">
      <slot />
    </section>
  </div>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false }
});
</script>

