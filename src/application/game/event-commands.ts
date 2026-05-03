import type {
  EventChoiceContext,
  EventChoiceResult,
  SkipEventResult,
} from './index.types'

/**
 * @description [Application/Game] - обрабатывает выбор игрока в событии
 * @return { EventChoiceResult } результат выбора
 */
export function processEventChoice(context: EventChoiceContext, choiceId: string): EventChoiceResult {
  if (!context.currentEvent) {
    return { success: false, message: 'Нет активного события', choiceId, choiceText: '' }
  }

  const choice = context.findChoiceById(choiceId)

  if (!choice) {
    return { success: false, message: 'Вариант ответа не найден', choiceId, choiceText: '' }
  }

  return {
    success: true,
    message: 'Выбор сделан',
    choiceId,
    choiceText: choice.text,
    effects: choice.effects,
  }
}

/**
 * @description [Application/Game] - пропускает текущее событие
 * @return { SkipEventResult } результат пропуска
 */
export function skipEvent(currentEvent: { instanceId: string; id: string } | null): SkipEventResult {
  if (!currentEvent) {
    return { success: false }
  }

  return {
    success: true,
    skippedEventId: currentEvent.instanceId,
  }
}
