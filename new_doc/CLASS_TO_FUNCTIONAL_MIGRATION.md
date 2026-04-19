# Миграция с классового подхода на функциональный

> **Версия:** 1.0  
> **Дата:** 19 апреля 2026  
> **Статус:** Blueprint / План

---

## Содержание

1. [Анализ текущего состояния](#1-анализ-текущего-состояния)
2. [Целевая архитектура](#2-целевая-архитектура)
3. [Стратегия миграции](#3-стратегия-миграции)
4. [Пошаговое руководство](#4-пошаговое-руководство)
5. [Примеры трансформации](#5-примеры-трансформации)
6. [Миграция систем](#6-миграция-систем)
7. [Обновление зависимостей](#7-обновление-зависимостей)
8. [Тестирование](#8-тестирование)
9. [Преимущества и риски](#9-преимущества-и-риски)

---

## 1. Анализ текущего состояния

### 1.1 Что используется сейчас

В проекте используется объектно-ориентированный подход на основе классов для реализации ECS систем:

```typescript
// Текущий подход - классовая система
export class TimeSystem {
  private world!: GameWorld
  private currentTime: number = 0
  
  init(world: GameWorld): void {
    this.world = world
  }
  
  advanceHours(hours: number): void {
    this.currentTime += hours
    // ... логика
  }
  
  getCurrentTime(): number {
    return this.currentTime
  }
}
```

### 1.2 Список классовых систем (32 класса)

| Система | Файл | Размер |
|---------|------|--------|
| `GameWorld` | `world.ts` | 252 строки |
| `TimeSystem` | `TimeSystem/index.ts` | ~500 строк |
| `StatsSystem` | `StatsSystem/index.ts` | ~400 строк |
| `SkillsSystem` | `SkillsSystem/index.ts` | ~320 строк |
| `ActionSystem` | `ActionSystem/index.ts` | ~600 строк |
| `EventQueueSystem` | `EventQueueSystem/index.ts` | ~400 строк |
| `CareerProgressSystem` | `CareerProgressSystem/index.ts` | ~330 строк |
| `EducationSystem` | `EducationSystem/index.ts` | ~300 строк |
| `FinanceActionSystem` | `FinanceActionSystem/index.ts` | ~250 строк |
| `WorkPeriodSystem` | `WorkPeriodSystem/index.ts` | ~350 строк |
| `RecoverySystem` | `RecoverySystem/index.ts` | ~280 строк |
| И ещё 22 системы | ... | ... |

### 1.3 Проблемы текущего подхода

1. **Сложность тестирования** — классы имеют скрытое состояние (`private` поля)
2. **Сложность рефакторинга** — изменение в одном методе влияет на весь класс
3. **Mutability** — состояние изменяется напрямую, сложно отследить изменения
4. **Coupling** — системы зависят друг от друга через `world.getSystem()`
5. **Нет Immutability** — нельзя сделать time-travel debugging
6. **Сложность concurrency** — изменяемое состояние опасно для параллелизма

---

## 2. Целевая архитектура

### 2.1 Функциональный подход

```typescript
// Целевой подход - чистые функции
type TimeState = {
  currentTime: number
  gameDays: number
  gameWeeks: number
}

type TimeAction = 
  | { type: 'ADVANCE_HOURS'; hours: number }
  | { type: 'SET_TIME'; time: number }

function timeReducer(state: TimeState, action: TimeAction): TimeState {
  switch (action.type) {
    case 'ADVANCE_HOURS':
      return {
        ...state,
        currentTime: state.currentTime + action.hours,
        gameDays: Math.floor((state.currentTime + action.hours) / 24)
      }
    case 'SET_TIME':
      return { ...state, currentTime: action.time }
    default:
      return state
  }
}
```

### 2.2 Архитектура на основе редюсеров

```
┌─────────────────────────────────────────────────────────────────┐
│                        Pure Functions                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │ timeReducer  │    │statsReducer  │    │skillsReducer│     │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘     │
│         │                   │                   │              │
│         ▼                   ▼                   ▼              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Root Reducer                          │   │
│  │  (combineReducers)                                      │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                            │                                    │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     Game State                          │   │
│  │  { time, stats, skills, wallet, career, ... }        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Принципы функционального подхода

1. **Pure Functions** — функции без побочных эффектов
2. **Immutability** — состояние не меняется, создаётся новое
3. **Declarative** — описываем "что" делать, а не "как"
4. **Composition** — маленькие функции компонуются в большие
5. **Testability** — легко тестировать изолированно

---

## 3. Стратегия миграции

### 3.1 Подход "Strangler Fig"

Мигрируем постепенно, не переписывая всё сразу:

1. **Фаза 1:** Создать функциональные обёртки для существующих классов
2. **Фаза 2:** Мигрировать одну систему (например, TimeSystem)
3. **Фаза 3:** Обновить зависимости
4. **Фаза 4:** Повторить для остальных систем
5. **Фаза 5:** Удалить старые классы

### 3.2 Порядок миграции (зависимости)

Рекомендуемый порядок (от наименее зависимых к наиболее):

```
1. TimeSystem        (базовая, мало зависимостей)
2. StatsSystem       (зависит от TimeSystem)
3. SkillsSystem      (зависит от StatsSystem)
4. TagsSystem        (зависит от SkillsSystem)
5. ActionSystem     (зависит от всех)
6. CareerProgress   (зависит от Skills, Education)
7. WorkPeriodSystem (зависит от Career, Time)
8. EventQueueSystem (зависит от Time)
9. Все остальные
```

### 3.3 Совместимость

Во время миграции сохраняем обратную совместимость:

```typescript
// Адаптер - старый API работает поверх нового
class TimeSystemAdapter extends TimeSystemClass {
  private functionalTime: TimeFunctional
  
  advanceHours(hours: number): void {
    this.functionalTime = timeReducer(this.functionalTime, {
      type: 'ADVANCE_HOURS',
      hours
    })
  }
}
```

---

## 4. Пошаговое руководство

### 4.1 Шаг 1: Определение State

```typescript
// src/domain/engine/state/time.ts
export interface TimeState {
  totalHours: number
  currentAge: number
  gameDays: number
  gameWeeks: number
  gameMonths: number
  gameYears: number
  sleepDebt: number
}

export const initialTimeState: TimeState = {
  totalHours: 0,
  currentAge: 18,
  gameDays: 0,
  gameWeeks: 0,
  gameMonths: 0,
  gameYears: 0,
  sleepDebt: 0
}
```

### 4.2 Шаг 2: Определение Actions

```typescript
// src/domain/engine/actions/time-actions.ts
export type TimeAction =
  | { type: 'ADVANCE_HOURS'; hours: number; options?: AdvanceHoursOptions }
  | { type: 'SET_AGE'; age: number }
  | { type: 'ADD_SLEEP_DEBT'; amount: number }
  | { type: 'RESET_SLEEP_DEBT' }
  | { type: 'NEW_GAME'; startAge: number }
  | { type: 'LOAD_STATE'; state: TimeState }

export interface AdvanceHoursOptions {
  actionType?: 'sleep' | 'work' | 'default'
  sleepHours?: number
}
```

### 4.3 Шаг 3: Создание Reducer

```typescript
// src/domain/engine/reducers/time-reducer.ts
import { TimeState, initialTimeState } from '../state/time'
import { TimeAction } from '../actions/time-actions'

const HOURS_PER_DAY = 24
const DAYS_PER_WEEK = 7
const DAYS_PER_MONTH = 30
const MONTHS_PER_YEAR = 12

export function timeReducer(
  state: TimeState = initialTimeState,
  action: TimeAction
): TimeState {
  switch (action.type) {
    case 'ADVANCE_HOURS': {
      const newTotalHours = state.totalHours + action.hours
      const newGameDays = Math.floor(newTotalHours / HOURS_PER_DAY)
      const newGameWeeks = Math.floor(newGameDays / DAYS_PER_WEEK)
      const newGameMonths = Math.floor(newGameDays / DAYS_PER_MONTH)
      const newGameYears = Math.floor(newGameMonths / MONTHS_PER_YEAR)
      
      let newSleepDebt = state.sleepDebt
      if (action.options?.actionType !== 'sleep') {
        newSleepDebt = Math.min(100, state.sleepDebt + action.hours * 0.5)
      } else if (action.options?.sleepHours) {
        newSleepDebt = Math.max(0, state.sleepDebt - action.options.sleepHours * 2)
      }
      
      const yearsSinceStart = Math.floor(newGameDays / 365)
      const newAge = 18 + yearsSinceStart
      
      return {
        ...state,
        totalHours: newTotalHours,
        gameDays: newGameDays,
        gameWeeks: newGameWeeks,
        gameMonths: newGameMonths,
        gameYears: newGameYears,
        currentAge: newAge,
        sleepDebt: newSleepDebt
      }
    }
    
    case 'SET_AGE':
      return { ...state, currentAge: action.age }
    
    case 'ADD_SLEEP_DEBT':
      return { ...state, sleepDebt: Math.min(100, state.sleepDebt + action.amount) }
    
    case 'RESET_SLEEP_DEBT':
      return { ...state, sleepDebt: 0 }
    
    case 'NEW_GAME':
      return {
        ...initialTimeState,
        currentAge: action.startAge
      }
    
    case 'LOAD_STATE':
      return action.state
    
    default:
      return state
  }
}
```

### 4.4 Шаг 4: Selectors

```typescript
// src/domain/engine/selectors/time-selectors.ts
import { TimeState } from '../state/time'

export const selectTotalHours = (state: { time: TimeState }) => state.time.totalHours

export const selectCurrentAge = (state: { time: TimeState }) => state.time.currentAge

export const selectGameDays = (state: { time: TimeState }) => state.time.gameDays

export const selectWeekHoursRemaining = (state: { time: TimeState }) => {
  const hoursInWeek = state.time.gameWeeks * 24 * 7
  const hoursUsed = state.time.totalHours % (24 * 7)
  return hoursInWeek + (24 * 7) - hoursUsed - hoursUsed
}

export const selectSleepDebt = (state: { time: TimeState }) => state.time.sleepDebt
```

### 4.5 Шаг 5: Middleware (для副作用)

```typescript
// src/domain/engine/middleware/time-middleware.ts
import { Middleware } from '@reduxjs/toolkit'
import { timeReducer } from '../reducers/time-reducer'

export const createTimeMiddleware = (): Middleware => {
  return (store) => (next) => (action) => {
    const result = next(action)
    
    // Side effects после изменения времени
    if (action.type.startsWith('time/')) {
      const state = store.getState()
      
      // Проверка на события
      if (action.type === 'time/ADVANCE_HOURS') {
        checkTimeBasedEvents(store.dispatch, state.time)
      }
      
      // Проверка на новый день
      if (action.type === 'time/ADVANCE_HOURS') {
        const prevDay = Math.floor((state.time.totalHours - action.hours) / 24)
        const newDay = Math.floor(state.time.totalHours / 24)
        if (newDay > prevDay) {
          store.dispatch({ type: 'time/NEW_DAY' })
        }
      }
    }
    
    return result
  }
}

function checkTimeBasedEvents(dispatch: Dispatch, time: TimeState): void {
  // Логика проверки событий на основе времени
}
```

---

## 5. Примеры трансформации

### 5.1 Пример: TimeSystem

**До (классовый подход):**

```typescript
// src/domain/engine/systems/TimeSystem/index.ts
export class TimeSystem {
  private world!: GameWorld
  
  init(world: GameWorld): void {
    this.world = world
    this.ensureTimeComponent()
  }
  
  private ensureTimeComponent(): void {
    const existing = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT)
    if (!existing) {
      this.world.addComponent(PLAYER_ENTITY, TIME_COMPONENT, {
        totalHours: 0,
        currentAge: 18,
        gameDays: 0,
        gameWeeks: 0,
        gameMonths: 0,
        gameYears: 0,
        sleepDebt: 0
      })
    }
  }
  
  advanceHours(hours: number, options?: AdvanceOptions): void {
    const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as TimeData
    time.totalHours += hours
    time.gameDays = Math.floor(time.totalHours / 24)
    time.gameWeeks = Math.floor(time.gameDays / 7)
    time.gameMonths = Math.floor(time.gameDays / 30)
    time.gameYears = Math.floor(time.gameMonths / 12)
    
    if (options?.actionType !== 'sleep') {
      time.sleepDebt = Math.min(100, time.sleepDebt + hours * 0.5)
    }
    
    this.world.updateComponent(PLAYER_ENTITY, TIME_COMPONENT, time)
  }
  
  getTotalHours(): number {
    const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT)
    return (time?.totalHours as number) ?? 0
  }
  
  getCurrentAge(): number {
    const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT)
    const days = (time?.gameDays as number) ?? 0
    return 18 + Math.floor(days / 365)
  }
}
```

**После (функциональный подход):**

```typescript
// src/domain/engine/state/time.ts
export interface TimeState {
  totalHours: number
  currentAge: number
  gameDays: number
  gameWeeks: number
  gameMonths: number
  gameYears: number
  sleepDebt: number
}

export const initialTimeState: TimeState = {
  totalHours: 0,
  currentAge: 18,
  gameDays: 0,
  gameWeeks: 0,
  gameMonths: 0,
  gameYears: 0,
  sleepDebt: 0
}

// src/domain/engine/actions/time-actions.ts
export type TimeAction =
  | { type: 'ADVANCE_HOURS'; hours: number; options?: AdvanceOptions }
  | { type: 'SET_TIME'; time: Partial<TimeState> }

export interface AdvanceOptions {
  actionType?: 'sleep' | 'work' | 'default'
  sleepHours?: number
}

// src/domain/engine/reducers/time-reducer.ts
export function timeReducer(
  state: TimeState = initialTimeState,
  action: TimeAction
): TimeState {
  switch (action.type) {
    case 'ADVANCE_HOURS': {
      const { hours, options } = action
      const newTotalHours = state.totalHours + hours
      const newGameDays = Math.floor(newTotalHours / 24)
      
      let newSleepDebt = state.sleepDebt
      if (options?.actionType !== 'sleep') {
        newSleepDebt = Math.min(100, state.sleepDebt + hours * 0.5)
      } else if (options?.sleepHours) {
        newSleepDebt = Math.max(0, state.sleepDebt - options.sleepHours * 2)
      }
      
      return {
        ...state,
        totalHours: newTotalHours,
        gameDays: newGameDays,
        gameWeeks: Math.floor(newGameDays / 7),
        gameMonths: Math.floor(newGameDays / 30),
        gameYears: Math.floor(newGameDays / 365),
        currentAge: 18 + Math.floor(newGameDays / 365),
        sleepDebt: newSleepDebt
      }
    }
    
    case 'SET_TIME':
      return { ...state, ...action.time }
    
    default:
      return state
  }
}

// src/domain/engine/store/game-store.ts (упрощённо)
import { configureStore } from '@reduxjs/toolkit'
import { timeReducer } from './reducers/time-reducer'
import { statsReducer } from './reducers/stats-reducer'
// ... другие редюсеры

export const gameStore = configureStore({
  reducer: {
    time: timeReducer,
    stats: statsReducer,
    // ...
  }
})

export type RootState = ReturnType<typeof gameStore.getState>
export type Dispatch = typeof gameStore.dispatch
```

### 5.2 Пример: StatsSystem

**До:**

```typescript
export class StatsSystem {
  private world!: GameWorld
  
  init(world: GameWorld): void {
    this.world = world
  }
  
  applyStatChanges(changes: StatChanges): void {
    const stats = this.world.getComponent(PLAYER_ENTITY, STATS_COMPONENT)
    if (!stats) return
    
    for (const [key, value] of Object.entries(changes)) {
      const current = (stats[key] as number) ?? 0
      stats[key] = this._clamp(current + value)
    }
    
    this.world.updateComponent(PLAYER_ENTITY, STATS_COMPONENT, stats)
  }
  
  getStat(statKey: string): number {
    const stats = this.world.getComponent(PLAYER_ENTITY, STATS_COMPONENT)
    return (stats?.[statKey] as number) ?? 0
  }
  
  private _clamp(value: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, value))
  }
}
```

**После:**

```typescript
// src/domain/engine/state/stats.ts
export interface StatsState {
  energy: number
  health: number
  hunger: number
  stress: number
  mood: number
  comfort: number
}

export const initialStatsState: StatsState = {
  energy: 100,
  health: 100,
  hunger: 0,
  stress: 0,
  mood: 100,
  comfort: 50
}

// src/domain/engine/actions/stats-actions.ts
export type StatsAction =
  | { type: 'APPLY_STAT_CHANGES'; changes: Record<string, number> }
  | { type: 'SET_STATS'; stats: Partial<StatsState> }
  | { type: 'RESET_STATS' }

// src/domain/engine/reducers/stats-reducer.ts
function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value))
}

export function statsReducer(
  state: StatsState = initialStatsState,
  action: StatsAction
): StatsState {
  switch (action.type) {
    case 'APPLY_STAT_CHANGES': {
      const newStats = { ...state }
      for (const [key, value] of Object.entries(action.changes)) {
        if (key in newStats) {
          newStats[key as keyof StatsState] = clamp(newStats[key as keyof StatsState] + value)
        }
      }
      return newStats
    }
    
    case 'SET_STATS':
      return { ...state, ...action.stats }
    
    case 'RESET_STATS':
      return initialStatsState
    
    default:
      return state
  }
}
```

### 5.3 Пример: ActionSystem

**До (сложный класс на 600+ строк):**

```typescript
export class ActionSystem {
  private world!: GameWorld
  private statsSystem!: StatsSystem
  private skillsSystem!: SkillsSystem
  // ... 10+ зависимостей
  
  init(world: GameWorld): void {
    this.world = world
    this.statsSystem = this._resolveStatsSystem()
    this.skillsSystem = this._resolveSkillsSystem()
    // ... инициализация
  }
  
  canExecute(actionId: string): AvailabilityCheck {
    // 100+ строк логики проверки
  }
  
  execute(actionId: string): ExecuteResult {
    // 200+ строк логики выполнения
  }
}
```

**После (функциональный подход):**

```typescript
// src/domain/engine/selectors/action-selectors.ts
import { createSelector } from '@reduxjs/toolkit'
import { RootState } from '../store/game-store'

export const selectActionById = (actionId: string) => 
  (state: RootState) => state.actions.items[actionId]

export const selectAvailableActions = (category: string) =>
  createSelector(
    (state: RootState) => state.actions.items,
    (state: RootState) => state.time,
    (state: RootState) => state.stats,
    (state: RootState) => state.wallet,
    (actions, time, stats, wallet) => {
      return Object.values(actions).filter(action => 
        checkActionAvailability(action, time, stats, wallet)
      )
    }
  )

// src/domain/engine/actions/action-availability.ts
function checkActionAvailability(
  action: Action,
  time: TimeState,
  stats: StatsState,
  wallet: WalletState
): boolean {
  if (action.price > 0 && wallet.money < action.price) return false
  if (stats.energy < 10 && action.actionType !== 'sleep') return false
  if (stats.hunger > 80 && action.category !== 'food') return false
  // ... проверки
  return true
}

// src/domain/engine/thunks/action-thunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit'

export const executeAction = createAsyncThunk(
  'actions/execute',
  async (actionId: string, { getState, dispatch }) => {
    const state = getState() as RootState
    const action = state.actions.items[actionId]
    
    if (!checkActionAvailability(action, state.time, state.stats, state.wallet)) {
      throw new Error('Action not available')
    }
    
    // Выполнение
    dispatch(actions.setWallet({
      money: state.wallet.money - action.price
    }))
    
    dispatch(actions.applyStatChanges(action.statChanges))
    dispatch(actions.applySkillChanges(action.skillChanges))
    dispatch(timeActions.advanceHours(action.hours))
    
    return { success: true }
  }
)
```

---

## 6. Миграция систем

### 6.1 Карта миграции

| Система | Сложность | Зависит от | Приоритет |
|---------|----------|------------|-----------|
| TimeSystem | Низкая | — | 1 |
| StatsSystem | Низкая | TimeSystem | 2 |
| SkillsSystem | Средняя | StatsSystem | 3 |
| WalletSystem | Низкая | — | 3 |
| TagsSystem | Средняя | SkillsSystem | 4 |
| ActionSystem | Высокая | Все | 5 |
| EventQueueSystem | Высокая | TimeSystem | 6 |
| CareerProgressSystem | Средняя | Skills, Education | 7 |
| WorkPeriodSystem | Средняя | Career, Time | 8 |
| EducationSystem | Средняя | Skills, Time | 9 |
| FinanceActionSystem | Средняя | Wallet | 10 |
| InvestmentSystem | Низкая | Wallet | 10 |
| RecoverySystem | Средняя | Stats, Time | 11 |
| MonthlySettlementSystem | Высокая | Work, Finance, Invest | 12 |
| ActivityLogSystem | Низкая | — | 13 |
| PersonalitySystem | Средняя | Stats | 14 |
| LifeMemorySystem | Низкая | — | 15 |
| SchoolSystem | Высокая | Stats, Skills | 16 |
| EventChoiceSystem | Средняя | EventQueue | 17 |
| EventHistorySystem | Низкая | EventQueue | 17 |
| AntiGrindSystem | Средняя | — | 18 |
| MigrationSystem | Средняя | — | 19 |
| PersistenceSystem | Высокая | Все | 20 |

### 6.2 Шаблон для каждой системы

Для каждой системы создаём:

```
src/domain/engine/
├── state/
│   └── {system}-state.ts          # Интерфейс состояния
├── actions/
│   └── {system}-actions.ts        # Action Types + Creators
├── reducers/
│   └── {system}-reducer.ts        # Pure reducer
├── selectors/
│   └── {system}-selectors.ts      # Memoized selectors
├── thunks/
│   └── {system}-thunks.ts         # Async actions (если нужно)
└── middleware/
    └── {system}-middleware.ts     # Side effects (если нужно)
```

---

## 7. Обновление зависимостей

### 7.1 Store

```typescript
// src/domain/engine/store/game-store.ts
import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { timeReducer } from '../reducers/time-reducer'
import { statsReducer } from '../reducers/stats-reducer'
import { skillsReducer } from '../reducers/skills-reducer'
import { walletReducer } from '../reducers/wallet-reducer'
import { actionsReducer } from '../reducers/actions-reducer'
import { timeMiddleware } from '../middleware/time-middleware'

const rootReducer = combineReducers({
  time: timeReducer,
  stats: statsReducer,
  skills: skillsReducer,
  wallet: walletReducer,
  actions: actionsReducer,
})

export const gameStore = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false
    }).concat(timeMiddleware)
})

