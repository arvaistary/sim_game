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
import { MigrationSystem } from '@/domain/engine/systems/MigrationSystem'
import { PersistenceSystem } from '@/domain/engine/systems/PersistenceSystem'
import { GameWorld } from '@/domain/engine/world'
import type { SystemContext } from '@/domain/game-facade/index.types'

// Re-export for backward compatibility
export { GAME_DOMAIN_EVENT } from '@/domain/game-facade/index.constants'
export type { SystemContext, AnyRecord } from '@/domain/game-facade/index.types'

const contextCache = new WeakMap<GameWorld, SystemContext>()

/** Предотвращает повторную регистрацию school-хуков на одном TimeSystem при пересборке контекста */
const schoolTimeLifecycleHooks = new WeakSet<GameWorld>()

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

function resolveSkillsSystem(world: GameWorld): SkillsSystem {
  const existing = world.getSystem(SkillsSystem)
  if (existing) return existing
  world.addSystem(new SkillsSystem())
  const created = world.getSystem(SkillsSystem)
  if (created) return created
  return initSystem(new SkillsSystem(), world)
}

function resolveStatsSystem(world: GameWorld): StatsSystem {
  const existing = world.getSystem(StatsSystem)
  if (existing) return existing
  world.addSystem(new StatsSystem())
  const created = world.getSystem(StatsSystem)
  if (created) return created
  return initSystem(new StatsSystem(), world)
}

function resolveEventQueueSystem(world: GameWorld): EventQueueSystem {
  const existing = world.getSystem(EventQueueSystem)
  if (existing) return existing
  world.addSystem(new EventQueueSystem())
  const created = world.getSystem(EventQueueSystem)
  if (created) return created
  return initSystem(new EventQueueSystem(), world)
}

function resolveTagsSystem(world: GameWorld): TagsSystem {
  const existing = world.getSystem(TagsSystem)
  if (existing) return existing
  world.addSystem(new TagsSystem())
  const created = world.getSystem(TagsSystem)
  if (created) return created
  return initSystem(new TagsSystem(), world)
}

function resolvePersonalitySystem(world: GameWorld): PersonalitySystem {
  const existing = world.getSystem(PersonalitySystem)
  if (existing) return existing
  world.addSystem(new PersonalitySystem())
  return world.getSystem(PersonalitySystem)!
}

export function getSystemContext(world: GameWorld): SystemContext {
  const cached = contextCache.get(world)
  if (cached) {
    return cached
  }

  const skills = resolveSkillsSystem(world)
  const stats = resolveStatsSystem(world)
  const time = resolveTimeSystem(world)
  const eventQueue = resolveEventQueueSystem(world)
  const personality = resolvePersonalitySystem(world)

  const migration = initSystem(new MigrationSystem(), world)
  const persistence = initSystem(new PersistenceSystem(migration), world)

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
    eventQueue,
    financeAction: initSystem(new FinanceActionSystem(), world),
    investment: initSystem(new InvestmentSystem(), world),
    lifeMemory: initSystem(new LifeMemorySystem(), world),
    monthlySettlement: initSystem(new MonthlySettlementSystem(), world),
    personality,
    recovery: initSystem(new RecoverySystem(), world),
    school: initSystem(new SchoolSystem(), world),
    skills,
    stats,
    tags: resolveTagsSystem(world),
    time,
    workPeriod: initSystem(new WorkPeriodSystem(), world),
    migration,
    persistence,
  }

  context.careerProgress.wireFromContext(context)
  context.workPeriod.wireFromContext(context)
  context.school.wireFromContext(context)
  context.eventChoice.wireFromContext(context)

  /**
   * Wiring period hooks для event producers
   *
   * Порядок lifecycle:
   * 1. advanceHours() в TimeSystem
   * 2. Period hooks (onWeeklyEvent, onMonthlyEvent, onYearlyEvent)
   * 3. Event producers enqueue события через EventIngress API
   * 4. Event resolve/log через EventChoiceSystem
   *
   * Period dedup гарантирует, что события не дублируются на границах периодов
   */
  context.time.onMonthlyEvent((monthNumber) => context.monthlySettlement.applyMonthlySettlement(monthNumber))
  context.time.onWeeklyEvent((weekNumber) => context.workPeriod.handleWeekRollover(weekNumber))
  context.time.onYearlyEvent((yearNumber) => {
    contextCache.delete(world)
  })
  context.time.onAgeEvent((_previousAge, _currentAge) => {
    contextCache.delete(world)
  })

  if (!schoolTimeLifecycleHooks.has(world)) {
    schoolTimeLifecycleHooks.add(world)
    context.time.onGameDayOpened((gameDay) => {
      getSystemContext(world).school.processGameDay(gameDay)
    })
    context.time.onAgeEvent((previousAge, currentAge) => {
      getSystemContext(world).school.onPlayerAgeChanged(previousAge, currentAge)
    })
  }

  contextCache.set(world, context)
  return context
}

export function resetSystemContext(world: GameWorld): void {
  contextCache.delete(world)
}
