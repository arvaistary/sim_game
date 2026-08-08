import type { DayEndHooks } from './day-end-hooks.types'

export type { DayEndHooks } from './day-end-hooks.types'

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
