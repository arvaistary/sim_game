import type { BalanceAction } from '@/domain/balance/actions/types'

export interface ActionDetailsModalProps {
  isOpen: boolean
  action: BalanceAction
  title?: string
  description?: string
  image?: string
  buttonLabel?: string
  disabled?: boolean
  showAddToPlan?: boolean
  useFormatEffect?: boolean
}

export interface ActionDetailsModalEmits {
  close: []
  execute: []
  addToPlan: [event?: MouseEvent]
}
