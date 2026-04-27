import type { SkillModifiers } from '@domain/balance/types'

export interface SkillEffectMapping {
  skillKey: string
  effectKey: string
  calculateValue: (level: number) => number
  description: string
}

export interface GeneratorResultItem {
  skillKey: string
  effectKey: string
  status: 'missing' | 'mismatch' | 'ok'
  expectedValue?: number
  actualValue?: number
}

export interface EffectItem {
  effectKey: string
  modifierKey: keyof SkillModifiers
  value: number
  description: string
}
