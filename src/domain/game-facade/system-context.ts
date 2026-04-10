import { PLAYER_ENTITY } from '@/domain/ecs/components'
import { ActionSystem } from '@/domain/ecs/systems/ActionSystem'
import { ActivityLogSystem } from '@/domain/ecs/systems/ActivityLogSystem'
import { CareerProgressSystem } from '@/domain/ecs/systems/CareerProgressSystem'
import { EducationSystem } from '@/domain/ecs/systems/EducationSystem'
import { EventChoiceSystem } from '@/domain/ecs/systems/EventChoiceSystem'
import { EventQueueSystem } from '@/domain/ecs/systems/EventQueueSystem'
import { FinanceActionSystem } from '@/domain/ecs/systems/FinanceActionSystem'
import { InvestmentSystem } from '@/domain/ecs/systems/InvestmentSystem'
import { MonthlySettlementSystem } from '@/domain/ecs/systems/MonthlySettlementSystem'
import { RecoverySystem } from '@/domain/ecs/systems/RecoverySystem'
import { TimeSystem } from '@/domain/ecs/systems/TimeSystem'
import { WorkPeriodSystem } from '@/domain/ecs/systems/WorkPeriodSystem'
import { ECSWorld } from '@/domain/ecs/world'

export const ECS_DOMAIN_EVENT = {
  timeAdvanced: 'ecs:time_advanced',
  recoveryApplied: 'ecs:recovery_applied',
} as const

export interface SystemContext {
  world: ECSWorld
  playerId: string
  action: ActionSystem
  activityLog: ActivityLogSystem
  careerProgress: CareerProgressSystem
  education: EducationSystem
  eventChoice: EventChoiceSystem
  eventQueue: EventQueueSystem
  financeAction: FinanceActionSystem
  investment: InvestmentSystem
  monthlySettlement: MonthlySettlementSystem
  recovery: RecoverySystem
  time: TimeSystem
  workPeriod: WorkPeriodSystem
}

const contextCache = new WeakMap<ECSWorld, SystemContext>()

function initSystem<T extends { init(world: ECSWorld): void }>(system: T, world: ECSWorld): T {
  system.init(world)
  return system
}

export function getSystemContext(world: ECSWorld): SystemContext {
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

export function resetSystemContext(world: ECSWorld): void {
  contextCache.delete(world)
}
