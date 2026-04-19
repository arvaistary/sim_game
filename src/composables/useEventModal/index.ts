import { openModal, closeModal } from '../useGameModal'
import { EventModal } from '#components'

/**
 * Открывает событие как модальное окно
 *
 * @example
 * ```ts
 * import { useEventModal } from '@/composables/useEventModal'
 *
 * const { openEventModal } = useEventModal()
 * openEventModal()
 * ```
 */
export function useEventModal() {
  let modalId: symbol | null = null

  /**
   * Открывает модальное окно с событием
   */
  function openEventModal(): void {
    if (modalId) {
      // Уже открыто
      return
    }

    modalId = openModal(EventModal, {
      onClose: () => {
        modalId = null
      },
    })
  }

  /**
   * Закрывает модальное окно с событием
   */
  function closeEventModal(): void {
    if (modalId) {
      closeModal(modalId)
      modalId = null
    }
  }

  return {
    openEventModal,
    closeEventModal,
  }
}
