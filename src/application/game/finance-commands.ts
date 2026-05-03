import type {
  InvestContext,
  InvestCheckResult,
  InvestResult,
  DivestResult,
  MonthlySettlementResult,
} from './index.types'

/**
 * @description [Application/Game] - проверяет возможность инвестиции
 * @return { InvestCheckResult } результат проверки
 */
export function checkCanInvest(amount: number, context: InvestContext): InvestCheckResult {
  if (amount <= 0) {
    return { canInvest: false, reason: 'Неверная сумма' }
  }

  if (context.currentMoney < amount) {
    return { canInvest: false, reason: 'Недостаточно средств' }
  }

  return { canInvest: true }
}

/**
 * @description [Application/Game] - создаёт инвестицию заданного типа
 * @return { InvestResult } результат создания инвестиции
 */
export function createInvestment(
  type: 'deposit' | 'stocks' | 'business',
  amount: number,
  returnRate: number
): InvestResult {
  if (amount <= 0) {
    return { success: false, message: 'Неверная сумма инвестиции' }
  }

  return {
    success: true,
    message: `Инвестиция создана: ${amount} ₽ под ${returnRate}%`,
    investmentId: `inv_${Date.now()}`,
    amount,
  }
}

/**
 * @description [Application/Game] - рассчитывает сумму возврата при закрытии инвестиции
 * @return { DivestResult } результат расчёта
 */
export function calculateDivestAmount(investment: { amount: number } | undefined): DivestResult {
  if (!investment) {
    return { success: false, message: 'Инвестиция не найдена', amount: 0 }
  }

  return {
    success: true,
    message: `Получено: ${investment.amount} ₽`,
    amount: investment.amount,
  }
}

/**
 * @description [Application/Game] - рассчитывает ежемесячный финансовый итог
 * @return { MonthlySettlementResult } результат расчёта
 */
export function processMonthlySettlement(
  investments: { amount: number; returnRate: number }[],
  monthlyExpenses: { amount: number }[]
): MonthlySettlementResult {
  const investmentReturns: number = investments.reduce(
    (sum, inv) => {
      return sum + inv.amount * (inv.returnRate / 100 / 12)
    }, 0)

  const totalExpenses: number = monthlyExpenses.reduce(
    (sum, exp) => sum + exp.amount, 0)

  return {
    success: true,
    investmentReturns: Math.round(investmentReturns),
    totalExpenses,
    netChange: Math.round(investmentReturns) - totalExpenses,
  }
}
