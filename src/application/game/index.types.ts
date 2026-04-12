export interface FinanceOverviewDto {
  money: number
  reserveFund: number
  monthlyIncome: number
  monthlyExpenses: number
  /** @deprecated No longer sourced from FinanceComponent */
  emergencyFund: number
  /** @deprecated No longer sourced from FinanceComponent */
  deposits: number[]
}

export interface EventChoiceInput {
  eventId: string
  choiceId: string
}
