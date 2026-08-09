import { openModal } from '../useGameModal'
import EventModal from '@/components/pages/events/EventModal/EventModal.vue'

/**
 * Открывает событие как модальное окно.
 * @description [Composable] - тонкая обёртка над useGameModal для EventModal.
 * @return { { openEventModal: () => void } }
 */
export function useEventModal(): { openEventModal: () => void } {
  let modalId: symbol | null = null

  /**
   * Открывает модальное окно с событием.
   * @description [Composable] - идемпотентно: повторный вызов при открытом окне no-op.
   * @return { void }
   */
  function openEventModal(): void {
    if (modalId) return

    modalId = openModal(EventModal, {
      onClose: () => {
        modalId = null
      },
    })
  }

  return {
    openEventModal,
  }
}
