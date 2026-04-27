/**
 * Типы для компонента GameNav
 */

export interface NavItemWithState {
  id: string
  icon: string
  label: string
  visible: boolean
  unlockAge: number | null
}

export interface NavItemClickPayload {
  id: string
}
