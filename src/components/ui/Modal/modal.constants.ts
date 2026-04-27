import { ModalSize } from './modal.types'

/**
 * Константы размеров модальных окон
 */
export const MODAL_SIZES: Record<ModalSize, string> = {
  [ModalSize.Sm]: '320px',
  [ModalSize.Md]: '420px',
  [ModalSize.Lg]: '560px',
  [ModalSize.Xl]: '720px',
}
