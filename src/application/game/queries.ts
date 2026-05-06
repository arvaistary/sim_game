import type { InvestmentSnapshot, MonthlyExpenseEntry } from './index.types'
import type { ActionRequirementsInput } from './index.types'
import type { CanExecuteActionQueryResult, CanStartEducationQueryResult, FinanceOverviewQueryResult, FinanceSnapshotQueryResult, ActionInput, ActionExecutionContext } from './index.types'
import { getActionById } from '@domain/balance/actions'
import type {  BalanceAction  } from '@domain/balance/actions'
function validateActionRequirements(
  requirements: ActionRequirementsInput | undefined,
  context: ActionExecutionContext
): string | null {
  if (!requirements) return null

  if (requirements.minAge !== undefined && context.currentAge < requirements.minAge) {
    return `Требуется возраст ${requirements.minAge}+`
  }

  if (requirements.minSkills) {
    for (const [skill, level] of Object.entries(requirements.minSkills)) {
      if (context.getSkillLevel(skill) < level) {
        return `Требуется навык ${skill} уровня ${level}`
      }
    }
  }

  return null
}

export function canExecuteAction(actionId: string, context: ActionExecutionContext): CanExecuteActionQueryResult {
  const action: BalanceAction | null = getActionById(actionId)

  if (!action) {
    return { canExecute: false, reason: 'Действие не найдено' }
  }

  if (context.money < action.price) {
    return { canExecute: false, reason: 'Недостаточно денег' }
  }

  if (context.weekHoursRemaining < action.hourCost) {
    return { canExecute: false, reason: 'Недостаточно времени' }
  }

  const requirementError = validateActionRequirements(
    action.requirements as ActionRequirementsInput | undefined,
    context
  )

  if (requirementError) {
    return { canExecute: false, reason: requirementError }
  }

  return { canExecute: true }
}

export function canExecuteActionWithAction(action: ActionInput, context: ActionExecutionContext): CanExecuteActionQueryResult {
  if (context.money < action.price) {
    return { canExecute: false, reason: 'Недостаточно денег' }
  }

  if (context.weekHoursRemaining < action.hourCost) {
    return { canExecute: false, reason: 'Недостаточно времени' }
  }

  const requirementError = validateActionRequirements(
    action.requirements,
    context
  )

  if (requirementError) {
    return { canExecute: false, reason: requirementError }
  }

  return { canExecute: true }
}

export function canStartEducationProgram(isEmployed: boolean, hasActiveProgram: boolean): CanStartEducationQueryResult {
  if (isEmployed) {
    return { ok: false, reason: 'Сначала нужно уволиться' }
  }

  if (hasActiveProgram) {
    return { ok: false, reason: 'У вас уже есть активная программа обучения' }
  }

  return { ok: true }
}

/**
 * @description [Application/Game] - формирует обзор финансового состояния
 * @return { FinanceOverviewQueryResult } обзор финансов
 */
export function getFinanceOverview(money: number, totalExpense: number, totalEarned: number): FinanceOverviewQueryResult {
  return {
    balance: money,
    expenses: totalExpense,
    income: totalEarned,
  }
}

/**
 * @description [Application/Game] - формирует снепшот финансового состояния
 * @return { FinanceSnapshotQueryResult } снепшот финансов
 */
export function getFinanceSnapshot(
  money: number,
  reserveFund: number,
  totalEarned: number,
  monthlyExpenses: MonthlyExpenseEntry[],
  investments: InvestmentSnapshot[],
): FinanceSnapshotQueryResult {
  return {
    money,
    reserveFund,
    monthlyIncome: totalEarned,
    monthlyExpenses: monthlyExpenses.reduce(
      (acc: Record<string, number>, expense: { category: string; amount: number }) => {
        acc[expense.category] = expense.amount

        return acc
      },
      {},
    ),
    emergencyFund: reserveFund,
    deposits: [],
    portfolios: investments,
  }
}

export interface InvestmentInfo {
  id: string
  type: string
  amount: number
  returnRate: number
  monthlyReturn: number
  startDate: number
}

export function getInvestmentsOverview(
  investments: { id: string; type: string; amount: number; returnRate: number; startDate: number }[]
): InvestmentInfo[] {
  return investments.map(inv => ({
    ...inv,
    monthlyReturn: Math.round(inv.amount * (inv.returnRate / 100 / 12)),
  }))
}

export function getTotalMonthlyInvestmentReturn(
  investments: { amount: number; returnRate: number }[]
): number {
  return investments.reduce((sum, inv) => {
    return sum + Math.round(inv.amount * (inv.returnRate / 100 / 12))
  }, 0)
}
