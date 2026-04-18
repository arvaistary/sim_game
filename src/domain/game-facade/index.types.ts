import type { ActionSystem } from '@/domain/engine/systems/ActionSystem'
import type { ActivityLogSystem } from '@/domain/engine/systems/ActivityLogSystem'
import type { CareerProgressSystem } from '@/domain/engine/systems/CareerProgressSystem'
import type { ChainResolverSystem } from '@/domain/engine/systems/ChainResolverSystem'
import type { DelayedEffectSystem } from '@/domain/engine/systems/DelayedEffectSystem'
import type { EducationSystem } from '@/domain/engine/systems/EducationSystem'
import type { EventChoiceSystem } from '@/domain/engine/systems/EventChoiceSystem'
import type { EventHistorySystem } from '@/domain/engine/systems/EventHistorySystem'
import type { EventQueueSystem } from '@/domain/engine/systems/EventQueueSystem'
import type { FinanceActionSystem } from '@/domain/engine/systems/FinanceActionSystem'
import type { InvestmentSystem } from '@/domain/engine/systems/InvestmentSystem'
import type { LifeMemorySystem } from '@/domain/engine/systems/LifeMemorySystem'
import type { MonthlySettlementSystem } from '@/domain/engine/systems/MonthlySettlementSystem'
import type { PersonalitySystem } from '@/domain/engine/systems/PersonalitySystem'
import type { RecoverySystem } from '@/domain/engine/systems/RecoverySystem'
import type { SchoolSystem } from '@/domain/engine/systems/SchoolSystem'
import type { SkillsSystem } from '@/domain/engine/systems/SkillsSystem'
import type { StatsSystem } from '@/domain/engine/systems/StatsSystem'
import type { TagsSystem } from '@/domain/engine/systems/TagsSystem'
import type { TimeSystem } from '@/domain/engine/systems/TimeSystem'
import type { WorkPeriodSystem } from '@/domain/engine/systems/WorkPeriodSystem'
import type { MigrationSystem } from '@/domain/engine/systems/MigrationSystem'
import type { PersistenceSystem } from '@/domain/engine/systems/PersistenceSystem'
import type { GameWorld } from '@/domain/engine/world'

export type AnyRecord = Record<string, unknown>

export interface SystemContext {
  world: GameWorld
  playerId: string
  action: ActionSystem
  activityLog: ActivityLogSystem
  careerProgress: CareerProgressSystem
  chainResolver: ChainResolverSystem
  delayedEffect: DelayedEffectSystem
  education: EducationSystem
  eventChoice: EventChoiceSystem
  eventHistory: EventHistorySystem
  eventQueue: EventQueueSystem
  financeAction: FinanceActionSystem
  investment: InvestmentSystem
  lifeMemory: LifeMemorySystem
  monthlySettlement: MonthlySettlementSystem
  personality: PersonalitySystem
  recovery: RecoverySystem
  school: SchoolSystem
  skills: SkillsSystem
  stats: StatsSystem
  tags: TagsSystem
  time: TimeSystem
  workPeriod: WorkPeriodSystem
  migration: MigrationSystem
  persistence: PersistenceSystem
}
