import { computed } from 'vue'
import { useGameStore } from '@/stores/game.store'
import { getActionsByCategory, getActionById } from '@/domain/balance/actions'
import { showGameResultModal } from '@/composables/useGameModal'
import { useToast } from '../useToast'
import { useAgeRestrictions } from '@/composables/useAgeRestrictions'
import type { BalanceAction } from '@/domain/balance/actions'
import type { ActionCategory } from '@/domain/balance/types'

export function useActions() {
  const store = useGameStore()
  const toast = useToast()
  const { filterActionsByAge, ageGroupLabel } = useAgeRestrictions()

  /** Подсказка при пустом списке после age-gating и прочих фильтров */
  const actionsEmptyHint = computed(
    () =>
      `Для этапа «${ageGroupLabel.value}» сейчас нет доступных действий в этом разделе. Часть активностей откроется в следующих возрастных группах.`,
  )

  function canExecute(actionId: string): boolean {
    return store.canExecuteAction(actionId).canExecute
  }

  function executeAction(actionId: string): boolean {
    const { canExecute: ok, reason } = store.canExecuteAction(actionId)
    if (!ok) {
      toast.showError(reason ?? `Действие недоступно: ${actionId}`)
      return false
    }

    const result = store.executeAction(actionId)
    const action = getActionById(actionId)
    const title = action?.title ?? 'Действие выполнено'
    if (/не удалось|нельзя|не найден/i.test(result.message)) {
      toast.showError(result.message)
      return false
    }
    const body = result.message.trim() || action?.effect || 'Изменения применены.'
    showGameResultModal(title, body, {
      statBreakdown: result.statBreakdown,
      hourCost: action?.hourCost,
      price: action?.price,
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

