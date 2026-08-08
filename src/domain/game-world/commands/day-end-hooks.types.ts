import type { GameWorld } from '@/domain/game-world/GameWorld'

export interface DayEndHooks {
  onDayEnd(world: GameWorld): void
  onWeekEnd(world: GameWorld): void
  onMonthEnd(world: GameWorld): void
  onYearEnd(world: GameWorld): void
  onAgeChanged(world: GameWorld): void
}
