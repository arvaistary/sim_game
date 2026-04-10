import type { ActionSystem } from '@/domain/engine/systems/ActionSystem'
import type { ActivityLogSystem } from '@/domain/engine/systems/ActivityLogSystem'
import type { CareerProgressSystem } from '@/domain/engine/systems/CareerProgressSystem'
import type { EducationSystem } from '@/domain/engine/systems/EducationSystem'
import type { EventChoiceSystem } from '@/domain/engine/systems/EventChoiceSystem'
import type { EventQueueSystem } from '@/domain/engine/systems/EventQueueSystem'
import type { FinanceActionSystem } from '@/domain/engine/systems/FinanceActionSystem'
import type { InvestmentSystem } from '@/domain/engine/systems/InvestmentSystem'
import type { MonthlySettlementSystem } from '@/domain/engine/systems/MonthlySettlementSystem'
import type { RecoverySystem } from '@/domain/engine/systems/RecoverySystem'
import type { TimeSystem } from '@/domain/engine/systems/TimeSystem'
import type { WorkPeriodSystem } from '@/domain/engine/systems/WorkPeriodSystem'
import type { GameWorld } from '@/domain/engine/world'

export type AnyRecord = Record<string, unknown>

export interface SystemContext {
  world: GameWorld
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
