import { gameCommands, type ExecuteActionCommandResult } from '@/domain/game-facade/commands'
import { GameWorld } from '@/domain/engine/world'

export const appGameCommands = {
  executeLifestyleAction(world: GameWorld, cardData: Record<string, unknown>): string {
    return gameCommands.applyRecoveryAction(world, cardData)
  },
  simulateWorkShift(world: GameWorld, hours: number): string {
    return gameCommands.applyWorkShift(world, hours)
  },
  startEducationProgram(world: GameWorld, programId: string): string {
    return gameCommands.startEducationProgram(world, programId)
  },
  advanceEducation(world: GameWorld): string {
    return gameCommands.advanceEducation(world)
  },
  executeFinanceDecision(world: GameWorld, actionId: string): string {
    return gameCommands.applyFinanceAction(world, actionId)
  },
  executeAction(world: GameWorld, actionId: string): ExecuteActionCommandResult {
    return gameCommands.executeAction(world, actionId)
  },
  resolveEventDecision(world: GameWorld, eventId: string, choiceId: string): string {
    return gameCommands.applyEventChoice(world, eventId, choiceId)
  },
  collectInvestment(world: GameWorld, investmentId: string): string {
    return gameCommands.collectInvestment(world, investmentId)
  },
  advanceTime(world: GameWorld, hours: number): void {
    gameCommands.advanceTime(world, hours)
  },
  applyMonthlySettlement(world: GameWorld): string {
    return gameCommands.applyMonthlySettlement(world)
  },
}
