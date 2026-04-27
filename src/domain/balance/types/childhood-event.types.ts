import type { StatChanges } from '@domain/balance/types'
import { AgeGroup } from '@domain/balance/actions/types'

export type ChildhoodEventType = 'everyday' | 'formative' | 'fateful'

export interface DelayedConsequence {
  triggerAge?: number
  yearsLater?: number
  description: string
  statChanges?: StatChanges
  skillChanges?: Record<string, number>
  grantTrait?: string
  memoryId?: string
}

export interface ChildhoodEventChoice {
  label: string
  description: string
  statChanges?: StatChanges
  skillChanges?: Record<string, number>
  grantTrait?: string
  delayedConsequences?: DelayedConsequence[]
  requiresSkill?: { key: string; minLevel: number }
  hidden?: boolean
  hiddenCondition?: { skill: string; minLevel: number }
}

export interface ChildhoodEventDef {
  id: string
  title: string
  description: string
  ageGroup: AgeGroup
  type: ChildhoodEventType
  probability: number
  repeatable: boolean
  choices: ChildhoodEventChoice[]
  condition?: string
  chainTag?: string
}