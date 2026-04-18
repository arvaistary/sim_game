/**
 * Time-based efficiency modifiers for education
 * Учитывает время суток и день недели для эффективности обучения
 */

import type { RuntimeTimeComponent } from '../TimeSystem/index.types'

/**
 * Периоды дня для эффективности обучения
 */
export enum DayPeriod {
  MORNING = 'MORNING',    // 6-11: базовая эффективность
  DAY = 'DAY',            // 12-17: базовая эффективность
  EVENING = 'EVENING',    // 18-21: небольшое снижение
  NIGHT = 'NIGHT',        // 22-5: значительное снижение
}

/**
 * Модификаторы эффективности по периодам дня
 */
const DAY_PERIOD_MULTIPLIERS: Record<DayPeriod, number> = {
  [DayPeriod.MORNING]: 1.0,
  [DayPeriod.DAY]: 1.0,
  [DayPeriod.EVENING]: 0.85,
  [DayPeriod.NIGHT]: 0.5,
}

/**
 * Получить период дня по часу (0-23)
 */
export function getDayPeriod(hourOfDay: number): DayPeriod {
  const h = ((hourOfDay % 24) + 24) % 24
  
  if (h >= 6 && h < 12) return DayPeriod.MORNING
  if (h >= 12 && h < 18) return DayPeriod.DAY
  if (h >= 18 && h < 22) return DayPeriod.EVENING
  return DayPeriod.NIGHT
}

/**
 * Получить модификатор эффективности по времени суток
 */
export function getTimeOfDayMultiplier(hourOfDay: number): number {
  const period = getDayPeriod(hourOfDay)
  return DAY_PERIOD_MULTIPLIERS[period]
}

/**
 * Проверить, является ли день выходным (суббота=6, воскресенье=7)
 */
export function isWeekend(dayOfWeek: number): boolean {
  return dayOfWeek === 6 || dayOfWeek === 7
}

/**
 * Получить модификатор эффективности по дню недели
 * В выходные эффективность выше (больше свободного времени)
 */
export function getDayOfWeekMultiplier(dayOfWeek: number): number {
  return isWeekend(dayOfWeek) ? 1.1 : 1.0
}

/**
 * Получить описание периода дня для UI
 */
export function getDayPeriodLabel(period: DayPeriod): string {
  const labels: Record<DayPeriod, string> = {
    [DayPeriod.MORNING]: 'Утро',
    [DayPeriod.DAY]: 'День',
    [DayPeriod.EVENING]: 'Вечер',
    [DayPeriod.NIGHT]: 'Ночь',
  }
  return labels[period]
}

/**
 * Получить описание модификатора времени суток для UI
 */
export function getTimeOfDayModifierLabel(hourOfDay: number): string {
  const period = getDayPeriod(hourOfDay)
  const multiplier = DAY_PERIOD_MULTIPLIERS[period]
  
  if (multiplier === 1.0) {
    return `${getDayPeriodLabel(period)}: нормальная эффективность`
  } else if (multiplier < 1.0) {
    return `${getDayPeriodLabel(period)}: эффективность снижена на ${Math.round((1 - multiplier) * 100)}%`
  }
  return `${getDayPeriodLabel(period)}: нормальная эффективность`
}

/**
 * Получить описание модификатора дня недели для UI
 */
export function getDayOfWeekModifierLabel(dayOfWeek: number): string {
  if (isWeekend(dayOfWeek)) {
    return 'Выходной день: эффективность повышена на 10%'
  }
  return 'Будний день: нормальная эффективность'
}

/**
 * Интерфейс для time-based модификаторов
 */
export interface TimeEfficiencyModifiers {
  timeOfDayMultiplier: number
  dayOfWeekMultiplier: number
  combinedMultiplier: number
  timeOfDayLabel: string
  dayOfWeekLabel: string
}

/**
 * Рассчитать все time-based модификаторы эффективности
 */
export function calculateTimeEfficiencyModifiers(
  timeComponent: RuntimeTimeComponent
): TimeEfficiencyModifiers {
  const timeOfDayMultiplier = getTimeOfDayMultiplier(timeComponent.hourOfDay)
  const dayOfWeekMultiplier = getDayOfWeekMultiplier(timeComponent.dayOfWeek)
  const combinedMultiplier = timeOfDayMultiplier * dayOfWeekMultiplier
  
  return {
    timeOfDayMultiplier,
    dayOfWeekMultiplier,
    combinedMultiplier,
    timeOfDayLabel: getTimeOfDayModifierLabel(timeComponent.hourOfDay),
    dayOfWeekLabel: getDayOfWeekModifierLabel(timeComponent.dayOfWeek),
  }
}
