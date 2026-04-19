/**
 * Модель эффективности усвоения знаний
 * 
 * Реализует пороговую модель v1 из education-age-context-plan.md (Раздел 10.4.2)
 * 
 * Принципы:
 * - Не 100% усвоение по умолчанию
 * - Потребности (needs) влияют на эффективность через needsPenaltyMultiplier
 * - Факторы: навыки, анти-гринд, состояние потребностей
 * - Глобальные ограничения: finalEfficiencyMin = 0.35, finalEfficiencyMax = 1.25
 */

/**
 * Состояние потребностей персонажа (нормализовано 0..100)
 * 100 = лучшее состояние, 0 = худшее
 */
export interface NeedsState {
  hunger: number   // 0..100
  energy: number   // 0..100
  mood: number     // 0..100
}

/**
 * Входные данные для расчёта эффективности усвоения
 */
export interface LearningInput {
  /** Базовый эффект действия/шага программы */
  baseEffect: number
  /** Базовая эффективность (обычно 1.0) */
  baseEfficiency: number
  /** Мультипликатор от навыков/статов */
  skillMultiplier: number
  /** Мультипликатор от повторяемости (anti-grind) */
  antiGrindMultiplier: number
  /** Мультипликатор от времени суток и дня недели */
  timeMultiplier: number
  /** Текущее состояние потребностей */
  needs: NeedsState
  /** Является ли это шагом длительной программы */
  isLongProgramStep: boolean
}

/**
 * Результат расчёта эффективности усвоения
 */
export interface LearningResult {
  /** Итоговая эффективность (clamped) */
  finalEfficiency: number
  /** Итоговый эффект с учётом эффективности */
  finalEffect: number
  /** Заблокировано ли действие/шаг */
  blocked: boolean
  /** Коды причин (для telemetry/debug) */
  reasonCodes: string[]
}

/**
 * Глобальные ограничения эффективности
 */
export const FINAL_EFFICIENCY_MIN = 0.35
export const FINAL_EFFICIENCY_MAX = 1.25

/** Базовый расход энергии за длинный шаг программы обучения (множится на finalEfficiency) */
export const EDUCATION_LONG_STEP_ENERGY_BASE = 10

/** Максимально возможный расход энергии за один шаг (для UI-предиката «хватит ли запаса») */
export const EDUCATION_LONG_STEP_MAX_ENERGY_DRAIN = EDUCATION_LONG_STEP_ENERGY_BASE * FINAL_EFFICIENCY_MAX

/** Ниже этого уровня энергии (0–100) занятия по программе считаются истощением */
export const ENERGY_EXHAUSTION_THRESHOLD_STUDY = 20

/**
 * Веса факторов потребностей (сумма = 1.0)
 */
const NEEDS_WEIGHTS = {
  energy: 0.40,
  hunger: 0.35,
  mood: 0.25,
}

/**
 * Пороговые значения для piecewise-штрафов
 */
const NEEDS_THRESHOLDS = {
  EXCELLENT: 70,  // >= 70: без штрафа
  GOOD: 40,       // 40..69: умеренный штраф
  FAIR: 20,       // 20..39: существенный штраф
  POOR: 20,       // < 20: критический штраф
}

/**
 * Значения штрафов для каждого порога
 */
const NEEDS_PENALTIES = {
  EXCELLENT: 1.00,
  GOOD: 0.90,
  FAIR: 0.75,
  POOR: 0.55,
}

/**
 * Критическое значение потребностей для hard-stop
 */
const CRITICAL_NEEDS_THRESHOLD = 10

/**
 * Мягкий cap для критического состояния потребностей (короткие действия)
 */
const CRITICAL_NEEDS_SOFT_CAP = 0.50

/**
 * Преобразовать значение потребности в штраф
 */
