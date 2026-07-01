import type { Ref } from 'vue'

export interface SettingsDrawerState {
  isOpen: boolean
}

const state: Ref<SettingsDrawerState> = ref<SettingsDrawerState>({
  isOpen: false,
})

/**
 * Управление правым Settings drawer.
 * @description [Composable] - открывает/закрывает SettingsDrawer, рендерящийся в Topbar.
 * @return { object } реактивное состояние и методы open/close/toggle
 */
export function useSettingsDrawer() {
  function open(): void {
    state.value.isOpen = true
  }

  function close(): void {
    state.value.isOpen = false
  }

  function toggle(): void {
    state.value.isOpen = !state.value.isOpen
  }

  return {
    state,
    open,
    close,
    toggle,
  }
}
