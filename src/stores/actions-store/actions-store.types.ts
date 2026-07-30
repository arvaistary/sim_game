import type { Ref, ComputedRef } from 'vue'
import type { CanApplyWorkShiftResult } from '@/stores/game.store.types'

export interface GameAction {
  id: string
  title: string
  category: string
  actionType: string
  hourCost: number
  price: number
  statChanges?: Record<string, number>
  skillChanges?: Record<string, number>
  cooldown?: { hours: number }
  requirements?: {
    minAge?: number
    minSkills?: Record<string, number>
    requiresCompletedProgramId?: string
  }
}

export interface ActionResult {
  success: boolean
  error?: string
  summary?: string
}

export interface ActionUsageEntry {
  count: number
  lastUsedAt: number
}

export type { Ref, ComputedRef, CanApplyWorkShiftResult }
