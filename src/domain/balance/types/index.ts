/**
 * Типы данных баланса и конфигурации игры
 */

export type StatKey = 'hunger' | 'energy' | 'stress' | 'mood' | 'health' | 'physical'

export interface StatDef {
  key: StatKey
  label: string
  startColor: string
  endColor: string
}

export interface StatChanges {
  hunger?: number
  energy?: number
  stress?: number
  mood?: number
  health?: number
  physical?: number
  [key: string]: number | undefined
}

export interface CareerJob {
  id: string
  name: string
  schedule: string
  level: number
  salaryPerHour: number
  salaryPerDay: number
  salaryPerWeek: number
  requiredHoursPerWeek: number
  minProfessionalism: number
  minEducationRank: number
  minAge: number
}

export interface HousingLevel {
  level: number
  name: string
  baseComfort: number
  monthlyHousingCost: number
  upgradePrice: number
}

export type SkillCategory = 'basic' | 'professional' | 'social' | 'creative'

export interface SkillEffect {
  [effectKey: string]: (level: number) => number
}

export interface SkillMilestone {
  description: string
}

export interface SkillDef {
  key: string
  label: string
  description: string
  category: SkillCategory
  color: number
  maxLevel: number
  effects: SkillEffect
  milestones: Record<number, SkillMilestone>
}

export interface SkillTab {
  id: SkillCategory
  label: string
}

export interface SkillModifiers {
  hungerDrainMultiplier: number
  energyDrainMultiplier: number
  stressGainMultiplier: number
  moodRecoveryMultiplier: number
  healthDecayMultiplier: number
  salaryMultiplier: number
  workEfficiencyMultiplier: number
  shopPriceMultiplier: number
  investmentReturnMultiplier: number
  learningSpeedMultiplier: number
  homeComfortMultiplier: number
  dailyExpenseMultiplier: number
  positiveEventChanceBonus: number
  negativeEventPenaltyReduction: number
  relationshipGainMultiplier: number
  hobbyIncomeMultiplier: number
  passiveIncomeBonus: number
  maxEnergyBonus: number
  agingSpeedMultiplier: number
  foodRecoveryMultiplier: number
  promotionChanceBonus: number
  allRecoveryMultiplier: number
  healthRecoveryMultiplier: number
  eventChoiceHintBonus: number
  autoRecoveryWeekly: number
}

export interface EducationProgram {
  id: string
  title: string
  subtitle: string
  typeLabel: string
  cost: number
  daysRequired: number
  hoursRequired: number
  accentKey: string
  rewardText: string
  completionStatChanges?: StatChanges
  completionSkillChanges?: Record<string, number>
  salaryMultiplierDelta?: number
  educationLevel?: string
}

export interface EducationPathResult {
  educationLevel: string
  skills: Record<string, number>
  startAge: number
}

export interface EducationPath {
  id: string
  label: string
  description: string
  result: EducationPathResult
}

export type EducationRank = -1 | 0 | 1 | 2

export interface RecoveryCard {
  title: string
  price: number
  dayCost: number
  hourCost: number
  effect: string
  mood: string
  statChanges?: StatChanges
  skillChanges?: Record<string, number>
  housingComfortDelta?: number
  furnitureId?: string
  housingUpgradeLevel?: number
  salaryMultiplierDelta?: number
  educationLevel?: string
}

export interface RecoveryTab {
  id: string
  label: string
  icon: string
  accentKey: string
  title: string
  subtitle: string
  cards: RecoveryCard[]
}

export interface WorkResultTier {
  minClicks: number
  grade: string
  description: string
  color: string
  salaryMultiplier: number
  statChanges: StatChanges
}

export interface SkillCheck {
  key: string
  threshold: number
  successStatChanges: StatChanges
  failStatChanges: StatChanges
  failMoneyDelta: number
}

export interface MicroEventChoice {
  label: string
  outcome: string
  skillCheck?: SkillCheck
  moneyDelta?: number
  statChanges?: StatChanges
}

export interface MicroEvent {
  id: string
  baseChance: number
  title: string
  description: string
  statImpact?: StatChanges
}

export interface PeriodicEventChoice {
  label: string
  description: string
  statChanges: StatChanges
  moneyDelta?: number
  skillChanges?: Record<string, number>
}

export interface PeriodicEvent {
  id: string
  title: string
  description: string
  frequency: 'weekly' | 'monthly' | 'yearly'
  choices: PeriodicEventChoice[]
}

export interface WorkPeriodEvent {
  id: string
  title: string
  description: string
  choices: PeriodicEventChoice[]
}

export interface LegacyFinanceAction {
  id: string
  title: string
  subtitle: string
  amount: number
  reserveDelta?: number
  expectedReturn?: number
  durationDays?: number
  dayCost: number
  hourCost: number
  statChanges: StatChanges
  skillChanges?: Record<string, number>
  monthlyExpenseDelta?: Record<string, number>
  accentKey: string
  description: string
}

export interface HourlyRateSet {
  hunger: number
  energy: number
  stress: number
  mood: number
  health: number
  physical: number
}

export interface BalanceConstants {
  HOURS_PER_DAY: number
  HOURS_PER_WEEK: number
  SLEEP_HOURS_RECOMMENDED: number
  SLEEP_HOURS_MINIMUM: number
  WORK_HOURS_STANDARD: number
  AGE_PENALTY_START: number
  AGE_PENALTY_RATE: number
  MODIFIER_MIN: number
  MODIFIER_MAX: number
}

export interface SleepDebtPenalty {
  energyPenalty: number
  stressPenalty: number
  efficiencyPenalty: number
}

export type ActionCategory = 'shop' | 'fun' | 'home' | 'social' | 'education' | 'finance' | 'career' | 'hobby' | 'health' | 'selfdev'

export interface ActionCategoryDef {
  id: ActionCategory
  label: string
  icon: string
}

export interface GameAction {
  id: string
  title: string
  description: string
  category: ActionCategory
  dayCost: number
  hourCost: number
  moneyCost?: number
  statChanges?: StatChanges
  skillChanges?: Record<string, number>
  requirements?: {
    minAge?: number
    minSkillLevel?: Record<string, number>
    minEducationRank?: number
    housingLevel?: number
  }
  rewards?: {
    money?: number
    statChanges?: StatChanges
    skillChanges?: Record<string, number>
  }
}

export interface NavItem {
  id: string
  icon: string
  label: string
}

export type * from '../actions/types'
