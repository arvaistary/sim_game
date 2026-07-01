
import type { Ref, ComputedRef } from 'vue'
import type { CanApplyWorkShiftResult } from '@/stores/game.store.types'
import type { GameAction, ActionResult } from './actions-store.types'

export type { GameAction, ActionResult } from './actions-store.types'

const _ACTION_COOLDOWNS: Record<string, number> = {}

export const useActionsStore = defineStore('actions', () => {
  const lastExecutedAction: Ref<string | null> = ref<string | null>(null)
  const actionResults: Ref<ActionResult[]> = ref<ActionResult[]>([])

  const timeStore = useTimeStore()

  const statsStore = useStatsStore()

  const walletStore = useWalletStore()

  const skillsStore = useSkillsStore()

  const canExecute = (action: GameAction): CanApplyWorkShiftResult => {

    if (action.price > 0 && !walletStore.canAfford(action.price)) {
      return { canDo: false, reason: 'Недостаточно денег' }
    }

    if (action.hourCost > timeStore.weekHoursRemaining) {
      return { canDo: false, reason: 'Недостаточно времени' }
    }

    if (action.requirements?.minAge && timeStore.currentAge < action.requirements.minAge) {
      return { canDo: false, reason: `Требуется возраст ${action.requirements.minAge}+` }
    }

    if (action.requirements?.minSkills) {
      for (const [skill, level] of Object.entries(action.requirements.minSkills)) {
        if (!skillsStore.hasSkillLevel(skill, level)) {
          return { canDo: false, reason: `Требуется навык ${skill} уровня ${level}` }
        }
      }
    }

    return { canDo: true }
  }

  const canExecuteAction = (_actionId: string): CanApplyWorkShiftResult => {
    return { canDo: true }
  }

  const executeAction = (action: GameAction): ActionResult => {
    const check: CanApplyWorkShiftResult = canExecute(action)

    if (!check.canDo) {
      return { success: false, error: check.reason }
    }

    if (action.price > 0) {
      walletStore.spend(action.price, true)
    }

    if (action.statChanges) {
      statsStore.applyStatChangesRaw(action.statChanges)
    }

    if (action.skillChanges) {
      skillsStore.applySkillChanges(action.skillChanges)
    }

    if (action.hourCost > 0) {
      const isSleep: boolean = action.actionType === 'sleep'
      const isWork: boolean = action.actionType === 'work'
      timeStore.advanceHours(action.hourCost, {
        actionType: isSleep ? 'sleep' : isWork ? 'work' : 'default',
      })
    }

    lastExecutedAction.value = action.id
    actionResults.value.push({ success: true, summary: action.title })

    if (actionResults.value.length > 20) {
      actionResults.value = actionResults.value.slice(-20)
    }

    return { success: true }
  }

  const executeActionById = (actionId: string, actions: GameAction[]): ActionResult => {
    const action: GameAction | undefined = actions.find(
      (a: GameAction) => a.id === actionId
    )

    if (!action) {
      return { success: false, error: 'Действие не найдено' }
    }
    return executeAction(action)
  }

  const getActionResult = (index: number): ActionResult | undefined => {
    return actionResults.value[index]
  }

  const lastResult: ComputedRef<ActionResult | undefined> = computed(() => actionResults.value[actionResults.value.length - 1])

  function reset(): void {
    lastExecutedAction.value = null
    actionResults.value = []
  }

  return {
    lastExecutedAction,
    actionResults,
    lastResult,
    canExecute,
    canExecuteAction,
    executeAction,
    executeActionById,
    getActionResult,
    reset,
  }
})
