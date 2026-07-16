import type { ComputedRef } from 'vue'
import type { ExecuteActionCommandResult } from '@/application/game/index.types'
import { getActionsByCategory, getActionById } from '@/domain/balance/actions'
import type { BalanceAction } from '@/domain/balance/actions'
import type { ActionCategory } from '@/domain/balance/types'
import type { UseActionsReturn } from './useActions.types'

/**
 * Composable для управления игровыми действиями
 * @description Provides access to game actions execution and management
 * @return { UseActionsReturn } Actions management functions and state
 */
export function useActions(): UseActionsReturn {
  const walletStore = useWalletStore()
  const timeStore = useTimeStore()
  const gameStore = useGameStore()
  const toast = useToast()
  const { filterActionsByAge, ageGroupLabel } = useAgeRestrictions()

  const actionsEmptyHint: ComputedRef<string> = computed<string>(() =>
    `Для этапа «${ageGroupLabel.value}» сейчас нет доступных действий в этом разделе. Часть активностей откроется в следующих возрастных группах.`,
  )

  function canExecute(actionId: string): boolean {
    const action: BalanceAction | null = getActionById(actionId)

    if (!action) return false

    if (walletStore.money < action.price) return false

    if (timeStore.weekHoursRemaining < action.hourCost) return false

    return true
  }

  async function executeAction(actionId: string): Promise<boolean> {
    const action: BalanceAction | null = getActionById(actionId)

    if (!action) {
      toast.showError(`Действие не найдено: ${actionId}`)
      return false
    }

    const result: ExecuteActionCommandResult = await gameStore.executeActionAsync(actionId)

    if (!result.success) {
      toast.showError(result.message)
      return false
    }

    showGameResultModal(action.title, result.message, {
      baseEffect: action.effect,
    })
    return true
  }

  function getActions(category: ActionCategory): BalanceAction[] {
    const actions: BalanceAction[] = getActionsByCategory(category)
    return filterActionsByAge(actions)
  }

  const allCategories: ComputedRef<ActionCategory[]> = computed<ActionCategory[]>(() => {
    return [
      'shop', 'fun', 'home', 'social', 'education',
      'finance', 'career', 'hobby', 'health', 'selfdev',
    ] as ActionCategory[]
  })

  return {
    canExecute,
    executeAction,
    getActionsByCategory: getActions,
    allCategories,
    actionsEmptyHint,
  }
}
