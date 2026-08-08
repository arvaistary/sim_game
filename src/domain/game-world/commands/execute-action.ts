/**
 * domain command: executeAction(world, actionId).
 *
 * Миграция бизнес-логики из src/application/game/commands.ts в domain.
 * ADR-0005, Фаза 2. Signature: (world: GameWorld, params) => CommandResult.
 */
import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { BalanceAction } from '@/domain/balance/actions/types'
import type { StatChanges } from '@/domain/balance/types'
import { getActionById } from '@/domain/balance/actions'
import { calculateStatChanges } from '@/domain/balance/utils/hourly-rates'
import type { DomainActionRequirements, ExecuteActionResult } from './commands.types'
import {
  applySkillChanges,
  applyStatChangesRaw,
  hasSkillLevel,
  spendMoney,
  grantItem,
  recordActionUsage,
  advanceHours,
  addActivityEntry,
} from './mutations'

/**
 * Выполнить игровое действие над миром.
 * @description [Domain] - чистая функция, мутирует world и возвращает result.
 * @param world цель
 * @param actionId идентификатор действия из каталога
 * @return { ExecuteActionResult } результат с breakdown
 */
export function executeActionCommand(world: GameWorld, actionId: string): ExecuteActionResult {
  const action: BalanceAction | null = getActionById(actionId)

  if (!action) {
    return { success: false, message: 'Действие не найдено' }
  }

  if (action.price > 0 && world.wallet.money < action.price) {
    return { success: false, message: 'Недостаточно денег' }
  }

  if (world.time.weekHoursRemaining < action.hourCost) {
    return { success: false, message: 'Недостаточно времени' }
  }

  const requirements: DomainActionRequirements | undefined = (action.requirements ?? undefined) as DomainActionRequirements | undefined

  if (requirements?.minAge && world.player.currentAge < requirements.minAge) {
    return { success: false, message: `Требуется возраст ${requirements.minAge}+` }
  }

  if (requirements?.minSkills) {
    for (const [skill, level] of Object.entries(requirements.minSkills)) {
      if (!hasSkillLevel(world, skill, level)) {
        return { success: false, message: `Требуется навык ${skill} уровня ${level}` }
      }
    }
  }

  if (requirements?.requiresCompletedProgramId) {
    const completedPrograms: Array<{ id: string }> = world.education.completedPrograms ?? []
    const hasCompletedProgram: boolean = completedPrograms.some(program => program.id === requirements.requiresCompletedProgramId)

    if (!hasCompletedProgram) {
      return { success: false, message: 'Сначала завершите книгу «Основы медитации»' }
    }
  }

  let moneySpent: number = 0

  if (action.price > 0) {
    if (!spendMoney(world, action.price)) {
      return { success: false, message: 'Недостаточно денег' }
    }
    moneySpent = action.price
  }

  if (action.hourCost > 0) {
    const isSleep: boolean = action.actionType === 'sleep'
    const isWork: boolean = action.actionType === 'work'
    advanceHours(world, action.hourCost, isSleep ? 'sleep' : isWork ? 'work' : 'default')

    if (isSleep) {
      world.education.studyHoursSinceLastSleep = 0
      world.education.cognitiveLoad = 0
    }
  }

  if (action.statChanges) {
    const perStatModifiers: Record<string, number> = {
      energy: -(world.skills.modifiers.energyDrainMultiplier - 1),
      hunger: -(world.skills.modifiers.hungerDrainMultiplier - 1),
      stress: (world.skills.modifiers.stressGainMultiplier - 1),
      mood: (world.skills.modifiers.moodRecoveryMultiplier - 1),
      health: -(world.skills.modifiers.healthDecayMultiplier - 1),
    }

    const finalStatChanges: StatChanges = calculateStatChanges(
      action.actionType,
      action.hourCost,
      action.statChanges,
      perStatModifiers,
      world.player.currentAge,
      world.time.sleepDebt,
    )

    const finalRawChanges: Record<string, number> = {}
    for (const [key, value] of Object.entries(finalStatChanges)) {
      if (value !== undefined) {
        finalRawChanges[key] = value
      }
    }
    applyStatChangesRaw(world, finalRawChanges)
  }

  if (action.skillChanges) {
    applySkillChanges(world, action.skillChanges)
  }

  if (action.grantsItem) {
    grantItem(world, action.grantsItem)
  }

  addActivityEntry(world, 'action', action.title, action.effect || 'Выполнено', {
    category: action.category,
    amount: -moneySpent,
    hours: action.hourCost,
  })
  recordActionUsage(world, actionId)

  return {
    success: true,
    message: action.effect || 'Выполнено',
    moneySpent,
    hoursSpent: action.hourCost,
  }
}
