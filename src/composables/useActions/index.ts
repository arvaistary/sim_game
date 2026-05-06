import { getActionsByCategory } from '@domain/balance/actions'
import type {  BalanceAction  } from '@domain/balance/actions'
import type { ActionCategory } from '@domain/balance/types'
import { executeActionWithContext } from '@application/game'
import { canExecuteAction as checkActionAvailability } from '@application/game'
import type {  ActionExecutionResult  } from '@application/game'
import { filterActionsByAge, useAgeRestrictions } from '@composables/useAgeRestrictions'

export interface UseActionsResult {
  canExecute: (actionId: string) => boolean
  getCanExecuteReason: (actionId: string) => string | null
  executeAction: (actionId: string) => ActionExecutionResult
  getActionsByCategory: (category: ActionCategory) => BalanceAction[]
  allCategories: ActionCategory[]
  actionsEmptyHint: string
}

export const useActions = (): UseActionsResult => {
  const timeStore = useTimeStore()
  const statsStore = useStatsStore()
  const walletStore = useWalletStore()
  const skillsStore = useSkillsStore()

  const { ageGroupLabel, ageGroup } = useAgeRestrictions()

  const actionsEmptyHint = computed<string>(
    () =>
      `Для этапа «${ageGroupLabel.value}» сейчас нет доступных действий в этом разделе. Часть активностей откроется в следующих возрастных группах.`,
  )

  function buildContext() {
    return {
      money: walletStore.money,
      weekHoursRemaining: timeStore.weekHoursRemaining,
      currentAge: timeStore.currentAge,
      getSkillLevel: (skill: string) => skillsStore.getSkillLevel(skill),
    }
  }

  function canExecute(actionId: string): boolean {
    return checkActionAvailability(actionId, buildContext()).canExecute
  }

  function getCanExecuteReason(actionId: string): string | null {
    const result = checkActionAvailability(actionId, buildContext())

    return result.canExecute ? null : result.reason ?? null
  }

  function executeAction(actionId: string): ActionExecutionResult {
    const context = buildContext()
    const result = executeActionWithContext(actionId, context)

    if (!result.success) {
      return result
    }

    if (result.effect) {
      const { price, hourCost, actionType, statChanges, skillChanges } = result.effect

      if (price > 0) {
        walletStore.spend(price)
      }

      if (hourCost > 0) {
        timeStore.advanceHours(hourCost, { actionType: actionType as 'work' | 'sleep' | 'default' })
      }

      if (statChanges) {
        statsStore.applyStatChanges(statChanges)
      }

      if (skillChanges) {
        skillsStore.applySkillChanges(skillChanges)
      }
    }

    return result
  }

  function getActions(category: ActionCategory): BalanceAction[] {
    const actions: BalanceAction[] = getActionsByCategory(category)

    return filterActionsByAge(actions, ageGroup.value)
  }

  const allCategories: ActionCategory[] = [
    'shop', 'fun', 'home', 'social', 'education',
    'finance', 'career', 'hobby', 'health', 'selfdev',
  ]

  return {
    canExecute,
    executeAction,
    getActionsByCategory: getActions,
    allCategories,
    actionsEmptyHint: actionsEmptyHint.value,
    getCanExecuteReason,
  }
}