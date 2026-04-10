<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" class="toast" :class="`toast--${type}`">
        <span class="toast__icon">{{ iconMap[type] }}</span>
        <span class="toast__message">{{ message }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'

const props = withDefaults(defineProps<{
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
  visible?: boolean
}>(), {
  type: 'info',
  duration: 2500,
  visible: false,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const iconMap: Record<string, string> = {
  info: 'i',
  success: '+',
  warning: '!',
  error: 'x',
}

watch(() => props.visible, (val) => {
  if (val) {
    setTimeout(() => {
      emit('update:visible', false)
    }, props.duration)
  }
})
</script>

<style scoped>
.toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-bg-card) 96%, transparent);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-popover);
  z-index: 2000;
  max-width: 90vw;
  backdrop-filter: blur(12px);
}

.toast--success {
  border-color: var(--color-success);
}

.toast--error {
  border-color: var(--color-danger);
}

.toast--warning {
  border-color: var(--color-brand-accent);
}

.toast__icon {
  font-size: 16px;
}

.toast__message {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

/* Transition */
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>

