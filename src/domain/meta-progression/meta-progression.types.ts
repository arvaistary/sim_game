import type { DeathCause } from '@/domain/game-world/life'

export interface NewGamePlusTransfer {
  money: number
  skills: Record<string, number>
}

export interface MetaProgression {
  livesCompleted: number
  newGamePlusCount: number
  totalGameDays: number
  totalGameHours: number
  totalEarnings: number
  totalWorkHours: number
  totalEvents: number
  bestAge: number
  bestScore: number
  deathCauseCounts: Record<DeathCause, number>
  bestSkillLevels: Record<string, number>
  unlockedAchievements: string[]
  revealedKnowledge: string[]
  pendingTransfer: NewGamePlusTransfer
}
