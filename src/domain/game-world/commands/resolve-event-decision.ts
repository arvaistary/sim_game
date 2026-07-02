/**
 * domain command: resolveEventDecision(world, event, choiceId).
 *
 * Миграция бизнес-логики обработки выбора события из src/application/game/commands.ts в domain.
 * ADR-0005, Фаза 2.
 *
 * Внимание: команда принимает event payload параметром (не читает из events-store),
 * потому что currentEvent — это UI concern и хранится в events-store. SPAExecutor
 * (Фаза 4) поставляет currentEvent в эту команду.
 */
import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { EventChoicePayload, GameEventPayload, ResolveEventResult } from './commands.types'
import { applyStatChangesRaw, addEventActivityEntry } from './mutations'

/**
 * Применить выбор события к миру.
 * @description [Domain] - мутирует world: статы, activity log, lifetime счётчики.
 * @param world цель
 * @param event событие (payload с choices)
 * @param choiceId идентификатор выбранного варианта
 * @return { ResolveEventResult } результат с текстом выбора
 */
export function resolveEventDecisionCommand(
  world: GameWorld,
  event: GameEventPayload | null,
  choiceId: string,
): ResolveEventResult {
  if (!event) {
    return { success: false, message: 'Нет события' }
  }

  const choice: EventChoicePayload | undefined = event.choices?.find(
    (c: EventChoicePayload) => c.id === choiceId,
  )

  if (!choice) {
    return { success: false, message: 'Выбор не найден' }
  }

  if (choice.effects) {
    applyStatChangesRaw(world, choice.effects)
  }

  addEventActivityEntry(world, event.title, choice.text, choice.outcome)

  return {
    success: true,
    message: choice.outcome || 'Выбор применён',
    choiceText: choice.text,
    outcome: choice.outcome,
  }
}
