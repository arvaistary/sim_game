import type {
  ActionExecutionContext,
  ActionExecutionResult,
  ActionEffectPayload,
} from './index.types'

import type { BalanceAction } from '@domain/balance/actions'

import { getActionById } from '@domain/balance/actions'
import { canExecuteAction } from './queries'

/**
 * @description [Application/Game] - выполняет действие по ID с проверкой контекста
 * @return { ActionExecutionResult } результат выполнения действия
 */
export function executeActionWithContext(
  actionId: string,
  context: ActionExecutionContext
): ActionExecutionResult {
  const action: BalanceAction | null = getActionById(actionId)

  if (!action) {
    return { success: false, message: 'Действие не найдено', canExecute: false, reason: 'Действие не найдено' }
  }

  const canExecuteResult = canExecuteAction(actionId, context)

  if (!canExecuteResult.canExecute) {
    return {
      success: false,
      message: canExecuteResult.reason ?? 'Действие недоступно',
      canExecute: false,
      reason: canExecuteResult.reason,
    }
  }

  const effect: ActionEffectPayload = {
    price: action.price,
    hourCost: action.hourCost,
    actionType: action.actionType,
    statChanges: action.statChanges as Record<string, number> | undefined,
    skillChanges: action.skillChanges as Record<string, number> | undefined,
  }

  return {
    success: true,
    message: action.effect || 'Действие выполнено',
    canExecute: true,
    effect,
  }
}
