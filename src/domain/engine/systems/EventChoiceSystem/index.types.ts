import type { StatChanges } from '@/domain/balance/types'

export interface DelayedEffectDef {
  triggerAge: number
  sourceEventId: string
  description: string
  statChanges?: StatChanges
  skillChanges?: Record<string, number>
  grantTrait?: string
  memoryId?: string
}

export interface RuntimeEventChoice {
  id?: string
  text?: string
  outcome?: string
  statChanges?: StatChanges
  moneyDelta?: number
  skillChanges?: Record<string, number>
  monthlyExpenseDelta?: Record<string, number>
  relationshipDelta?: number
  housingLevelDelta?: number
  delayedEffect?: DelayedEffectDef
  skillCheck?: {
    key: string
    threshold: number
    successStatChanges?: StatChanges
    failStatChanges?: StatChanges
    successMoneyDelta?: number
    failMoneyDelta?: number
  }
}

export interface RuntimeGameEvent {
  id: string
  title?: string
  description?: string
  type?: string
  actionSource?: string
  instanceId?: string
  choices?: RuntimeEventChoice[]
  statImpact?: StatChanges
  chainTag?: string
}

export interface EventChoiceResult {
  success: boolean
  message: string
}

export interface ResolvedChoice extends RuntimeEventChoice {
  outcome: string
  statChanges: StatChanges
  moneyDelta?: number
}