export type RootState = ReturnType<typeof gameStore.getState>
export type AppDispatch = typeof gameStore.dispatch
```

### 7.2 Application Layer

```typescript
// src/application/game/commands.ts (обновлённый)
import { gameStore } from '@/domain/engine/store/game-store'
import { executeAction } from '@/domain/engine/thunks/action-thunks'

export const executeGameAction = (actionId: string) => {
  return gameStore.dispatch(executeAction(actionId))
}

export const advanceGameTime = (hours: number, options?: AdvanceOptions) => {
  gameStore.dispatch(timeActions.advanceHours(hours, options))
}
```

### 7.3 Vue Integration

```typescript
// src/composables/useGameTime.ts
import { ref, computed, watchEffect } from 'vue'
import { gameStore, RootState } from '@/domain/engine/store/game-store'
import { selectCurrentAge, selectTotalHours } from '@/domain/engine/selectors/time-selectors'

export function useGameTime() {
  const state = ref<RootState>(gameStore.getState())
  
  // Подписка на изменения
  gameStore.subscribe(() => {
    state.value = gameStore.getState()
  })
  
  return {
    currentAge: computed(() => selectCurrentAge(state.value)),
    totalHours: computed(() => selectTotalHours(state.value)),
    gameDays: computed(() => state.value.time.gameDays)
  }
}
```

---

## 8. Тестирование

### 8.1 Unit тесты для редюсеров

```typescript
// __tests__/reducers/time-reducer.test.ts
import { timeReducer } from '../../src/domain/engine/reducers/time-reducer'
import { initialTimeState } from '../../src/domain/engine/state/time'

