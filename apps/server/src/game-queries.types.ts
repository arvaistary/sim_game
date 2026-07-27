import type { GameWorld } from '@/domain/game-world/GameWorld'

export interface StandaloneFinanceOverview {
  balance: number
  expenses: number
  income: number
}

export type StandaloneInvestments = GameWorld['finance']['investments']
