/**
 * Глобальная регистрация hotkey Cmd+K / Ctrl+K для командной палитры.
 */
import { useCommandPalette } from '@/composables/useCommandPalette'

export default defineNuxtPlugin(() => {
  const { handleKeydown } = useCommandPalette()

  function onKeydown(event: KeyboardEvent): void {
    handleKeydown(event)
  }

  window.addEventListener('keydown', onKeydown)
})
