import { PLAYER_ENTITY } from '@/domain/engine/components'
import { ActionSystem } from '@/domain/engine/systems/ActionSystem'
import { ActivityLogSystem } from '@/domain/engine/systems/ActivityLogSystem'
import { CareerProgressSystem } from '@/domain/engine/systems/CareerProgressSystem'
import { ChainResolverSystem } from '@/domain/engine/systems/ChainResolverSystem'
import { DelayedEffectSystem } from '@/domain/engine/systems/DelayedEffectSystem'
import { EducationSystem } from '@/domain/engine/systems/EducationSystem'
import { EventChoiceSystem } from '@/domain/engine/systems/EventChoiceSystem'
import { EventHistorySystem } from '@/domain/engine/systems/EventHistorySystem'
import { EventQueueSystem } from '@/domain/engine/systems/EventQueueSystem'
import { FinanceActionSystem } from '@/domain/engine/systems/FinanceActionSystem'
import { InvestmentSystem } from '@/domain/engine/systems/InvestmentSystem'
import { LifeMemorySystem } from '@/domain/engine/systems/LifeMemorySystem'
import { MonthlySettlementSystem } from '@/domain/engine/systems/MonthlySettlementSystem'
import { PersonalitySystem } from '@/domain/engine/systems/PersonalitySystem'
import { RecoverySystem } from '@/domain/engine/systems/RecoverySystem'
import { SchoolSystem } from '@/domain/engine/systems/SchoolSystem'
import { SkillsSystem } from '@/domain/engine/systems/SkillsSystem'
import { StatsSystem } from '@/domain/engine/systems/StatsSystem'
import { TagsSystem } from '@/domain/engine/systems/TagsSystem'
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

function resolveActivityLogSystem(world: GameWorld): ActivityLogSystem {
  const existing = world.getSystem(ActivityLogSystem)
  if (existing) return existing
  world.addSystem(new ActivityLogSystem())
  const created = world.getSystem(ActivityLogSystem)
  if (created) return created
  return initSystem(new ActivityLogSystem(), world)
}

function resolveTimeSystem(world: GameWorld): TimeSystem {
  const existing = world.getSystem(TimeSystem)
  if (existing) return existing
  world.addSystem(new TimeSystem())
  const created = world.getSystem(TimeSystem)
  if (created) return created
  return initSystem(new TimeSystem(), world)
}

export function getSystemContext(world: GameWorld): SystemContext {
  const cached = contextCache.get(world)
  if (cached) {
    return cached
  }

  const skills = initSystem(new SkillsSystem(), world)
  const stats = initSystem(new StatsSystem(), world)

  const context: SystemContext = {
    world,
    playerId: PLAYER_ENTITY,
    action: initSystem(new ActionSystem(), world),
    activityLog: resolveActivityLogSystem(world),
    careerProgress: initSystem(new CareerProgressSystem(), world),
    chainResolver: initSystem(new ChainResolverSystem(), world),
    delayedEffect: initSystem(new DelayedEffectSystem(), world),
    education: initSystem(new EducationSystem(), world),
    eventChoice: initSystem(new EventChoiceSystem(), world),
    eventHistory: initSystem(new EventHistorySystem(), world),
    eventQueue: initSystem(new EventQueueSystem(), world),
    financeAction: initSystem(new FinanceActionSystem(), world),
    investment: initSystem(new InvestmentSystem(), world),
    lifeMemory: initSystem(new LifeMemorySystem(), world),
    monthlySettlement: initSystem(new MonthlySettlementSystem(), world),
    personality: initSystem(new PersonalitySystem(), world),
    recovery: initSystem(new RecoverySystem(), world),
    school: initSystem(new SchoolSystem(), world),
    skills,
    stats,
    tags: initSystem(new TagsSystem(), world),
    time: resolveTimeSystem(world),
    workPeriod: initSystem(new WorkPeriodSystem(), world),
  }

  context.time.onMonthlyEvent((monthNumber) => context.monthlySettlement.applyMonthlySettlement(monthNumber))
  context.time.onWeeklyEvent((weekNumber) => context.workPeriod.handleWeekRollover(weekNumber))

  contextCache.set(world, context)
  return context
}

export function resetSystemContext(world: GameWorld): void {
  contextCache.delete(world)
}
