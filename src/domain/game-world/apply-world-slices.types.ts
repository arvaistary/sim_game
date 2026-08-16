import type { GameWorldSnapshot } from '@/domain/game-world/GameWorld.types'

export interface WorldHookEffectSlices {
  events: GameWorldSnapshot['events']
  wallet: GameWorldSnapshot['wallet']
  finance: GameWorldSnapshot['finance']
  career: GameWorldSnapshot['career']
}
