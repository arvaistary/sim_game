# Справочник Pinia Stores

**Последнее обновление:** 2 июня 2026
**Технологический стек:** Nuxt 4 + Vue 3 + TypeScript + Pinia

---

## Обзор

Pinia stores в проекте Game Life обеспечивают централизованное управление состоянием приложения. Каждый store отвечает за определённую область состояния и предоставляет реактивные getters и actions для работы с ним.

---

## game.store

**Путь:** `src/stores/game.store.ts`

**Назначение:** Главный хранилище игры, координирующее все подсистемы

### State

```typescript
interface GameState {
  // Инициализация
  isInitialized: boolean

  // Время и возраст
  age: number
  currentAgeGroup: AgeGroup

  // Деньги
  money: number

  // Шкалы стата
  stats: StatsSnapshot

  // Навыки
  skills: SkillSnapshot[]

  // Карьера
  career: CareerSnapshot | null

  // Образование
  education: EducationSnapshot | null

  // Жильё
  housing: HousingSnapshot | null

  // Финансы
  finance: FinanceSnapshot | null

  // События
  eventQueue: EventQueueEntry[]
  eventHistory: EventHistoryEntry[]

  // Активность
  activityLog: ActivityLogEntry[]
}
```

### Getters

- `stats` — статы персонажа
- `time` — текущее время
- `wallet` — кошелёк
- `skills` — навыки персонажа
- `career` — карьера
- `housing` — жильё
- `education` — образование

### Actions

```typescript
// Инициализация
initWorld(saveData: SaveData): void

// Сохранение/загрузка
save(): void
load(): SaveData | null

// Действия
executeAction(actionId: string): void
advanceTime(hours: number): void

// Восстановление
applyRecoveryAction(actionData: BalanceAction): void

// Работа
applyWorkShift(hours: number): void

// Карьера
changeCareer(careerId: string): void

// Образование
startEducationProgram(programId: string): void
advanceEducation(): void

// Финансы
executeFinanceDecision(decisionId: string): void

// События
resolveEventDecision(eventId: string, choiceId: string): void

// Инвестиции
collectInvestment(investmentId: string): void

// Ежемесячный расчёт
applyMonthlySettlement(): void
```

---

## time-store

**Путь:** `src/stores/time-store/index.ts`

**Назначение:** Управление временем игры

### State

```typescript
interface TimeState {
  age: number
  currentAgeGroup: AgeGroup
  currentMonth: number
  currentYear: number
  currentDay: number
}
```

### Actions

```typescript
advanceTime(hours: number): void
incrementMonth(): void
incrementDay(): void
setAge(age: number): void
```

---

## player-store

**Путь:** `src/stores/player-store/index.ts`

**Назначение:** Данные игрока

### State

```typescript
interface PlayerState {
  name: string
  gender: Gender
  personalityTraits: string[]
  lifeMemories: LifeMemory[]
}
```

### Actions

```typescript
setName(name: string): void
setGender(gender: Gender): void
addPersonalityTrait(traitId: string): void
addLifeMemory(memory: LifeMemory): void
```

---

## wallet-store

**Путь:** `src/stores/wallet-store/index.ts`

**Назначение:** Управление деньгами

### State

```typescript
interface WalletState {
  balance: number
  income: number
  expenses: number
}
```

### Actions

```typescript
spend(amount: number): void
earn(amount: number): void
setBalance(amount: number): void
```

---

## career-store

**Путь:** `src/stores/career-store/index.ts`

**Назначение:** Управление карьерой

### State

```typescript
interface CareerState {
  currentJob: CareerJob | null
  careerHistory: CareerHistoryEntry[]
  workExperience: number
  professionalism: number
}
```

### Actions

```typescript
applyForJob(jobId: string): void
changeJob(jobId: string): void
addWorkExperience(hours: number): void
updateProfessionalism(value: number): void
```

---

## education-store

**Путь:** `src/stores/education-store/index.ts`

**Назначение:** Управление образованием

### State

```typescript
interface EducationState {
  activeProgram: EducationProgram | null
  completedPrograms: string[]
  educationProgress: number
  educationRank: EducationRank | null
}
```

### Actions

