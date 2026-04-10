<template>
  <button
    class="game-button"
    :class="{ 'game-button--disabled': disabled, 'game-button--small': small }"
    :style="buttonStyle"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot>{{ label }}</slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  label?: string
  color?: string
  textColor?: string
  disabled?: boolean
  small?: boolean
}>(), {
  color: 'var(--color-neutral)',
  textColor: 'var(--color-text)',
  disabled: false,
  small: false,
})

defineEmits<{
  click: []
}>()

const buttonStyle = computed(() => ({
  backgroundColor: props.color,
  color: props.textColor,
}))
</script>

<style scoped>
.game-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  border: none;
  border-radius: var(--radius-button);
  font-family: var(--font-main);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  box-shadow: var(--shadow-button);
  user-select: none;
}

.game-button:hover:not(.game-button--disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(60, 47, 47, 0.12);
}

.game-button:active:not(.game-button--disabled) {
  transform: translateY(0);
}

.game-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.game-button--small {
  padding: 8px 14px;
  font-size: 13px;
}
</style>

