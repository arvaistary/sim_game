import type { ComputedRef } from 'vue'
import type { BalanceAction } from '@/domain/balance/actions'
import type { ActionCategory } from '@/domain/balance/types'

export type UseActionsReturn = {
  canExecute: (actionId: string) => boolean
  executeAction: (actionId: string) => Promise<boolean>
  getActionsByCategory: (category: ActionCategory) => BalanceAction[]
  getAllActions: () => BalanceAction[]
  allCategories: ComputedRef<ActionCategory[]>
  actionsEmptyHint: ComputedRef<string>
}
