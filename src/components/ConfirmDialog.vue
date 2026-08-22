<template>
  <div v-if="open" class="modal-backdrop">
    <section class="modal-panel" role="dialog" aria-modal="true">
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>
      <div class="button-row">
        <button class="ghost-button" type="button" @click="$emit('cancel')">Cancel</button>
        <button class="danger-button" type="button" @click="$emit('confirm')">{{ confirmLabel }}</button>
      </div>
    </section>
  </div>
</template>

<script setup>
defineEmits(['cancel', 'confirm']);
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Confirm' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirm' }
});
</script>

