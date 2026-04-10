import { PLAYER_ENTITY } from '@/domain/engine/components'
import { ActionSystem } from '@/domain/engine/systems/ActionSystem'
import { ActivityLogSystem } from '@/domain/engine/systems/ActivityLogSystem'
import { CareerProgressSystem } from '@/domain/engine/systems/CareerProgressSystem'
import { EducationSystem } from '@/domain/engine/systems/EducationSystem'
import { EventChoiceSystem } from '@/domain/engine/systems/EventChoiceSystem'
import { EventQueueSystem } from '@/domain/engine/systems/EventQueueSystem'
import { FinanceActionSystem } from '@/domain/engine/systems/FinanceActionSystem'
import { InvestmentSystem } from '@/domain/engine/systems/InvestmentSystem'
import { MonthlySettlementSystem } from '@/domain/engine/systems/MonthlySettlementSystem'
import { RecoverySystem } from '@/domain/engine/systems/RecoverySystem'
import { TimeSystem } from '@/domain/engine/systems/TimeSystem'
import { WorkPeriodSystem } from '@/domain/engine/systems/WorkPeriodSystem'
import { GameWorld } from '@/domain/engine/world'
import type { SystemContext } from '@/domain/game-facade/index.types'

// Re-export for backward compatibility
export { GAME_DOMAIN_EVENT } from '@/domain/game-facade/index.constants'
export type { SystemContext, AnyRecord } from '@/domain/game-facade/index.types'

const contextCache = new WeakMap<GameWorld, SystemContext>()

function initSystem<T extends { init(world: GameWorld): void }>(system: T, world: GameWorld): T {
  system.init(world)
  return system
}

export function getSystemContext(world: GameWorld): SystemContext {
  const cached = contextCache.get(world)
  if (cached) {
    return cached
  }

  const context: SystemContext = {
    world,
    playerId: PLAYER_ENTITY,
    action: initSystem(new ActionSystem(), world),
    activityLog: initSystem(new ActivityLogSystem(), world),
    careerProgress: initSystem(new CareerProgressSystem(), world),
    education: initSystem(new EducationSystem(), world),
    eventChoice: initSystem(new EventChoiceSystem(), world),
    eventQueue: initSystem(new EventQueueSystem(), world),
    financeAction: initSystem(new FinanceActionSystem(), world),
    investment: initSystem(new InvestmentSystem(), world),
    monthlySettlement: initSystem(new MonthlySettlementSystem(), world),
    recovery: initSystem(new RecoverySystem(), world),
    time: initSystem(new TimeSystem(), world),
    workPeriod: initSystem(new WorkPeriodSystem(), world),
  }

  contextCache.set(world, context)
  return context
}

export function resetSystemContext(world: GameWorld): void {
  contextCache.delete(world)
}