```typescript
startProgram(programId: string): void
advanceProgress(): void
completeProgram(): void
```

---

## finance-store

**Путь:** `src/stores/finance-store/index.ts`

**Назначение:** Управление финансами

### State

```typescript
interface FinanceState {
  balance: number
  income: number
  expenses: number
  savings: number
  credits: Credit[]
  subscriptions: Subscription[]
  investments: Investment[]
}
```

### Actions

```typescript
addExpense(amount: number): void
addIncome(amount: number): void
takeCredit(amount: number): void
repayCredit(creditId: string, amount: number): void
addSubscription(subscription: Subscription): void
cancelSubscription(subscriptionId: string): void
addInvestment(investment: Investment): void
collectInvestmentReturns(investmentId: string): void
```

---

## housing-store

**Путь:** `src/stores/housing-store/index.ts`

**Назначение:** Управление жильём

### State

```typescript
interface HousingState {
  currentHousing: HousingLevel | null
  furniture: Furniture[]
  rentalContract: RentalContract | null
}
```

### Actions

```typescript
upgradeHousing(): void
downgradeHousing(): void
addFurniture(furniture: Furniture): void
removeFurniture(furnitureId: string): void
setRentalContract(contract: RentalContract): void
```

---

## skills-store

**Путь:** `src/stores/skills-store/index.ts`

**Назначение:** Управление навыками

### State

```typescript
interface SkillsState {
  skills: Skill[]
  skillProgress: Record<string, number>
}
```

### Actions

```typescript
addExperience(skillId: string, amount: number): void
unlockSkill(skillId: string): void
getSkillLevel(skillId: string): number
```

---

## events-store

**Путь:** `src/stores/events-store/index.ts`

**Назначение:** Управление событиями

### State

```typescript
interface EventsState {
  eventQueue: EventQueueEntry[]
  eventHistory: EventHistoryEntry[]
  activeEvent: Event | null
}
```

### Actions

```typescript
queueEvent(event: Event): void
dequeueEvent(): void
resolveEventChoice(eventId: string, choiceId: string): void
addToHistory(event: EventHistoryEntry): void
getHistory(limit?: number): EventHistoryEntry[]
```

---

## actions-store

**Путь:** `src/stores/actions-store/index.ts`

**Назначение:** Управление действиями

### State

```typescript
interface ActionsState {
  lastExecutedAction: string | null
  actionResults: ActionResult[]
  executionHistory: ExecutionHistoryEntry[]
}
```

### Actions

```typescript
trackExecution(actionId: string, result: ActionResult): void
reset(): void
```

---

## activity-store

**Путь:** `src/stores/activity-store/index.ts`

**Назначение:** Управление активностью

### State

```typescript
interface ActivityState {
  activityLog: ActivityLogEntry[]
}
```

### Actions

```typescript
addEntry(entry: ActivityLogEntry): void
getLog(limit?: number): ActivityLogEntry[]
getLogByType(type: ActivityType, limit?: number): ActivityLogEntry[]
```

---

## stats-store

**Путь:** `src/stores/stats-store/index.ts`

**Назначение:** Управление стата персонажа

### State

```typescript
interface StatsState {
  stats: StatsSnapshot
}
```

### Actions

```typescript
updateStat(statName: string, value: number): void
applyStatChanges(changes: StatChanges): void
getStat(statName: string): number
```

---

## Использование stores в компонентах

```vue
<script setup lang="ts">
// Автоимпорт работает благодаря настройке nuxt.config.ts
const gameStore = useGameStore()
const timeStore = useTimeStore()
const walletStore = useWalletStore()

// Доступ к state
const money = walletStore.balance
const age = timeStore.age

// Вызов actions
function handleSpend() {
  walletStore.spend(100)
}

function handleAdvanceTime() {
  timeStore.advanceTime(24)
}
</script>
```

---

## Автоимпорт stores

В `nuxt.config.ts` настроено:

```typescript
imports: {
  dirs: ['stores']
}
```

Это означает, что все stores автоматически доступны в компонентах и composables без явного импорта:

```typescript
// Без импорта — доступно автоматически
const gameStore = useGameStore()
const timeStore = useTimeStore()
```

---

**Последнее обновление:** 2 июня 2026