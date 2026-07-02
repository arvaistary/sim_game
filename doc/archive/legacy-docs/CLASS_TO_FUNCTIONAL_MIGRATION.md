# Миграция с классового подхода на функциональный

> **Версия:** 2.1  
> **Дата:** 19 апреля 2026  
> **Статус:** ✅ ЗАВЕРШЕНО (100%)  
> **Фактическое время:** ~2 недели  
> **Компонентов обновлено:** 15+

---

## Содержание

1. [Анализ текущего состояния](#1-анализ-текущего-состояния)
2. [Эталонная архитектура (henderson)](#2-эталонная-архитектура-henderson)
3. [Стратегия миграции](#3-стратегия-миграции)
4. [Пошаговое руководство](#4-пошаговое-руководство)
5. [Примеры трансформации](#5-примеры-трансформации)
6. [План выполнения](#6-план-выполнения)

---

## 1. Анализ текущего состояния

### 1.1 Текущая архитектура game_life

```
┌─────────────────────────────────────────────────────────────┐
│                  game_life (ТЕКУЩЕЕ)                       │
├─────────────────────────────────────────────────────────────┤
│                                                      │
│  Pinia Store                                          │
│  └── world: shallowRef<GameWorld>                     │
│                                                      │
│  ECS Classes (32 класса)                             │
│  ├── TimeSystem (466 строк)                          │
│  ├── StatsSystem (72 строки)                        │
│  ├── SkillsSystem (320 строк)                      │
│  ├── ActionSystem (606 строк)                       │
│  └── ...другие                                   │
│                                                      │
│  GameWorld                                          │
│  ├── entities, components (Map)                    │
│  ├── systems (array)                              │
│  └── eventBus                                    │
└─────────────────────────────────────────────────────────────┘

ПРОБЛЕМЫ:
- Сложность: 32 класса = ~4000+ строк кода
- Coupling: системы зависят друг от друга через world.getSystem()
- Mutability: прямое изменение компонентов
- Testing: сложно тестировать изолированно
```

### 1.2 Что НЕ является проблемой

- ✅ Pinia store уже используется
- ✅ Vue reactivity работает
- ✅ TypeScript

### 1.3 Классовые системы

| Система | Строк | Зависимостей |
|---------|-------|-------------|
| `TimeSystem` | 466 | SkillsSystem, EventQueue |
| `ActionSystem` | 606 | Stats, Skills, Time, EventQueue |
| `SkillsSystem` | 320 | TagsSystem |
| `CareerProgressSystem` | 328 | Skills, Education |
| `WorkPeriodSystem` | ~350 | Career, Time |
| `EventQueueSystem` | ~400 | Time |
| `EducationSystem` | ~300 | Skills, Time |
| `RecoverySystem` | ~280 | Stats, Time |
| `FinanceActionSystem` | ~250 | Wallet, Stats |

---

## 2. Этало��ная архитектура (henderson)

### 2.1henderson подход

```
┌─────────────────────────────────────────────────────────────┐
│                  henderson (ЭТАЛОН)                      │
├─────────────────────────────────────────────────────────────┤
│                                                      │
│  Pinia Store (ОДИН ФАЙЛ)                              │
│  ├── ref() — состояние                                 │
│  ├── computed() — вычисляемые значения                 │
│  ├── function — методы                             │
│  └── types/constants — экспорт                      │
│                                                      │
│  Composables (ОТДЕЛЬНЫЕ ФАЙЛЫ)                     │
│  └── useXxx() { return { fn, computed }                │
│                                                      │
│ НИКАКИХ КЛАССОВ для state management!              │
│ НИКАКОГО GameWorld!                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Пример: use-cart (henderson)

```typescript
// henderson/composables/use-cart/index.ts
export const useCart = (): UseCart => {
  const cartStore = useCartStore();
  const geoStore = useGeoStore();

  // Состояние — в store
  const listProductsCart = computed(() => cartStore.listProductsCart);

  // Методы
  async function updateCart(products) {
    const response = await cartStore.updateCart({ ... });
    return response;
  }

  return { listProductsCart, updateCart };
};
```

### 2.3 Пример: cart-store (henderson)

```typescript
// henderson/stores/cart-store/index.ts
export const useCartStore = defineStore('cart-store', () => {
  // === State ===
  const listProductsCart = ref<ItemProductCart[]>([]);
  const totalPriceCart = ref<number>(0);
  const isLoading = ref(false);

  // === Computed ===
  const isEmpty = computed(() => listProductsCart.value.length === 0);

  // === Actions ===
  async function updateCart(body) { /* ... */ }
  async function clearCart() { /* ... */ }

  return {
    listProductsCart,
    totalPriceCart,
    isLoading,
    isEmpty,
    updateCart,
    clearCart,
  };
});
```

### 2.4 Ключевые принципы henderson

| Принцип | Описание |
|---------|----------|
| **Flat Store** | Один store = один файл, всё в одном |
| **Composable = Hook** | useXxx() возвращает интерфейс |
| **No Classes** | Только ref(), computed(), function |
| **Single Responsibility** | Один composable = одна фича |
| **Direct Store Access** | Composables читают из stores напрямую |

---

## 3. Стратегия миграции

### 3.1 Цель: убрать ECS классы, оставить Pinia

```
ТЕКУЩЕЕ:                              ПОСЛЕ:
┌─────────────────┐                 ┌─────────────────┐
│ Pinia Store     │                 │ Pinia Store     │
│ └── world       │     ───►       │ └── flat state  │
│    │          │                 │    + methods  │
│ ECS Classes    │                 └─────────────────┘
│ (32 класса)  │
└───────���─��───────┘

GameWorld ──►─ (удалить)
ECS Classes ──►─ (удалить / перенести в store)
```

### 3.2 Две фазы миграции

| Фаза | Задача | Описание |
|------|-------|----------|
| **1** | Flat State | Вынести state из ECS components в Pinia |
| **2** | Flat Actions | Вынести методы из ECS systems в Store |

### 3.3 Совместимость

Во время миграции сохраняем старый код для обратной совместимости:

```typescript
// Временная заглушка для Compatibility
class TimeSystem {
  private timeAdapter = useTimeAdapter() // Делегируем в Pinia

  advanceHours(hours: number) {
    return this.timeAdapter.advanceHours(hours)
  }
}
```

---

## 4. Пошаговое руководство

### 4.1 Шаг 1: Определить State

Для каждой системы определяем state interface:

```typescript
// src/stores/game/game.state.ts
export interface GameState {
  // Time
  totalHours: number
  gameDays: number
  gameWeeks: number
  gameYears: number
  currentAge: number
  sleepDebt: number

  // Stats
  energy: number
  health: number
  hunger: number
  stress: number
  mood: number

  // Wallet
  money: number
  reserveFund: number

  // Skills
  skills: Record<string, { level: number; xp: number }>

  // Career
  career: CareerData | null
}
```

### 4.2 Шаг 2: Отдельные Stores вместо ECS

```typescript
// src/stores/time-store/index.ts
export const useTimeStore = defineStore('time', () => {
  const totalHours = ref(0)
  const sleepDebt = ref(0)

  const gameDays = computed(() => Math.floor(totalHours.value / 24))
  const currentAge = computed(() => 18 + Math.floor(gameDays.value / 365))

  function advanceHours(hours: number, options?: { actionType?: string }) {
    totalHours.value += hours
    if (options?.actionType !== 'sleep') {
      sleepDebt.value = Math.min(100, sleepDebt.value + hours * 0.5)
    }
  }

  return { totalHours, gameDays, currentAge, advanceHours, sleepDebt }
})

// src/stores/stats-store/index.ts
export const useStatsStore = defineStore('stats', () => {
  const energy = ref(100)
  const health = ref(100)
  const hunger = ref(0)
  const stress = ref(0)
  const mood = ref(100)

  function applyStatChanges(changes: Record<string, number>) {
    for (const [key, delta] of Object.entries(changes)) {
      if (key === 'energy') energy.value = clamp(energy.value + delta, 0, 100)
      // ...
    }
  }

  return { energy, health, hunger, stress, mood, applyStatChanges }
})

// src/stores/wallet-store/index.ts
export const useWalletStore = defineStore('wallet', () => {
  const money = ref(0)
  const reserveFund = ref(0)

  function spend(amount: number) { money.value -= amount }
  function earn(amount: number) { money.value += amount }

  return { money, reserveFund, spend, earn }
})
```

### 4.3 Шаг 3: Composables (делегирование в stores)

```typescript
// src/composables/use-time.ts
export const useTime = () => {
  const timeStore = useTimeStore()  // Делегируем в store

  return {
    totalHours: computed(() => timeStore.totalHours),
    currentAge: computed(() => timeStore.currentAge),
    weekHoursRemaining: computed(() => 168 - (timeStore.totalHours % 168)),
    advanceHours: timeStore.advanceHours,
  }
}

// src/composables/use-actions.ts
export const useActions = () => {
  const timeStore = useTimeStore()
  const statsStore = useStatsStore()
  const walletStore = useWalletStore()

  function canExecute(action: Action): boolean {
    if (action.price > walletStore.money) return false
    if (action.hours > timeStore.weekHoursRemaining) return false
    return true
  }

  function executeAction(actionId: string) {
    const action = getActionById(actionId)
    if (!canExecute(action)) return { success: false }

    statsStore.applyStatChanges(action.statChanges)
    timeStore.advanceHours(action.hours)

    return { success: true }
  }

  return { canExecute, executeAction }
}
```

---

## 5. Примеры трансформации

### 5.1 TimeSystem: 466 строк → ~80 строк (отдельный store)

**До (класс ECS):**

```typescript
// src/domain/engine/systems/TimeSystem/index.ts (466 строк)
export class TimeSystem {
  private world!: GameWorld
  private skillsSystem!: SkillsSystem
  // ...10+ полей

  init(world: GameWorld): void { /* */ }
  advanceHours(hours: number, options?: AdvanceOptions): void { /* 50+ строк */ }
  getWeekHoursRemaining(): number { /* */ }
  getDayHoursRemaining(): number { /* */ }
  // ... 20+ методов
}
```

**После (отдельный Pinia store):**

```typescript
// src/stores/time-store/index.ts (~80 строк)
import { defineStore } from 'pinia'

export const useTimeStore = defineStore('time', () => {
  // === State ===
  const totalHours = ref(0)
  const sleepDebt = ref(0)

  // === Computed ===
  const gameDays = computed(() => Math.floor(totalHours.value / 24))
  const gameWeeks = computed(() => Math.floor(gameDays.value / 7))
  const gameMonths = computed(() => Math.floor(gameDays.value / 30))
  const gameYears = computed(() => Math.floor(gameDays.value / 365))
  const currentAge = computed(() => 18 + gameYears.value)

  const dayHoursRemaining = computed(() => 24 - (totalHours.value % 24))
  const weekHoursRemaining = computed(() => 168 - (totalHours.value % 168))

  // === Actions ===
  function advanceHours(hours: number, options?: { actionType?: string }) {
    totalHours.value += hours
    if (options?.actionType !== 'sleep') {
      sleepDebt.value = Math.min(100, sleepDebt.value + hours * 0.5)
    }
  }

  return { totalHours, gameDays, currentAge, weekHoursRemaining, advanceHours, sleepDebt }
})
```

### 5.2 StatsSystem: 72 строки → ~40 строк

**До:**

```typescript
// src/domain/engine/systems/StatsSystem/index.ts (72 строки)
export class StatsSystem {
  applyStatChanges(changes: StatChanges): void {
    // ... логика
  }
  getStats() { /* */ }
}
```

**После:**

```typescript
// src/stores/game/index.ts
export const useGameStore = defineStore('game', () => {
  const energy = ref(100)
  const health = ref(100)

  function applyStatChanges(changes: Record<string, number>) {
    for (const [key, delta] of Object.entries(changes)) {
      switch (key) {
        case 'energy':
          energy.value = clamp(energy.value + delta, 0, 100)
          break
        case 'health':
          health.value = clamp(health.value + delta, 0, 100)
          break
      }
    }
  }

  return { energy, health, applyStatChanges }
})
```

### 5.3 ActionSystem: 606 строк → ~100 строк

**До:**

```typescript
// 606 строк класса с 10+ зависимостями
export class ActionSystem {
  private statsSystem!: StatsSystem
  private skillsSystem!: SkillsSystem
  private eventQueueSystem!: EventQueueSystem
  // ...
}
```

**После:**

```typescript
// src/stores/game/index.ts
export const useGameStore = defineStore('game', () => {
  // Все state уже в store

  function canExecuteAction(action: Action): boolean {
    if (action.price > 0 && money.value < action.price) return false
    if (action.hourCost > weekHoursRemaining.value) return false
    // ... простые проверки
    return true
  }

  function executeAction(actionId: string) {
    const action = getActionById(actionId)
    if (!canExecuteAction(action)) return { success: false, error: '...' }

    // Логика выполнения
    applyStatChanges(action.statChanges)
    advanceHours(action.hours)

    return { success: true }
  }
})
```

---

## 6. План выполнения

### Фаза 1: Подготовка (1 день) ✅

- [x] Создать типы GameState
- [x] Определить структуру flat store

### Фаза 2: Core State (3 дня) ✅

- [x] Time state → store
- [x] Stats state → store
- [x] Wallet state → store
- [x] Skills state → store

### Фаза 3: Core Actions (5 дней) ✅

- [x] Time actions (advanceHours)
- [x] Stats actions (applyStatChanges)
- [x] Action execution (executeAction)
- [x] Career state/actions
- [x] Education state/actions

### Фаза 4: Advanced (5 дней) ✅

- [x] Event queue
- [x] Work periods
- [x] Monthly settlement
- [x] Persistence/save

### Фаза 5: Cleanup (3 дня) ✅ (100%)

- [x] Bridge адаптер для совместимости
- [x] Обновить UI компоненты (15+ штук)
- [x] Полная интеграция всех компонентов
- [x] TypeScript check пройден

**Фактическая оценка:** ~2 недели (быстрее плана)

---

## Приложение A: Структура файлов ПОСЛЕ миграции

**Рекомендуемый подход: множество stores (как в henderson)**

```
src/
├── stores/
│   ├── time-store/
│   │   ├── index.ts       # useTimeStore (~80 строк)
│   │   └── types.ts
│   │
│   ├── stats-store/
│   │   ├── index.ts       # useStatsStore (~60 строк)
│   │   └── types.ts
│   │
│   ├── wallet-store/
│   │   ├── index.ts       # useWalletStore (~50 строк)
│   │   └── types.ts
│   │
│   ├── skills-store/
│   │   ├── index.ts       # useSkillsStore (~80 строк)
│   │   └── types.ts
│   │
│   ├── actions-store/
│   │   ├── index.ts       # useActionsStore (~100 строк)
│   │   └── types.ts
│   │
│   ├── career-store/
│   │   ├── index.ts
│   │   └── types.ts
│   │
│   ├── education-store/
│   │   ├── index.ts
│   │   └── types.ts
│   │
│   ├── events-store/
│   │   ├── index.ts
│   │   └── types.ts
│   │
│   └── index.ts           # barrel: export * from './time-store'
│
├── composables/
│   ├── use-time.ts        # ~20 строк (делегирует в store)
│   ├── use-stats.ts       # ~15 строк
│   └── index.ts
│
└── types/
    └── game.ts            # Общие типы
```

### Почему несколько stores лучше одного

| Критерий | Один store | Множество stores |
|----------|-----------|------------------|
| **Coupling** | Высокий | Низкий |
| **Тестирование** | Сложно | Легко |
| **Code Splitting** | Невозможно | Возможно |
| **Переиспользование** | Нет | Да |
| **Maintainability** | Сложно | Легко |

### Пример: time-store

```typescript
// src/stores/time-store/index.ts
export const useTimeStore = defineStore('time', () => {
  // === State ===
  const totalHours = ref(0)
  const sleepDebt = ref(0)

  // === Computed ===
  const gameDays = computed(() => Math.floor(totalHours.value / 24))
  const currentAge = computed(() => 18 + Math.floor(gameDays.value / 365))
  const weekHoursRemaining = computed(() => 168 - (totalHours.value % 168))

  // === Actions ===
  function advanceHours(hours: number, options?: { actionType?: string }) {
    totalHours.value += hours
    if (options?.actionType !== 'sleep') {
      sleepDebt.value = Math.min(100, sleepDebt.value + hours * 0.5)
    }
  }

  return { totalHours, sleepDebt, gameDays, currentAge, advanceHours }
})
```

### Сравнение размеров:

| До | После |
|-----|-------|
| 32 ECS класса | 8 Pinia stores |
| ~4000 строк | ~500 строк |
| 30+ файлов | ~25 файлов |

---

## Приложение B: API Comparison

| Операция | До (ECS) | После (Pinia) |
|----------|----------|---------------|
| Получить время | `system.getTotalHours()` | `store.totalHours` |
| Получить статы | `system.getStats()` | `store.energy` |
| Изменить статы | `system.applyStatChanges()` | `store.applyStatChanges()` |
| Выполнить действие | `system.execute()` | `store.executeAction()` |
|Доступность | `system.canExecute()` | `store.canExecuteAction()` |

---

## Приложение C: Критерии готовности

| Критерий | Метрика |
|----------|---------|
| Удалён GameWorld | 0 ссылок на world.ts |
| Удалены ECS классы | 0 ссылок на TimeSystem/StatsSystem/... |
| Flat store | Всё в одном defineStore |
| Тесты | >80% coverage |

---

**Статус:** Готов к началу миграции после утверждения.