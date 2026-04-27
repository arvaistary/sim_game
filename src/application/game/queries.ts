import type {
  CanExecuteActionQueryResult,
  CanStartEducationQueryResult,
  FinanceOverviewQueryResult,
  FinanceSnapshotQueryResult,
  MonthlyExpenseEntry,
} from './index.types'

import { getActionById, type BalanceAction } from '@domain/balance/actions'

/**
 * @description [Application/Game] - проверяет, может ли игрок выполнить действие по цене и времени
 * @return { CanExecuteActionQueryResult } результат проверки
 */
export function canExecuteAction(actionId: string, money: number, weekHoursRemaining: number): CanExecuteActionQueryResult {
  const action: BalanceAction | null = getActionById(actionId)

  if (!action) {
    return { canExecute: false, reason: 'Действие не найдено' }
  }

  if (money < action.price) {
    return { canExecute: false, reason: 'Недостаточно денег' }
  }

  if (weekHoursRemaining < action.hourCost) {
    return { canExecute: false, reason: 'Недостаточно времени' }
  }

  return { canExecute: true }
}

/**
 * @description [Application/Game] - проверяет, можно ли начать образовательную программу
 * @return { CanStartEducationQueryResult } результат проверки
 */
export function canStartEducationProgram(hasActiveProgram: boolean): CanStartEducationQueryResult {
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
  investments: unknown[],
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
