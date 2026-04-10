import { gameCommands } from '@/domain/game-facade/commands'
import { ECSWorld } from '@/domain/ecs/world'

export const appGameCommands = {
  executeLifestyleAction(world: ECSWorld, cardData: Record<string, unknown>): string {
    return gameCommands.applyRecoveryAction(world, cardData)
  },
  simulateWorkShift(world: ECSWorld, hours: number): string {
    return gameCommands.applyWorkShift(world, hours)
  },
  startEducationProgram(world: ECSWorld, programId: string): string {
    return gameCommands.startEducationProgram(world, programId)
  },
  advanceEducation(world: ECSWorld): string {
    return gameCommands.advanceEducation(world)
  },
  executeFinanceDecision(world: ECSWorld, actionId: string): string {
    return gameCommands.applyFinanceAction(world, actionId)
  },
  executeAction(world: ECSWorld, actionId: string): string {
    return gameCommands.executeAction(world, actionId)
  },
  resolveEventDecision(world: ECSWorld, eventId: string, choiceId: string): string {
    return gameCommands.applyEventChoice(world, eventId, choiceId)
  },
  collectInvestment(world: ECSWorld, investmentId: string): string {
    return gameCommands.collectInvestment(world, investmentId)
  },
  advanceTime(world: ECSWorld, hours: number): void {
    gameCommands.advanceTime(world, hours)
  },
  applyMonthlySettlement(world: ECSWorld): string {
    return gameCommands.applyMonthlySettlement(world)
  },
}
