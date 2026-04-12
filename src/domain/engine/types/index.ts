/**
 * TypeScript типы для ECS-архитектуры
 */

export type LegacyComponentKey =
  | 'time'
  | 'stats'
  | 'skills'
  | 'skillModifiers'
  | 'work'
  | 'recovery'
  | 'wallet'
  | 'career'
  | 'education'
  | 'housing'
  | 'furniture'
  | 'finance'
  | 'investment'
  | 'event_queue'
  | 'event_history'
  | 'lifetime_stats'
  | 'relationships'
  | 'subscriptions'
  | 'cooldowns'
  | 'completedActions'
  | 'credits'
  | 'activity_log'

export type CanonicalComponentKey =
  | 'time'
  | 'stats'
  | 'skills'
  | 'skillModifiers'
  | 'work'
  | 'recovery'
  | 'wallet'
  | 'career'
  | 'education'
  | 'housing'
  | 'furniture'
  | 'finance'
  | 'investment'
  | 'eventQueue'
  | 'eventHistory'
  | 'lifetimeStats'
  | 'relationships'
  | 'subscriptions'
  | 'cooldowns'
  | 'completedActions'
  | 'credits'
  | 'activityLog'

export type ComponentKey = LegacyComponentKey | CanonicalComponentKey

export interface Entity {
  id: string
  components: Set<ComponentKey>
}

export interface TimeComponent {
  totalHours: number
  hourOfDay: number
  dayOfWeek: number
  gameDays: number
  gameWeeks: number
  gameMonths: number
  gameYears: number
  currentAge: number
  startAge: number
  weekHoursSpent: number
  weekHoursRemaining: number
  dayHoursSpent: number
  dayHoursRemaining: number
  sleepHoursToday: number
  sleepDebt: number
  eventState: {
    cooldownByEventId: Record<string, number>
    lastWeeklyEventWeek: number
    lastMonthlyEventMonth: number
    lastYearlyEventYear: number
    jobRehireBlockedUntilWeekByJobId?: Record<string, number>
  }
}

export interface StatsComponent {
  hunger: number
  energy: number
  stress: number
  mood: number
  health: number
  physical: number
}

export interface SkillEntry {
  level: number
  xp: number
}

export interface SkillsComponent {
  [skillKey: string]: SkillEntry
}

export interface SkillModifiersComponent {
  [skillKey: string]: number
}

export interface WorkComponent {
  id: string | null
  name: string
  schedule: string
  employed: boolean
  level: number
  salaryPerHour: number
  salaryPerDay: number
  salaryPerWeek: number
  requiredHoursPerWeek: number
  workedHoursCurrentWeek: number
  pendingSalaryWeek: number
  totalWorkedHours: number
  daysAtWork: number
}

export interface WalletComponent {
  money: number
  reserveFund: number
  monthlyExpenses: number
  monthlyIncome: number
  totalEarnings: number
  totalSpent: number
}

export interface CareerComponent {
  id: string | null
  name: string
  schedule: string
  employed: boolean
  level: number
  salaryPerHour: number
  salaryPerDay: number
  salaryPerWeek: number
  requiredHoursPerWeek: number
  workedHoursCurrentWeek: number
  pendingSalaryWeek: number
  totalWorkedHours: number
  daysAtWork: number
  careerLevel: number
  currentJob: RuntimeJobSnapshot | null
  jobHistory: unknown[]
}

export interface RuntimeJobSnapshot {
  id: string | null
  name: string
  schedule: string
  employed: boolean
  level: number
  salaryPerHour: number
  salaryPerDay: number
  salaryPerWeek: number
  requiredHoursPerWeek: number
  workedHoursCurrentWeek: number
  pendingSalaryWeek: number
  totalWorkedHours: number
  daysAtWork: number
}

export type JobData = RuntimeJobSnapshot

export interface EducationComponent {
  school: string
  institute: string
  educationLevel: string
  activeCourses: unknown[]
}

export interface HousingComponent {
  level: number
  name: string
  comfort: number
  furniture: unknown[]
  lastWeeklyBonus: number | null
}

export interface FurnitureComponent {
  items: Array<{
    id: string
    name: string
    comfortBonus: number
    purchased: boolean
  }>
}

export interface FinanceComponent {
  reserveFund: number
  monthlyExpenses: Record<string, number>
  lastMonthlySettlement: number | null
}