function mapNeedToPenalty(value: number): number {
  if (value >= NEEDS_THRESHOLDS.EXCELLENT) return NEEDS_PENALTIES.EXCELLENT
  if (value >= NEEDS_THRESHOLDS.GOOD) return NEEDS_PENALTIES.GOOD
  if (value >= NEEDS_THRESHOLDS.FAIR) return NEEDS_PENALTIES.FAIR
  return NEEDS_PENALTIES.POOR
}

/**
 * Рассчитать эффективность усвоения знаний (v1)
 * 
 * @param input - входные данные для расчёта
 * @returns результат расчёта эффективности
 */
export function calculateLearningEfficiencyV1(input: LearningInput): LearningResult {
  const reasonCodes: string[] = []
  
  // Рассчитать штрафы по каждому фактору потребностей
  const hungerPenalty = mapNeedToPenalty(input.needs.hunger)
  const energyPenalty = mapNeedToPenalty(input.needs.energy)
  const moodPenalty = mapNeedToPenalty(input.needs.mood)

  // Рассчитать взвешенный needs-мультипликатор
  let needsPenaltyMultiplier =
    energyPenalty * NEEDS_WEIGHTS.energy +
    hungerPenalty * NEEDS_WEIGHTS.hunger +
    moodPenalty * NEEDS_WEIGHTS.mood

  // Проверить критическое состояние потребностей
  const criticalNeeds = input.needs.energy < CRITICAL_NEEDS_THRESHOLD || input.needs.hunger < CRITICAL_NEEDS_THRESHOLD
  
  if (criticalNeeds && input.isLongProgramStep) {
    // Hard-stop для длительных программ при критическом состоянии
    return {
      finalEfficiency: 0,
      finalEffect: 0,
      blocked: true,
      reasonCodes: ['critical_needs_state'],
    }
  }

  if (criticalNeeds) {
    // Мягкий cap для коротких действий
    needsPenaltyMultiplier = Math.min(needsPenaltyMultiplier, CRITICAL_NEEDS_SOFT_CAP)
    reasonCodes.push('critical_needs_soft_cap')
  }

  // Добавить коды причин для диагностики
  if (input.needs.energy < NEEDS_THRESHOLDS.GOOD) reasonCodes.push('low_energy_penalty')
  if (input.needs.hunger < NEEDS_THRESHOLDS.GOOD) reasonCodes.push('high_hunger_penalty')
  if (input.needs.mood < NEEDS_THRESHOLDS.GOOD) reasonCodes.push('low_mood_penalty')

  // Рассчитать сырую эффективность
  const rawEfficiency =
    input.baseEfficiency *
    input.skillMultiplier *
    needsPenaltyMultiplier *
    input.antiGrindMultiplier *
    input.timeMultiplier

  // Применить глобальные ограничения
  const finalEfficiency = Math.max(FINAL_EFFICIENCY_MIN, Math.min(FINAL_EFFICIENCY_MAX, rawEfficiency))
  
  // Рассчитать итоговый эффект
  const finalEffect = input.baseEffect * finalEfficiency

  return {
    finalEfficiency,
    finalEffect,
    blocked: false,
    reasonCodes,
  }
}

/**
 * Получить состояние потребностей из компонентов ECS
 */
export function getNeedsStateFromComponents(
  stats: Record<string, number> | null
): NeedsState {
  if (!stats) {
    // Возврат дефолтных значений, если компонент недоступен
    return {
      hunger: 50,
      energy: 50,
      mood: 50,
    }
  }

  // Нормализовать значения в диапазон 0..100
  // Статы игры уже живут в диапазоне 0..100.
  // Для mood/energy больше = лучше, для hunger меньше = лучше.
  
  const normalizeStat = (value: number, isPositive: boolean): number => {
    if (isPositive) {
      return Math.max(0, Math.min(100, value))
    } else {
      return Math.max(0, Math.min(100, 100 - value))
    }
  }

  return {
    hunger: normalizeStat(stats.hunger ?? 0, false),
    energy: normalizeStat(stats.energy ?? 0, true),
    mood: normalizeStat(stats.mood ?? 0, true),
  }
}