describe('timeReducer', () => {
  it('должен увеличивать totalHours при ADVANCE_HOURS', () => {
    const result = timeReducer(initialTimeState, {
      type: 'ADVANCE_HOURS',
      hours: 8
    })
    
    expect(result.totalHours).toBe(8)
  })
  
  it('должен правильно вычислять gameDays', () => {
    const result = timeReducer(initialTimeState, {
      type: 'ADVANCE_HOURS',
      hours: 24
    })
    
    expect(result.gameDays).toBe(1)
  })
  
  it('должен увеличивать sleepDebt при обычной деятельности', () => {
    const result = timeReducer(initialTimeState, {
      type: 'ADVANCE_HOURS',
      hours: 8,
      options: { actionType: 'work' }
    })
    
    expect(result.sleepDebt).toBe(4) // 8 * 0.5
  })
  
  it('должен уменьшать sleepDebt при сне', () => {
    const stateWithDebt = { ...initialTimeState, sleepDebt: 20 }
    
    const result = timeReducer(stateWithDebt, {
      type: 'ADVANCE_HOURS',
      hours: 8,
      options: { actionType: 'sleep', sleepHours: 8 }
    })
    
    expect(result.sleepDebt).toBe(4) // 20 - 8 * 2
  })
  
  it('не должен мутировать исходное состояние', () => {
    timeReducer(initialTimeState, {
      type: 'ADVANCE_HOURS',
      hours: 10
    })
    
    expect(initialTimeState.totalHours).toBe(0)
  })
})
```

### 8.2 Тесты для селекторов

```typescript
// __tests__/selectors/time-selectors.test.ts
import { selectCurrentAge, selectWeekHoursRemaining } from '../../src/domain/engine/selectors/time-selectors'

