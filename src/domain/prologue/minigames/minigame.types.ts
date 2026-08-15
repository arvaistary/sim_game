/** Результат мини-игры (общий контракт). */
export interface MinigameResult {
  minigameId: string
  successTier: 'fail' | 'ok' | 'great'
  score01: number
}

export type MinigameId = 'quiz' | 'match-pairs' | 'timed-tap' | 'order-steps'

export interface MinigameDescriptor {
  id: MinigameId
  implemented: boolean
}
