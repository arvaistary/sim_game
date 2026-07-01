import type { Ref } from 'vue'

export interface CommandPaletteState {
  isOpen: boolean
}

const state: Ref<CommandPaletteState> = ref<CommandPaletteState>({
  isOpen: false,
})

/**
 * Управление командной палитрой (Cmd+K / Ctrl+K).
 * @description [Composable] - открывает/закрывает CommandPalette, регистрирует глобальный hotkey.
 * @return { object } реактивное состояние и методы open/close/toggle + handleKeydown
 */
export function useCommandPalette() {
  function open(): void {
    state.value.isOpen = true
  }

  function close(): void {
    state.value.isOpen = false
  }

  function toggle(): void {
    state.value.isOpen = !state.value.isOpen
  }

  /**
   * Глобальный обработчик Cmd+K / Ctrl+K. Вешается на window keydown.
   * @description [Composable] - проверяет hotkey и открывает палитру, возвращая true если сработал.
   * @return { boolean } true если hotkey сработал (для preventDefault)
   */
  function handleKeydown(event: KeyboardEvent): boolean {
    const isModK: boolean = (event.metaKey || event.ctrlKey) && (event.key === 'k' || event.key === 'K')
    if (!isModK) return false

    event.preventDefault()
    toggle()

    return true
  }

  return {
    state,
    open,
    close,
    toggle,
    handleKeydown,
  }
}