describe('timeSelectors', () => {
  const mockState = {
    time: {
      totalHours: 100,
      gameDays: 4,
      gameWeeks: 0,
      gameMonths: 0,
      gameYears: 0,
      currentAge: 18,
      sleepDebt: 0
    }
  }
  
  it('selectCurrentAge должен возвращать текущий возраст', () => {
    expect(selectCurrentAge(mockState)).toBe(18)
  })
  
  it('selectWeekHoursRemaining должен вычислять оставшееся время', () => {
    const result = selectWeekHoursRemaining(mockState)
    expect(result).toBeGreaterThanOrEqual(0)
  })
})
```

---

## 9. Преимущества и риски

### 9.1 Преимущества

| Преимущество | Описание |
|--------------|----------|
| **Predictability** | Одно и то же состояние + экшн = тот же результат |
| **Testability** | Легко тестировать редюсеры без моков |
| **Time Travel** | Возможность откатывать состояние (undo/redo) |
| **Debugging** | Лёгко отследить изменения через Redux DevTools |
| **Immutability** | Нет случайных мутаций |
| **Composition** | Маленькие функции легко комбинировать |
| **Performance** | Memoized selectors избегают лишних перерисовок |

### 9.2 Риски

| Риск | Митигация |
|------|-----------|
| **Большой рефакторинг** | Постепенная миграция (Strangler Fig) |
| **Learning Curve** | Команде нужно изучить Redux Toolkit |
| **Performance** | Large state может замедлить store |
| **Breaking Changes** | Полная обратная совместимость во время миграции |

### 9.3 Альтернативы

Если полная миграция на Redux слишком сложна:

1. **Zustand** — более простой стейт-менеджер
2. **Valtio** — proxy-based состояние
3. **RxJS** — реактивные стримы
4. **Context + useReducer** — нативное React решение

---

## 10. План выполнения

### Фаза 1: Подготовка (1 неделя)

- [ ] Установить @reduxjs/toolkit
- [ ] Настроить store
- [ ] Создать базовые типы

### Фаза 2: Core системы (2 недели)

- [ ] TimeSystem → timeReducer
- [ ] StatsSystem → statsReducer  
- [ ] WalletSystem → walletReducer

### Фаза 3: Средние системы (2 недели)

- [ ] SkillsSystem → skillsReducer
- [ ] TagsSystem → tagsReducer
- [ ] ActionSystem → actions + thunks

### Фаза 4: Сложные системы (3 недели)

- [ ] EventQueueSystem
- [ ] CareerProgressSystem
- [ ] WorkPeriodSystem
- [ ] MonthlySettlementSystem

### Фаза 5: Завершение (1 неделя)

- [ ] Все остальные системы
- [ ] Persistence
- [ ] Тесты
- [ ] Документация

**Общая оценка:** ~9 недель

---

## Приложение A: Структура файлов после миграции

```
src/domain/engine/
├── state/
│   ├── index.ts
│   ├── time-state.ts
│   ├── stats-state.ts
│   ├── skills-state.ts
│   ├── wallet-state.ts
│   └── ...
│
├── actions/
│   ├── index.ts
│   ├── time-actions.ts
│   ├── stats-actions.ts
│   └── ...
│
├── reducers/
│   ├── index.ts
│   ├── root-reducer.ts
│   ├── time-reducer.ts
│   ├── stats-reducer.ts
│   └── ...
│
├── selectors/
│   ├── index.ts
│   ├── time-selectors.ts
│   ├── stats-selectors.ts
│   └── ...
│
├── thunks/
│   ├── action-thunks.ts
│   └── ...
│
├── middleware/
│   ├── index.ts
│   ├── time-middleware.ts
│   └── ...
│
├── store/
│   ├── index.ts
│   └── game-store.ts
│
└── types/
    └── index.ts
```

---

## Приложение B: Сравнение API

| Операция | Классовый подход | Функциональный подход |
|----------|------------------|----------------------|
| Получить данные | `system.getStat('energy')` | `selectStat('energy')(state)` |
| Изменить данные | `system.applyStatChanges({ energy: -10 })` | `dispatch(statsActions.apply({ energy: -10 }))` |
| Проверить доступность | `system.canExecute(actionId)` | `selectCanExecute(actionId)(state)` |
| Выполнить действие | `system.execute(actionId)` | `dispatch(executeAction(actionId))` |

---

**Документ создан как план миграции. Требует уточнения деталей реализации перед началом работ.**
