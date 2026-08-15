import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { DayPlanResult } from './commands.types'

export interface AgeChangeContext {
  previousAge: number
  currentAge: number
}

export interface DayEndHooks {
  onDayEnd(world: GameWorld, dayResult: DayPlanResult): void
  onWeekEnd(world: GameWorld): void
  onMonthEnd(world: GameWorld): void
  onYearEnd(world: GameWorld): void
  onAgeChanged(world: GameWorld, context: AgeChangeContext): void
}
