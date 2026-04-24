
import { getActionsByCategory, getActionById } from '@/domain/balance/actions'
import type { BalanceAction } from '@/domain/balance/actions'
import type { ActionCategory } from '@/domain/balance/types'

export function useActions() {
  const timeStore = useTimeStore()
  const statsStore = useStatsStore()
  const walletStore = useWalletStore()
  const activityStore = useActivityStore()
  const toast = useToast()
  const { filterActionsByAge, ageGroupLabel } = useAgeRestrictions()

  const actionsEmptyHint = computed(
    () =>
      `Для этапа «${ageGroupLabel.value}» сейчас нет доступных действий в этом разделе. Часть активностей откроется в следующих возрастных группах.`,
  )

  function canExecute(actionId: string): boolean {
    const action = getActionById(actionId)
    if (!action) return false
    if (walletStore.money < action.price) return false
    if (timeStore.weekHoursRemaining < action.hourCost) return false
    return true
  }

  function getCanExecuteReason(actionId: string): string | null {
    const action = getActionById(actionId)
    if (!action) return 'Действие не найдено'
    if (walletStore.money < action.price) return 'Недостаточно денег'
    if (timeStore.weekHoursRemaining < action.hourCost) return 'Недостаточно времени'
    return null
  }

  function executeAction(actionId: string): boolean {
    const action = getActionById(actionId)
    if (!action) {
      toast.showError(`Действие не найдено: ${actionId}`)
      return false
    }

    const reason = getCanExecuteReason(actionId)
    if (reason) {
      toast.showError(reason)
      return false
    }

    walletStore.spend(action.price)
    timeStore.advanceHours(action.hourCost, { actionType: action.actionType as 'work' | 'sleep' | 'default' })
    statsStore.applyStatChanges(action.statChanges ?? {})

    const statBreakdown = action.statChanges
    const message = action.effect || 'Действие выполнено'

    activityStore.addActionEntry(action.title, message, { category: action.category })

    showGameResultModal(action.title, message, {
      statBreakdown: statBreakdown as any,
      hourCost: action.hourCost,
      price: action.price,
    })
    return true
  }

  function getActions(category: ActionCategory): BalanceAction[] {
    const actions = getActionsByCategory(category)
    return filterActionsByAge(actions)
  }

  const allCategories = computed(() => {
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