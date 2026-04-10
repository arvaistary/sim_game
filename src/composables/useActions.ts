import { computed } from 'vue'
import { useGameStore } from '@/stores/game.store'
import { getActionsByCategory, getActionById } from '@/domain/balance/actions'
import { useToast } from './useToast'
import type { BalanceAction } from '@/domain/balance/actions'
import type { ActionCategory } from '@/domain/balance/types'

export function useActions() {
  const store = useGameStore()
  const toast = useToast()

  function canExecute(actionId: string): boolean {
    if (!store.isInitialized) return false

    const action = getActionById(actionId)
    if (!action) return false

    if (action.price > 0 && store.money < action.price) return false

    if (action.statChanges?.energy && action.statChanges.energy < 0) {
      if ((store.energy ?? 0) + action.statChanges.energy < 0) return false
    }

    return true
  }

  function executeAction(actionId: string): boolean {
    if (!canExecute(actionId)) {
      toast.showError(`Действие недоступно: ${actionId}`)
      return false
    }

    const action = getActionById(actionId)
    if (!action) return false

    store.applyRecoveryAction(action as unknown as Record<string, unknown>)
    toast.showSuccess(`Действие выполнено: ${action.title}`)
    return true
  }

  function getActions(category: ActionCategory): BalanceAction[] {
    return getActionsByCategory(category)
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
  }
}

