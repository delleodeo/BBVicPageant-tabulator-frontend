<template>
  <label class="score-input">
    <span>{{ label }}</span>
    <input
      :value="modelValue"
      type="number"
      min="0"
      max="10"
      step="0.1"
      inputmode="decimal"
      :disabled="disabled"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </label>
</template>

<script setup>
defineEmits(['update:modelValue']);
defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, required: true },
  disabled: { type: Boolean, default: false }
});
</script>

