import { computed } from 'vue'
import { useGameStore } from '@/stores/game.store'
import { useToast } from '../useToast'

export function useFinance() {
  const store = useGameStore()
  const toast = useToast()

  const overview = computed(() => {
    void store.worldTick
    return store.getFinanceOverview()
  })

  const investments = computed(() => {
    void store.worldTick
    return store.getInvestments()
  })

  function applyAction(actionData: Record<string, unknown>): boolean {
    if (!store.isInitialized) return false

    const result = store.applyRecoveryAction(actionData)
    if (result) {
      toast.showSuccess(result)
      return true
    }
    return false
  }

  function collectInvestment(portfolioId: string): boolean {
    const result = store.collectInvestment(portfolioId)
    if (!result || result.startsWith('Мир не')) return false
    toast.showSuccess(result)
    return true
  }

  return {
    overview,
    investments,
    applyAction,
    collectInvestment,
  }
}

