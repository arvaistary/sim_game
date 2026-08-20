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
        <span class="toast-host__icon">
          <GameIcon :name="iconFor(toast.type)" :size="14" :stroke-width="2" />
        </span>
        <span class="toast-host__message">{{ toast.message }}</span>
        <button
          class="toast-host__close"
          type="button"
          aria-label="Закрыть уведомление"
          @click="dismiss(toast.id)"
        >
          <GameIcon name="close" :size="14" :stroke-width="1.5" />
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import './ToastHost.scss'

import type { GameIconName } from '@/components/ui/GameIcon/GameIcon.types'
import GameIcon from '@/components/ui/GameIcon/GameIcon.vue'
import type { ToastItem } from '@/composables/useToast/useToast.types'

const { toasts, dismiss } = useToast()

function iconFor(type: ToastItem['type']): GameIconName {
  const map: Record<ToastItem['type'], GameIconName> = {
    success: 'check-circle',
    error: 'close-circle',
    warning: 'danger-triangle',
    info: 'info-circle',
  }

  return map[type] ?? 'info-circle'
}
</script>
