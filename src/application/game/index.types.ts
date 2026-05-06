import type { GameSessionSnapshot, VersionedSavePayload } from './ports/SaveRepository.types'
export interface ActionRequirementsInput {
  minAge?: number
  minSkills?: Record<string, number>
}

export interface ActionInput {
  id: string
  title: string
  price: number
  hourCost: number
  actionType: string
  statChanges?: Record<string, number>
  skillChanges?: Record<string, number>
  requirements?: ActionRequirementsInput
  category?: string
  effect?: string
}

export interface CareerJobEffect {
  id: string
  name: string
  salaryPerHour: number
  requiredHoursPerWeek: number
  schedule: string
}

export interface ChangeCareerResult {
  success: boolean
  message: string
  job?: CareerJobEffect
}

export interface CanExecuteActionQueryResult {
  canExecute: boolean
  reason?: string
}

export interface CanStartEducationQueryResult {
  ok: boolean
  reason?: string
}

/** Возвращаемый тип для canStartEducationProgram */
export type CanStartEducationProgramReturn = CanStartEducationQueryResult

export interface FinanceOverviewQueryResult {
  balance: number
  expenses: number
  income: number
}

export interface InvestmentSnapshot {
  id: string
  type: string
  amount: number
  returnRate: number
  startDate: number
}

export interface FinanceSnapshotQueryResult {
  money: number
  reserveFund: number
  monthlyIncome: number
  monthlyExpenses: Record<string, number>
  emergencyFund: number
  deposits: number[]
  portfolios: InvestmentSnapshot[]
}

export type {
  SaveRepository,
  GameSessionSnapshot,
  VersionedSavePayload,
} from './ports/SaveRepository.types'

export {
  CURRENT_SAVE_VERSION,
  createSavePayload,
  isVersionedPayload,
  extractSaveData,
} from './ports/SaveRepository.types'

export interface MonthlyExpenseEntry {
  category: string
  amount: number
}

export interface ActionExecutionContext {
  money: number
  weekHoursRemaining: number
  currentAge: number
  getSkillLevel: (skill: string) => number
}

export interface ActionEffectPayload {
  price: number
  hourCost: number
  actionType: string
  statChanges?: Record<string, number>
  skillChanges?: Record<string, number>
}

export interface ActionExecutionResult {
  success: boolean
  message: string
  canExecute: boolean
  reason?: string
  effect?: ActionEffectPayload
}

export interface WorkShiftContext {
  isEmployed: boolean
  energy: number
  weekHoursRemaining: number
  salaryPerHour: number
}

export interface WorkShiftCheckResult {
  canDo: boolean
  reason?: string
}

export interface WorkShiftExecutionResult {
  success: boolean
  message: string
  salary: number
  statChanges: Record<string, number>
  hourCost: number
}

export interface CareerTrackEntry {
  id: string
  name: string
  level: number
  schedule: string
  salaryPerHour: number
  current: boolean
  unlocked: boolean
  missingProfessionalism: number
  educationRequiredLabel: string
}

export interface StartEducationContext {
  isEmployed: boolean
  hasActiveProgram: boolean
  getProgramById?: (programId: string) => { id: string; title: string; hoursRequired: number } | undefined
}

export interface StartEducationResult {
  success: boolean
  message: string
  programId?: string
  programName?: string
  hoursRequired?: number
}

export interface EventChoice {
  id: string
  text: string
  effects?: Record<string, number>
  outcome?: string
}

export interface GameEvent {
  id: string
  instanceId: string
  title: string
  description?: string
  choices?: EventChoice[]
  effects?: Record<string, number>
  probability?: number
  minAge?: number
  maxAge?: number
  tags?: string[]
}

export interface EventChoiceContext {
  currentEvent: GameEvent | null
  findChoiceById: (choiceId: string) => EventChoice | undefined
}

export interface EventChoiceResult {
  success: boolean
  message: string
  choiceId: string
  choiceText: string
  effects?: Record<string, number>
}

export interface SkipEventResult {
  success: boolean
  skippedEventId?: string
}

export interface InvestContext {
  currentMoney: number
}

export interface InvestCheckResult {
  canInvest: boolean
  reason?: string
}

export interface InvestResult {
  success: boolean
  message: string
  investmentId?: string
  amount?: number
}

export interface DivestResult {
  success: boolean
  message: string
  amount: number
}

export interface MonthlySettlementResult {
  success: boolean
  investmentReturns: number
  totalExpenses: number
  netChange: number
}

export interface SaveResult {
  success: boolean
  payload?: VersionedSavePayload
}

export interface LoadResult {
  success: boolean
  data?: GameSessionSnapshot
  isNewGame: boolean
}
