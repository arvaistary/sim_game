import type { BalanceAction } from '@/domain/balance/actions/types'

export interface ActionCardListProps {
  actions: BalanceAction[]
  isDisabled: (action: BalanceAction) => boolean
  getDisabledReason?: (action: BalanceAction) => string
  buttonLabel?: string
  showPriceWhenZero?: boolean
  showDetails?: boolean
  useFormatEffect?: boolean
  emptyText?: string
  showAddToPlan?: boolean
}

export interface ActionCardListEmits {
  execute: [id: string]
}
