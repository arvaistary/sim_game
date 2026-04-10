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
  color: 'var(--color-action-primary)',
  textColor: 'var(--color-text-on-primary)',
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
  min-height: 48px;
  padding: 12px 20px;
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-family-sans);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  box-shadow: var(--shadow-sm);
  user-select: none;
}

.game-button:hover:not(.game-button--disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-button-hover);
}

.game-button:active:not(.game-button--disabled) {
  transform: translateY(0);
}

.game-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.game-button--small {
  min-height: 40px;
  padding: 8px 14px;
  font-size: 14px;
}
</style>

