export interface FinanceOverviewDto {
  money: number
  reserveFund: number
  monthlyIncome: number
  monthlyExpenses: number
  emergencyFund: number
  deposits: number[]
}

export interface EventChoiceInput {
  eventId: string
  choiceId: string
}
