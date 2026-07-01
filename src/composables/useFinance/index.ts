import type { ComputedRef } from 'vue'
import type { InvestmentOverview, UseFinanceReturn, InvestmentType } from './useFinance.types'
import type { Investment } from '@/stores/finance-store/finance-store.types'

/**
 * Composable для управления финансами
 * @description Provides financial management functions and computed properties
 * @return { UseFinanceReturn } Financial management functions and state
 */
export function useFinance(): UseFinanceReturn {
  const walletStore = useWalletStore()

  const financeStore = useFinanceStore()

  const toast = useToast()

  const overview: ComputedRef<InvestmentOverview> = computed<InvestmentOverview>(() => {
    return {
      balance: walletStore.money,
      expenses: financeStore.totalExpense,
      income: walletStore.totalEarned,
    }
  })

  const investments: ComputedRef<Investment[]> = computed<Investment[]>(() => {
    return financeStore.investments
  })

  function applyAction(actionData: Record<string, unknown>): boolean {
    const actionType: string = actionData.type as string

    if (actionType === 'invest') {
      const amount: number = actionData.amount as number
      const returnRate: number = actionData.returnRate as number ?? 5
      const type: InvestmentType = actionData.investmentType as InvestmentType ?? 'deposit'
      const success: boolean = financeStore.invest(type, amount, returnRate)
      if (success) {
        toast.showSuccess(`Инвестиция ${amount}₽ успешна`)
      }
      return success
    }

    if (actionType === 'take_debt') {
      const amount: number = actionData.amount as number
      financeStore.takeDebt(amount)
      toast.showSuccess(`Кредит на ${amount}₽ получен`)
      return true
    }

    if (actionType === 'repay_debt') {
      const amount: number = actionData.amount as number
      financeStore.repayDebt(amount)
      toast.showSuccess(`Долг погашен на ${amount}₽`)
      return true
    }

    return false
  }

  function collectInvestment(portfolioId: string): boolean {
    const amount: number = financeStore.divest(portfolioId)
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