export interface InvestmentComponent {
  portfolios: InvestmentPortfolio[]
}

export interface InvestmentPortfolio {
  id: string
  type: string
  amount: number
  returnRate: number
  startDate: number
}

export interface EventQueueItem {
  id: string
  type: string
  title: string
  description: string
  choices?: EventChoice[]
  data?: Record<string, unknown>
  day: number
}

export interface EventChoice {
  id: string
  text: string
  effects: Record<string, number>
}

export interface EventQueueComponent {
  queue: EventQueueItem[]
  currentEvent: EventQueueItem | null
}

export interface EventHistoryEntry {
  eventId: string
  day: number
  choiceId?: string
  effects?: Record<string, number>
}

export interface EventHistoryComponent {
  events: unknown[]
  totalEvents?: number
}

export interface LifetimeStatsComponent {
  totalWorkDays: number
  totalWorkHours: number
  totalEvents: number
  totalMicroEvents: number
  maxMoney: number
  [key: string]: number
}

export interface RelationshipsComponent {
  friends: Array<{ name: string; level: number }>
  partner: { name: string; level: number } | null
}

export interface SubscriptionComponent {
  active: Array<{
    id: string
    name: string
    costPerMonth: number
    startDay: number
  }>
}

export interface CooldownComponent {
  [actionId: string]: number
}

export interface CompletedActionsComponent {
  today: string[]
  history: Array<{ day: number; actions: string[] }>
}

export interface CreditComponent {
  active: Array<{
    id: string
    amount: number
    remaining: number
    monthlyPayment: number
    startDay: number
    endDay: number
  }>
}

export interface ActivityLogEntry {
  id: number
  type: string
  category: string | null
  title: string
  description: string
  icon: string | null
  timestamp: {
    day: number
    week: number
    month: number
    year: number
    hour: number
    totalHours: number
    age: number
  }
  metadata: Record<string, unknown>
  createdAt: number
}

export interface ActivityLogComponent {
  entries: ActivityLogEntry[]
  totalEntries: number
}

export interface ComponentDataMap {
  time: TimeComponent
  stats: StatsComponent
  skills: SkillsComponent
  skillModifiers: SkillModifiersComponent
  work: WorkComponent
  recovery: Record<string, unknown>
  wallet: WalletComponent
  career: CareerComponent
  education: EducationComponent
  housing: HousingComponent
  furniture: FurnitureComponent
  finance: FinanceComponent
  investment: InvestmentComponent
  event_queue: EventQueueComponent | { pendingEvents?: unknown[] }
  eventQueue: EventQueueComponent | { pendingEvents?: unknown[] }
  event_history: EventHistoryComponent
  eventHistory: EventHistoryComponent
  lifetime_stats: LifetimeStatsComponent
  lifetimeStats: LifetimeStatsComponent
  relationships: RelationshipsComponent
  subscriptions: SubscriptionComponent
  cooldowns: CooldownComponent
  completedActions: CompletedActionsComponent
  credits: CreditComponent
  activity_log: ActivityLogComponent
  activityLog: ActivityLogComponent
}

export interface GameSystem {
  init?(world: import('../world').GameWorld): void
  update?(world: import('../world').GameWorld, deltaTime: number): void
}

export interface GameEvent {
  type: string
  payload?: unknown
}

export interface GameWorldInterface {
  entities: Map<string, Entity>
  components: Map<string, Map<string, Record<string, unknown>>>
  systems: GameSystem[]
  nextEntityId: number
  eventBus: EventTarget

  createEntity(): string
  destroyEntity(entityId: string): void
  addComponent(entityId: string, componentKey: ComponentKey, data?: Record<string, unknown>): void
  getComponent<T = Record<string, unknown>>(entityId: string, componentKey: string): T | null
  updateComponent(entityId: string, componentKey: string, updates: Record<string, unknown>): void
  removeComponent(entityId: string, componentKey: string): void
  queryEntities(...componentKeys: string[]): string[]
  addSystem(system: GameSystem): void
  getSystem<T extends GameSystem>(name: string): T | undefined
  update(deltaTime: number): void
  emit(event: GameEvent): void
  on(eventType: string, callback: (event: Event) => void): void
  toJSON(): Record<string, unknown>
  fromJSON(data: Record<string, unknown>): void
}
