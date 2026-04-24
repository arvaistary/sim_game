
export interface Investment {
  id: string
  type: 'deposit' | 'stocks' | 'business'
  amount: number
  returnRate: number
  startDate: number
}

export interface MonthlyExpense {
  category: string
  amount: number
}

export const DEFAULT_EXPENSES: MonthlyExpense[] = [
  { category: 'rent', amount: 15000 },
  { category: 'food', amount: 15000 },
  { category: 'transport', amount: 3000 },
  { category: 'utilities', amount: 3000 },
  { category: 'subscriptions', amount: 2000 },
]

export const useFinanceStore = defineStore('finance', () => {
  const investments = ref<Investment[]>([])
  const monthlyExpenses = ref<MonthlyExpense[]>([...DEFAULT_EXPENSES])
  const lastSettlement = ref<number | null>(null)
  const debt = ref(0)

  const walletStore = useWalletStore()

  const totalInvestment = computed(() => 
    investments.value.reduce((sum, inv) => sum + inv.amount, 0)
  )

  const totalExpense = computed(() => 
    monthlyExpenses.value.reduce((sum, exp) => sum + exp.amount, 0)
  )

  const totalDebt = computed(() => debt.value)

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
    const index = investments.value.findIndex(inv => inv.id === investmentId)
    if (index === -1) return 0

    const investment = investments.value[index]
    investments.value.splice(index, 1)
    walletStore.earn(investment.amount, false)
    return investment.amount
  }

  const calculateMonthlyReturn = (): number => {
    return investments.value.reduce((sum, inv) => {
      const monthlyReturn = inv.amount * (inv.returnRate / 100 / 12)
      return sum + monthlyReturn
    }, 0)
  }

  const processMonthlySettlement = (): void => {
    const investmentReturns = calculateMonthlyReturn()
    if (investmentReturns > 0) {
      walletStore.earn(Math.round(investmentReturns), true)
    }

    for (const expense of monthlyExpenses.value) {
      walletStore.spend(expense.amount, true)
    }

    lastSettlement.value = Date.now()
  }

  const setExpense = (category: string, amount: number): void => {
    const expense = monthlyExpenses.value.find(e => e.category === category)
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
    const repay = Math.min(amount, debt.value)
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
    const actionType = cardData.type as string
    if (actionType === 'invest') {
      const amount = cardData.amount as number
      const returnRate = (cardData.returnRate as number) ?? 5
      const type = (cardData.investmentType as 'deposit' | 'stocks' | 'business') ?? 'deposit'
      return invest(type, amount, returnRate)
    }
    if (actionType === 'take_debt') {
      const amount = cardData.amount as number
      takeDebt(amount)
      return true
    }
    if (actionType === 'repay_debt') {
      const amount = cardData.amount as number
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