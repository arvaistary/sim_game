import { computed } from 'vue'
import { useFinanceStore } from '@/stores'

export const useFinance = () => {
  const financeStore = useFinanceStore()

  return {
    investments: computed(() => financeStore.investments),
    monthlyExpenses: computed(() => financeStore.monthlyExpenses),
    lastSettlement: computed(() => financeStore.lastSettlement),
    debt: computed(() => financeStore.debt),
    totalInvestment: computed(() => financeStore.totalInvestment),
    totalExpense: computed(() => financeStore.totalExpense),
    totalDebt: computed(() => financeStore.totalDebt),
    canInvest: financeStore.canInvest,
    invest: financeStore.invest,
    divest: financeStore.divest,
    calculateMonthlyReturn: financeStore.calculateMonthlyReturn,
    processMonthlySettlement: financeStore.processMonthlySettlement,
    setExpense: financeStore.setExpense,
    takeDebt: financeStore.takeDebt,
    repayDebt: financeStore.repayDebt,
    reset: financeStore.reset,
  }
}