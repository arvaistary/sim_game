import type { BalanceAction } from '@/domain/balance/actions/types'

export interface ActionEffectDisplay {
  id: string
  text: string
  explanation: string
}

export interface ActionCardProps {
  action: BalanceAction
  disabled?: boolean
  disabledReason?: string
  buttonLabel?: string
  showPriceWhenZero?: boolean
  showDetails?: boolean
  useFormatEffect?: boolean
  showAddToPlan?: boolean
}

export interface ActionCardEmits {
  execute: [id: string]
}
