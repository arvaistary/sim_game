
import type { Investment, MonthlyExpense } from './finance-store.types'

export type { Investment, MonthlyExpense } from './finance-store.types'

export const DEFAULT_EXPENSES: MonthlyExpense[] = [
  { category: 'rent', amount: 15000 },
  { category: 'food', amount: 15000 },
  { category: 'transport', amount: 3000 },
  { category: 'utilities', amount: 3000 },
  { category: 'subscriptions', amount: 2000 },
]

export const useFinanceStore = defineStore('finance', () => {
  const investments: Ref<Investment[]> = ref<Investment[]>([])
  const monthlyExpenses: Ref<MonthlyExpense[]> = ref<MonthlyExpense[]>([...DEFAULT_EXPENSES])
  const lastSettlement: Ref<number | null> = ref<number | null>(null)
  const debt: Ref<number> = ref<number>(0)

  const walletStore = useWalletStore()

  const totalInvestment: ComputedRef<number> = computed(() =>
    investments.value.reduce(
      (sum: number, inv: Investment) => sum + inv.amount,
      0
    )
  )

  const totalExpense: ComputedRef<number> = computed(() =>
    monthlyExpenses.value.reduce(
      (sum: number, exp: MonthlyExpense) => sum + exp.amount,
      0
    )
  )

  const totalDebt: ComputedRef<number> = computed(() => debt.value)

  const canInvest = (amount: number): boolean => walletStore.money >= amount

  const invest = (type: Investment['type'], amount: number, returnRate: number): boolean => {

    if (!canInvest(amount)) return false

    walletStore.spend(amount, false)

    const investment: Investment = {
      id: `inv_${Date.now()}`,
      type,
      amount,
      returnRate,
      startDate: Date.now(),
    }
    investments.value.push(investment)
    return true
  }

  const divest = (investmentId: string): number => {
    const index: number = investments.value.findIndex(
      (inv: Investment) => inv.id === investmentId
    )

    if (index === -1) return 0

    const investment: Investment = investments.value[index]!
    investments.value.splice(index, 1)
    walletStore.earn(investment.amount, false)
    return investment.amount
  }

  const calculateMonthlyReturn = (): number => {
    return investments.value.reduce(
      (sum: number, inv: Investment) => {
        const monthlyReturn: number = inv.amount * (inv.returnRate / 100 / 12)
        return sum + monthlyReturn
      },
      0
    )
  }

  const processMonthlySettlement = (): void => {
    const investmentReturns: number = calculateMonthlyReturn()

    if (investmentReturns > 0) {
      walletStore.earn(Math.round(investmentReturns), true)
    }

    for (const expense of monthlyExpenses.value) {
      walletStore.spend(expense.amount, true)
    }

    lastSettlement.value = Date.now()
  }

  const setExpense = (category: string, amount: number): void => {
    const expense: MonthlyExpense | undefined = monthlyExpenses.value.find(
      (e: MonthlyExpense) => e.category === category
    )

    if (expense) {
      expense.amount = amount
    } else {
      monthlyExpenses.value.push({ category, amount })
    }
  }

  const takeDebt = (amount: number): void => {
    debt.value += amount
    walletStore.earn(amount, true)
  }

  const repayDebt = (amount: number): void => {
    const repay: number = Math.min(amount, debt.value)
    walletStore.spend(repay, true)
    debt.value = Math.max(0, debt.value - repay)
  }

  function reset(): void {
    investments.value = []
    monthlyExpenses.value = [...DEFAULT_EXPENSES]
    lastSettlement.value = null
    debt.value = 0
  }

  function save(): Record<string, unknown> {
    return {
      investments: investments.value,
      monthlyExpenses: monthlyExpenses.value,
      lastSettlement: lastSettlement.value,
      debt: debt.value,
    }
  }

  function load(data: Record<string, unknown>): void {
    if (Array.isArray(data.investments)) investments.value = data.investments as Investment[]

    if (Array.isArray(data.monthlyExpenses)) monthlyExpenses.value = data.monthlyExpenses as MonthlyExpense[]

    if (data.lastSettlement !== undefined) lastSettlement.value = data.lastSettlement as number | null

    if (typeof data.debt === 'number') debt.value = data.debt
  }

  function applyAction(cardData: Record<string, unknown>): boolean {
    const actionType: string = cardData.type as string

    if (actionType === 'invest') {
      const amount: number = cardData.amount as number
      const returnRate: number = (cardData.returnRate as number) ?? 5
      const type: Investment['type'] = (cardData.investmentType as Investment['type']) ?? 'deposit'
      return invest(type, amount, returnRate)
    }

    if (actionType === 'take_debt') {
      const amount: number = cardData.amount as number
      takeDebt(amount)
      return true
    }

    if (actionType === 'repay_debt') {
      const amount: number = cardData.amount as number
      repayDebt(amount)
      return true
    }

    return false
  }

  return {
    investments,
    monthlyExpenses,
    lastSettlement,
    debt,
    totalInvestment,
    totalExpense,
    totalDebt,
    canInvest,
    invest,
    divest,
    calculateMonthlyReturn,
    processMonthlySettlement,
    setExpense,
    takeDebt,
    repayDebt,
    applyAction,
    reset,
    save,
    load,
  }
})
