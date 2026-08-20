import type { DayRhythm, DayRhythmInput } from './DayPlannerSummary.types'

const LOW_ENERGY: number = 30
const LOW_HEALTH: number = 30
const STRAINED_ENERGY: number = 45
const STRAINED_HEALTH: number = 50
const STRAINED_DISPLAYED_STAT: number = 25

function formatHours(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

/**
 * Выбрать короткое описание ритма дня по времени, плану и текущим характеристикам.
 * @description [UI] - переводит состояние плана и персонажа в короткий текстовый оттенок.
 * @return { DayRhythm } состояние и текстовое описание ритма дня
 */
export function getDayRhythm(input: DayRhythmInput): DayRhythm {
  const overrunHours: number = Math.max(0, input.plannedHours - input.availableHours)
  const planShare: number = input.availableHours > 0 ? input.plannedHours / input.availableHours : 1
  const displayedHunger: number = 100 - input.stats.hunger
  const displayedStress: number = 100 - input.stats.stress

  if (overrunHours > 0) {
    return {
      tone: 'overloaded',
      title: 'Ритм перегружен',
      intro: `Плану не хватит ${formatHours(overrunHours)} ч — часть дел придётся перенести.`,
      moodIcon: 'hourglass',
    }
  }

  if (input.stats.energy < LOW_ENERGY || input.stats.health < LOW_HEALTH) {
    return {
      tone: 'tired',
      title: 'Ритм восстановления',
      intro: 'Персонаж чувствует усталость — оставь запас времени на сон и спокойные дела.',
      moodIcon: 'moon-sleep',
    }
  }

  if (
    input.stats.energy < STRAINED_ENERGY
    || input.stats.health < STRAINED_HEALTH
    || displayedHunger < STRAINED_DISPLAYED_STAT
    || displayedStress < STRAINED_DISPLAYED_STAT
    || input.stats.mood < STRAINED_DISPLAYED_STAT
    || input.stats.physical < STRAINED_DISPLAYED_STAT
  ) {
    return {
      tone: 'strained',
      title: 'Ритм требует бережности',
      intro: 'Характеристики просели — плотный план может усилить напряжение.',
      moodIcon: 'cloud',
    }
  }

  if (input.plannedHours <= 0) {
    return {
      tone: 'open',
      title: 'Ритм свободный',
      intro: 'Времени много — можно добавить дело по настроению или оставить запас.',
      moodIcon: 'leaf',
    }
  }

  if (input.freeHours <= 2 || planShare >= 0.85) {
    return {
      tone: 'dense',
      title: 'Ритм плотный',
      intro: 'Почти всё время занято — на неожиданности останется мало запаса.',
      moodIcon: 'stopwatch',
    }
  }

  if (planShare >= 0.5) {
    return {
      tone: 'balanced',
      title: 'Ритм собран',
      intro: 'Основные дела помещаются, небольшой запас времени остаётся.',
      moodIcon: 'cloud-sun',
    }
  }

  return {
    tone: 'calm',
    title: 'Ритм спокойный',
    intro: 'Есть место и для дел, и для непредвиденных событий.',
    moodIcon: 'mood-funny',
  }
}
