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
import { completePendingEventResolution } from '@/domain/game-world/pending-event'
import {  addEventActivityEntry,
  addMoneyInWorld,
  addSkillXp,
  applyPermanentSalaryMultiplier,
  applyStatChanges,
  applyStatChangesRaw,
  endCareerWork,
  endLife,
  getSkillLevel,
} from './mutations'
import type { StatChanges } from '@/domain/balance/types'

function applyOptionalStatChanges(world: GameWorld, changes?: StatChanges): void {
  if (!changes) return

  applyStatChanges(world, changes)
}

function applyOptionalMoneyDelta(world: GameWorld, amount?: number): void {
  if (amount === undefined) return

  addMoneyInWorld(world, amount)
}

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
  if (world.life.status === 'ended') {
    return { success: false, message: 'Игра завершена' }
  }

  if (!event) {
    return { success: false, message: 'Нет события' }
  }

  const choice: EventChoicePayload | undefined = event.choices?.find(
    (c: EventChoicePayload) => c.id === choiceId,
  )

  if (!choice) {
    return { success: false, message: 'Выбор не найден' }
  }

  applyOptionalStatChanges(world, choice.statChanges)
  applyOptionalMoneyDelta(world, choice.moneyDelta)

  if (choice.skillChanges) {
    for (const [skillKey, skillXp] of Object.entries(choice.skillChanges)) {
      addSkillXp(world, skillKey, skillXp)
    }
  }

  if (choice.skillCheck) {
    const skillLevel: number = getSkillLevel(world, choice.skillCheck.key)
    const isSuccess: boolean = skillLevel >= choice.skillCheck.threshold

    if (isSuccess) {
      applyOptionalStatChanges(world, choice.skillCheck.successStatChanges)
      applyOptionalMoneyDelta(world, choice.skillCheck.successMoneyDelta)
    } else {
      applyOptionalStatChanges(world, choice.skillCheck.failStatChanges)
      applyOptionalMoneyDelta(world, choice.skillCheck.failMoneyDelta)
    }
  }

  if (choice.salaryMultiplier !== undefined) {
    const earnedAmount: number = Number(event.data?.earnedAmount ?? 0)
    const bonusAmount: number = Math.round(earnedAmount * choice.salaryMultiplier)

    addMoneyInWorld(world, bonusAmount)
  }

  if (choice.permanentSalaryMultiplier !== undefined) {
    applyPermanentSalaryMultiplier(world, choice.permanentSalaryMultiplier)
  }

  if (choice.effects) {
    applyStatChangesRaw(world, choice.effects)
  }

  if (event.id === 'job_dismissal') {
    endCareerWork(world)
  }

  addEventActivityEntry(world, event.title, choice.text, choice.outcome)

  completePendingEventResolution(world, event, choiceId, choice.text, choice.effects)

  if (world.stats.health <= 0) {
    endLife(world, 'illness')
  }

  return {    success: true,
    message: choice.outcome || 'Выбор применён',
    choiceText: choice.text,
    outcome: choice.outcome,
  }
}
