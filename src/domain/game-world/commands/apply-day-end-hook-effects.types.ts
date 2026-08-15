import type { GameWorldSnapshot } from '@/domain/game-world/GameWorld.types'

/** Срезы состояния, мутируемые day-end hooks и синхронизируемые в server-mode. */
export interface DayEndHookEffectsPayload {
  dayNumber: number
  events: GameWorldSnapshot['events']
  wallet: GameWorldSnapshot['wallet']
  finance: GameWorldSnapshot['finance']
  career: GameWorldSnapshot['career']
}
