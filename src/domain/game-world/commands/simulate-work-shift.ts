/**
 * domain command: simulateWorkShift(world, hours).
 *
 * Миграция бизнес-логики работы из src/application/game/commands.ts в domain.
 * ADR-0005, Фаза 2.
 */
import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { GameWorldSnapshot } from '@/domain/game-world/GameWorld.types'
import type { StatChanges } from '@/domain/balance/types'
import { calculateStatChanges } from '@/domain/balance/utils/hourly-rates'
import type { WorkShiftResult } from './commands.types'
import { applyStatChangesRaw, earnMoney, advanceHours, addWorkActivityEntry } from './mutations'

/**
 * Выполнить рабочую смену над миром.
 * @description [Domain] - мутирует world: карьера, кошелёк, статы, время, activity.
 * @param world цель
 * @param hours длительность смены
 * @return { WorkShiftResult } результат с заработанной суммой
 */
export function simulateWorkShiftCommand(world: GameWorld, hours: number): WorkShiftResult {
  const job: GameWorldSnapshot['career']['currentJob'] = world.career.currentJob

  if (!job.employed) {
    return { success: false, message: 'Нет работы', earnedAmount: 0, hoursWorked: 0 }
  }

  if (!Number.isFinite(hours) || hours <= 0) {
    return { success: false, message: 'Некорректная длительность смены', earnedAmount: 0, hoursWorked: 0 }
  }

  if (world.time.dayHoursRemaining < hours) {
    return { success: false, message: 'Недостаточно времени на сегодня', earnedAmount: 0, hoursWorked: 0 }
  }

  if (world.time.weekHoursRemaining < hours) {
    return { success: false, message: 'Недостаточно времени на неделе', earnedAmount: 0, hoursWorked: 0 }
  }

  const baseSalary: number = hours * (job.salaryPerHour ?? 0)
  const salary: number = Math.round(baseSalary * world.skills.modifiers.salaryMultiplier)

  job.workedHoursCurrentWeek += hours
  job.totalWorkedHours += hours
  job.daysAtWork += Math.floor(hours / 8)

  earnMoney(world, salary)

  const perStatModifiers: Record<string, number> = {
    energy: -(world.skills.modifiers.energyDrainMultiplier - 1),
    hunger: -(world.skills.modifiers.hungerDrainMultiplier - 1),
    stress: (world.skills.modifiers.stressGainMultiplier - 1),
  }
  const workStatChanges: StatChanges = calculateStatChanges(
    'work',
    hours,
    { energy: -(hours * 3), hunger: +(hours * 2) },
    perStatModifiers,
    world.player.currentAge,
    world.time.sleepDebt,
  )
  const workRawChanges: Record<string, number> = {}
  for (const [key, value] of Object.entries(workStatChanges)) {
    if (value !== undefined) {
      workRawChanges[key] = value
    }
  }
  applyStatChangesRaw(world, workRawChanges)

  advanceHours(world, hours, 'work')
  addWorkActivityEntry(world, 'Работа', hours, salary)

  return {
    success: true,
    message: `Вы заработали ${salary} ₽`,
    earnedAmount: salary,
    hoursWorked: hours,
  }
}
