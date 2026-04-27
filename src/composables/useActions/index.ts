import { getActionsByCategory, getActionById, type BalanceAction } from '@domain/balance/actions'
import type { ActionCategory, StatChangeBreakdownEntry, StatChanges } from '@domain/balance/types'

/**
 * @description [Composables] - Предоставляет функции для работы с действиями: проверка доступности, выполнение, фильтрация по категории и возрасту.
 * @return { object } Объект с методами canExecute, executeAction, getActionsByCategory, allCategories, actionsEmptyHint.
 */
export const useActions = () => {
  const timeStore = useTimeStore()
  const statsStore = useStatsStore()
  const walletStore = useWalletStore()
  const activityStore = useActivityStore()

  const toast = useToast()
  const { filterActionsByAge, ageGroupLabel } = useAgeRestrictions()

  const actionsEmptyHint = computed<string>(
    () =>
      `Для этапа «${ageGroupLabel.value}» сейчас нет доступных действий в этом разделе. Часть активностей откроется в следующих возрастных группах.`,
  )

  function canExecute(actionId: string): boolean {
    const action: BalanceAction | null = getActionById(actionId)

    if (!action) return false

    if (walletStore.money < action.price) return false

    if (timeStore.weekHoursRemaining < action.hourCost) return false

    return true
  }

  function getCanExecuteReason(actionId: string): string | null {
    const action: BalanceAction | null = getActionById(actionId)

    if (!action) return 'Действие не найдено'

    if (walletStore.money < action.price) return 'Недостаточно денег'

    if (timeStore.weekHoursRemaining < action.hourCost) return 'Недостаточно времени'

    return null
  }

  function executeAction(actionId: string): boolean {
    const action: BalanceAction | null = getActionById(actionId)

    if (!action) {
      toast.showError(`Действие не найдено: ${actionId}`)

      return false
    }

    const reason: string | null = getCanExecuteReason(actionId)

    if (reason) {
      toast.showError(reason)

      return false
    }

    walletStore.spend(action.price)
    timeStore.advanceHours(action.hourCost, { actionType: action.actionType as 'work' | 'sleep' | 'default' })
    statsStore.applyStatChanges(action.statChanges ?? {})

    const statBreakdown: StatChanges | undefined = action.statChanges
    const message: string = action.effect || 'Действие выполнено'

    activityStore.addActionEntry(action.title, message, { category: action.category })

    showGameResultModal(action.title, message, {
      statBreakdown: statBreakdown as unknown as StatChangeBreakdownEntry[] | undefined,
      hourCost: action.hourCost,
      price: action.price,
    })

    return true
  }

  function getActions(category: ActionCategory): BalanceAction[] {
    const actions: BalanceAction[] = getActionsByCategory(category)

    return filterActionsByAge(actions)
  }

  const allCategories = computed<ActionCategory[]>(() => {
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
