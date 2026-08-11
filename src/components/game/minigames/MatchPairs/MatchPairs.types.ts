import type { MinigameResult } from '@/domain/prologue/minigames/minigame.types'

export interface MatchPairDef {
  id: string
  left: string
  right: string
}

export interface MatchCardView {
  id: string
  pairId: string
  label: string
  flipped: boolean
  matched: boolean
}

export interface MatchPairsEmits {
  complete: [result: MinigameResult]
}
