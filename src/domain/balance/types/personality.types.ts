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
  positiveEffects: string
  negativeEffects: string
  acquireCondition: string
  formAgeStart: number
  formAgeEnd: number
}

export type PersonalityTrait = PersonalityTraitDef & {
  unlocked: boolean
  unlockedAt?: number
}