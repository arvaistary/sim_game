/**
 * Система черт характера и осей личности
 */

export enum PersonalityAxis {
  OPENNESS = 'openness',
  CONSCIENTIOUSNESS = 'conscientiousness',
  EXTRAVERSION = 'extraversion',
  AGREEABLENESS = 'agreeableness',
  NEUROTICISM = 'neuroticism',
}

export interface PersonalityAxisState {
  value: number
  drift: number
  lastUpdateAt: number
}

/** Экземпляр черты на сущности игрока (определение из баланса + runtime-поля). */
export type PersonalityTrait = PersonalityTraitDef & {
  unlocked: boolean
  unlockedAt?: number
}

export interface PersonalityComponent {
  axes: Record<PersonalityAxis, PersonalityAxisState>
  traits: PersonalityTrait[]
  driftSpeed: number
}

export interface PersonalityTraitDef {
  id: string
  name: string
  description: string
  axis: PersonalityAxis
  threshold: number
  modifiers: Partial<Record<string, number>>
  /** Положительные эффекты черты (описание для UI) */
  positiveEffects: string
  /** Отрицательные эффекты черты (описание для UI) */
  negativeEffects: string
  /** Условие получения (описание) */
  acquireCondition: string
  /** Возрастное окно формирования (начало) */
  formAgeStart: number
  /** Возрастное окно формирования (конец) */
  formAgeEnd: number
}
