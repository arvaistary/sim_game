/**
 * Константы размеров модальных окон
 */
export const MODAL_SIZES = {
  sm: '320px',
  md: '420px',
  lg: '560px',
  xl: '720px',
} as const

export type ModalSize = keyof typeof MODAL_SIZES
