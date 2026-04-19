/**
 * Модификаторы «времени суток / дня недели» для обучения отключены.
 *
 * В игре ведётся учёт накопленных часов (`totalHours`) и недельного бюджета (`weekHoursRemaining`),
 * но нет сюжетного календаря «утро/вечер» и дней недели как игровых понятий.
 * Поля `hourOfDay` / `dayOfWeek` в компоненте времени — производные от счётчика часов,
 * их нельзя использовать для штрафов к эффективности обучения.
 */

import type { RuntimeTimeComponent } from '../TimeSystem/index.types'

export interface TimeEfficiencyModifiers {
  timeOfDayMultiplier: number
  dayOfWeekMultiplier: number
  combinedMultiplier: number
  timeOfDayLabel: string
  dayOfWeekLabel: string
}

/** Единственный источник множителей для обучения по программе — без псевдо-календаря. */
export function calculateTimeEfficiencyModifiers(
  _timeComponent: RuntimeTimeComponent,
): TimeEfficiencyModifiers {
  return {
    timeOfDayMultiplier: 1,
    dayOfWeekMultiplier: 1,
    combinedMultiplier: 1,
    timeOfDayLabel: '',
    dayOfWeekLabel: '',
  }
}
