import { computed } from 'vue'
import { useWalletStore } from '@/stores/wallet-store'
import { useFinanceStore } from '@/stores/finance-store'
import { useToast } from '../useToast'

export function useFinance() {
  const walletStore = useWalletStore()
  const financeStore = useFinanceStore()
  const toast = useToast()

  const overview = computed(() => {
    return {
      balance: walletStore.money,
      expenses: financeStore.totalExpense,
      income: walletStore.totalEarned,
    }
  })

  const investments = computed(() => {
    return financeStore.investments
  })

  function applyAction(actionData: Record<string, unknown>): boolean {
    const actionType = actionData.type as string
    if (actionType === 'invest') {
      const amount = actionData.amount as number
      const returnRate = actionData.returnRate as number ?? 5
      const type = actionData.investmentType as 'deposit' | 'stocks' | 'business' ?? 'deposit'
      const success = financeStore.invest(type, amount, returnRate)
      if (success) {
        toast.showSuccess(`Инвестиция ${amount}₽ успешна`)
      }
      return success
    }
    if (actionType === 'take_debt') {
      const amount = actionData.amount as number
      financeStore.takeDebt(amount)
      toast.showSuccess(`Кредит на ${amount}₽ получен`)
      return true
    }
    if (actionType === 'repay_debt') {
      const amount = actionData.amount as number
      financeStore.repayDebt(amount)
      toast.showSuccess(`Долг погашен на ${amount}₽`)
      return true
    }
    return false
  }

  function collectInvestment(portfolioId: string): boolean {
    const amount = financeStore.divest(portfolioId)
    if (amount > 0) {
      toast.showSuccess(`Получено ${amount}₽ от инвестиции`)
      return true
    }
    return false
  }

  return {
    overview,
    investments,
    applyAction,
    collectInvestment,
  }
}