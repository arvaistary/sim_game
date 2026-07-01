<template>
  <Teleport to="body">
    <TransitionGroup
      name="pop"
      tag="div"
      class="toast-host"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-host__item"
        :class="`toast-host__item--${toast.type}`"
        role="status"
        aria-live="polite"
      >
        <span class="toast-host__icon">{{ iconFor(toast.type) }}</span>
        <span class="toast-host__message">{{ toast.message }}</span>
        <button
          class="toast-host__close"
          type="button"
          aria-label="Закрыть уведомление"
          @click="dismiss(toast.id)"
        >×</button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import './ToastHost.scss'

import type { ToastItem } from '@/composables/useToast/useToast.types'

const { toasts, dismiss } = useToast()

function iconFor(type: ToastItem['type']): string {
  const map: Record<ToastItem['type'], string> = {
    success: '✓',
    error: '!',
    warning: '⚠',
    info: 'i',
  }
  return map[type] ?? 'i'
}
</script>
