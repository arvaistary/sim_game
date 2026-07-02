<template>
  <div class="mode-switcher" :class="{ 'mode-switcher--warning': currentMode !== 'spa' }">
    <div class="mode-switcher__label">Game Mode</div>
    <div class="mode-switcher__buttons">
      <button
        v-for="mode in modes"
        :key="mode.id"
        class="mode-switcher__button"
        :class="{ 'mode-switcher__button--active': currentMode === mode.id }"
        type="button"
        :disabled="!canReload"
        :title="mode.description"
        @click="handleSelect(mode.id)"
      >
        {{ mode.label }}
      </button>
    </div>
    <p v-if="currentMode !== 'spa'" class="mode-switcher__hint">
      Изменение вступит в силу после перезагрузки. В Server-режиме требуется запущенный Nitro API.
    </p>
  </div>
</template>

<script setup lang="ts">
import type { GameMode } from '@/domain/game-mode'
import type { ModeOption, ModeSwitcherProps } from './ModeSwitcher.types'

withDefaults(defineProps<ModeSwitcherProps>(), {
  currentMode: 'spa',
})

const emit = defineEmits<{
  change: [mode: GameMode]
}>()

const modes: ModeOption[] = [
  { id: 'spa', label: 'SPA', description: 'Локальное исполнение (по умолчанию)' },
  { id: 'server', label: 'Server', description: 'Через Nitro API (требует запущенного сервера)' },
  { id: 'hybrid', label: 'Hybrid', description: 'Server с offline fallback на SPA' },
]

const canReload: ComputedRef<boolean> = computed<boolean>(() => {
  const isClient: boolean = import.meta.client

  return isClient && typeof window !== 'undefined' && 'location' in window
})

function handleSelect(mode: GameMode): void {
  emit('change', mode)

  if (!import.meta.client) return

  try {
    localStorage.setItem('gl_game_mode_override', mode)
  } catch {
    // localStorage недоступен — fallback на runtimeConfig
  }

  if (typeof window !== 'undefined') {
    window.location.reload()
  }
}
</script>
