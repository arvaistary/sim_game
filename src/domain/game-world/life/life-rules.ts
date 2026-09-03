import type { LifeDayContext, LifeState, DeathCause } from './life.types'

const LOW_MOOD_THRESHOLD: number = 10
const DEPRESSION_DAYS: number = 30
const OLD_AGE_START: number = 75
const MAX_AGE: number = 90
const OLD_AGE_HEALTH_THRESHOLD: number = 20
const EXHAUSTION_ENERGY_THRESHOLD: number = 5
const EXHAUSTION_STRESS_THRESHOLD: number = 95

/**
 * Создать состояние активной жизни.
 * @description [Domain] - начальное состояние жизненного цикла.
 * @return { LifeState } активная жизнь без накопленного streak
 */
export function createInitialLifeState(): LifeState {
  return { status: 'active', lowMoodDays: 0, deathCause: null, summary: null }
}

/**
 * Определить причину Game Over по текущему состоянию.
 * @description [Domain] - чистая проверка причин смерти; порядок задаёт приоритет причин.
 * @param context состояние персонажа на момент проверки
 * @return { DeathCause | null } причина смерти или null
 */
export function evaluateDeathCause(context: LifeDayContext): DeathCause | null {
  if (context.accidentTriggered === true) return 'accident'

  if (context.health <= 0) return 'illness'

  if (context.mood < LOW_MOOD_THRESHOLD && context.lowMoodDays >= DEPRESSION_DAYS) return 'depression'

  if (context.energy < EXHAUSTION_ENERGY_THRESHOLD && context.stress > EXHAUSTION_STRESS_THRESHOLD) return 'exhaustion'

  if (context.currentAge >= MAX_AGE || (context.currentAge >= OLD_AGE_START && context.health < OLD_AGE_HEALTH_THRESHOLD)) {
    return 'natural_old_age'
  }
  return null
}

/**
 * Обновить дневной streak настроения и завершить жизнь при срабатывании правила.
 * @description [Domain] - чисто возвращает новое состояние без изменения входного объекта.
 * @param state состояние жизненного цикла
 * @param context состояние персонажа после дня
 * @return { LifeState } обновлённое состояние жизни
 */
export function advanceLifeDay(state: LifeState, context: LifeDayContext): LifeState {
  if (state.status === 'ended') return state

  const lowMoodDays: number = context.mood < LOW_MOOD_THRESHOLD ? state.lowMoodDays + 1 : 0
  const deathCause: DeathCause | null = evaluateDeathCause({ ...context, lowMoodDays })

  if (deathCause !== null) {
    return { status: 'ended', lowMoodDays, deathCause, summary: null }
  }

  return { status: 'active', lowMoodDays, deathCause: null, summary: null }
}
