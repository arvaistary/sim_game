import type { RandomSource } from '@/domain/game-world/random-source.types'
import type { DayEndHooks } from './day-end-hooks.types'
import {
  rollAgeEvents,
  rollMicroEvents,
  rollMonthlyEvents,
  rollWeeklyEvents,
  rollWorkEvent,
  rollYearlyEvents,
} from './event-rolls'

export type { AgeChangeContext, DayEndHooks } from './day-end-hooks.types'

/**
 * Создать набор безопасных no-op хуков завершения дня.
 * @description [Domain] - сохраняет расширяемость planDay без побочных эффектов по умолчанию.
 * @return { DayEndHooks } пустые обработчики границ времени
 */
export function createNoopDayEndHooks(): DayEndHooks {
  return {
    onDayEnd: () => {},
    onWeekEnd: () => {},
    onMonthEnd: () => {},
    onYearEnd: () => {},
    onAgeChanged: () => {},
  }
}

/**
 * Создать live-хуки событийной системы.
 * @description [Domain] - подключает роллы work/micro/week/month/year/age к DayEndHooks.
 * @return { DayEndHooks } обработчики с роллами событий
 */
export function createLiveDayEndHooks(rng: RandomSource): DayEndHooks {
  return {
    shouldTriggerAccident: (_world, crossedYearBoundary) => crossedYearBoundary && rng.next() < 0.015,
    onDayEnd: (world, dayResult) => {
      rollWorkEvent(world, rng, { dayResult })
      rollMicroEvents(world, rng, { dayResult })
    },
    onWeekEnd: (world) => {
      rollWeeklyEvents(world)
    },
    onMonthEnd: (world) => {
      rollMonthlyEvents(world)
    },
    onYearEnd: (world) => {
      rollYearlyEvents(world)
    },
    onAgeChanged: (world, context) => {
      rollAgeEvents(world, rng, context)
    },
  }
}
