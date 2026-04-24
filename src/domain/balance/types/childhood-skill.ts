/**
 * Детский навык — прокачивается только в определённом возрасте.
 * Если навык не развит до конца возрастного окна — его потолок навсегда снижен.
 *
 * Ключевое правило: навык не прокачанный до определённого возраста
 * можно довести максимум до 70%, но никогда до 100%.
 */

/**
 * Определение детского навыка с привязкой к возрастному окну
 */
export interface ChildhoodSkillDef {
  /** Уникальный ключ (совпадает с ключом в общем SkillDef) */
  key: string
  /** Название навыка */
  label: string
  /** Лучший возраст для прокачки (начало, включительно) */
  bestAgeStart: number
  /** Лучший возраст для прокачки (конец, включительно) */
  bestAgeEnd: number
  /** Максимальный потолок если прокачан в лучшем возрасте (всегда 1.0) */
  maxPotential: 1.0
  /** Описание эффекта на взрослую жизнь */
  adultBenefit: string
}

/**
 * Таблица штрафа за запоздалое развитие навыка.
 * Если навык впервые затронут после «лучшего возраста» —
 * максимальный уровень навсегда ограничен.
 *
 * @example
 * // Навык начат в 9 лет → cap = 0.90 (90%)
 * // Навык начат в 14 лет → cap = 0.55 (55%)
 */
export const AGE_SKILL_CAP_TABLE: ReadonlyArray<{
  /** Верхняя граница возраста начала (включительно) */
  maxAge: number
  /** Максимально возможный уровень навыка (0-1) */
  cap: number
}> = [
  { maxAge: 7, cap: 1.00 },
  { maxAge: 10, cap: 0.90 },
  { maxAge: 13, cap: 0.75 },
  { maxAge: 16, cap: 0.55 },
  { maxAge: 18, cap: 0.40 },
  { maxAge: Infinity, cap: 0.30 },
]

/**
 * Вычислить максимальный потолок навыка на основе возраста первого касания.
 *
 * @param firstTouchAge - возраст когда навык впервые начал прокачиваться
 * @returns cap от 0.30 до 1.00
 */
export function getSkillCapByAge(firstTouchAge: number): number {
  for (const entry of AGE_SKILL_CAP_TABLE) {
    if (firstTouchAge <= entry.maxAge) {
      return entry.cap
    }
  }

  return 0.30
}

/**
 * ECS-компонент: состояние детских навыков игрока
 */
export interface ChildhoodSkillsComponent {
  /** Текущий потолок каждого детского навыка (0-1). Ключ = ChildhoodSkillDef.key */
  caps: Record<string, number>
  /** Был ли навык впервые затронут в «лучшем возрасте» */
  touchedInWindow: Record<string, boolean>
  /** Возраст первого касания навыка (null = не начат) */
  firstTouchAge: Record<string, number | null>
}
