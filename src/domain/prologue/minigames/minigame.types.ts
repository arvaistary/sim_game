/** Результат мини-игры (общий контракт). */
export interface MinigameResult {
  minigameId: string
  successTier: 'fail' | 'ok' | 'great'
  score01: number
}
