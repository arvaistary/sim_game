# Справочник Vue Composables

**Последнее обновление:** 10 апреля 2026
**Технологический стек:** Nuxt 4 + Vue 3 + TypeScript + Pinia

---

## Обзор

Composables в проекте Game Life - это переиспользуемые функции с Composition API для логики Vue компонентов. Каждый composable инкапсулирует определённую функциональность и предоставляет её через реактивные API.

---

## useActions

**Путь:** `src/composables/useActions.ts`

**Назначение:** Работа с действиями игрока (восстановление, покупки, обучение и т.д.)

### API

```typescript
export function useActions() {
  // Проверка возможности выполнения действия
  canExecute(actionId: string): boolean

  // Выполнение действия
  executeAction(actionId: string): boolean

  // Получение действий по категории
  getActionsByCategory(category: ActionCategory): BalanceAction[]

  // Все категории действий
  allCategories: Ref<ActionCategory[]>
}
```

### Логика

#### canExecute(actionId)

Проверяет, можно ли выполнить действие:

1. Проверяет инициализацию игры (`store.isInitialized`)
2. Находит действие по ID (`getActionById`)
3. Проверяет достаточность денег (`action.price <= store.money`)
4. Проверяет достаточность энергии/статов

```typescript
if (action.price > 0 && store.money < action.price) return false
if (action.statChanges?.energy && action.statChanges.energy < 0) {
  if ((store.energy ?? 0) + action.statChanges.energy < 0) return false
}
return true
```

#### executeAction(actionId)

Выполняет действие:

1. Проверяет возможность через `canExecute()`
2. Вызывает `store.applyRecoveryAction(actionData)`
3. Показывает toast уведомление об успехе/ошибке
4. Возвращает результат выполнения

### Категории действий

```typescript
const allCategories = [
  'shop',      // Магазины
  'fun',       // Развлечения
  'home',      // Дом
  'social',    // Социальная жизнь
  'education', // Образование
  'finance',   // Финансы
  'career',    // Карьера
  'hobby',     // Хобби
  'health',    // Здоровье
  'selfdev',   // Саморазвитие
]
```

### Пример использования

```vue
<script setup lang="ts">
const { canExecute, executeAction, getActionsByCategory } = useActions()

const shopActions = getActionsByCategory('shop')

function handleActionClick(actionId: string) {
  if (canExecute(actionId)) {
    executeAction(actionId)
  }
}
</script>

<template>
  <div class="actions-grid">
    <button
      v-for="action in shopActions"
      :key="action.id"
      @click="handleActionClick(action.id)"
      :disabled="!canExecute(action.id)"
    >
      {{ action.title }}
    </button>
  </div>
</template>
```

---

## useFinance

**Путь:** `src/composables/useFinance.ts`

**Назначение:** Работа с финансовыми данными игрока (обзор, инвестиции, кредиты)

### API

```typescript
export function useFinance() {
  // Обзор финансов
  overview: ComputedRef<FinanceOverview>

  // Инвестиции
  investments: ComputedRef<Investment[]>

  // Применение финансового действия
  applyAction(actionData: Record<string, unknown>): boolean

  // Сбор инвестиций
  collectInvestment(portfolioId: string): boolean
}
```

### Логика

#### overview

Computed свойство, которое вызывает `store.getFinanceOverview()`:

```typescript
const overview = computed(() => {
  return store.getFinanceOverview()
})
```

Возвращает:
- Баланс кошелька
- Ежемесячные расходы
- Ежемесячные доходы
- Кредиты
- Подписки

#### investments

Computed свойство, которое вызывает `store.getInvestments()`:

```typescript
const investments = computed(() => {
  return store.getInvestments()
})
```

Возвращает:
- Список всех инвестиций
- Статус (активные/завершённые)
- Доходность

#### applyAction(actionData)

Применяет финансовое действие:

1. Проверяет инициализацию игры
2. Вызывает `store.applyRecoveryAction(actionData)`
3. Показывает toast уведомление об успехе
4. Возвращает результат выполнения

#### collectInvestment(portfolioId)

Собирает инвестиции:

1. Вызывает `store.collectInvestment(portfolioId)`
2. Проверяет результат на наличие сообщений об ошибках
3. Показывает toast уведомление
4. Возвращает результат

### Пример использования

```vue
<script setup lang="ts">
const { overview, investments, collectInvestment } = useFinance()

function handleCollect(portfolioId: string) {
  collectInvestment(portfolioId)
}
</script>

<template>
  <div class="finance-overview">
    <h2>Обзор финансов</h2>
    <p>Баланс: {{ overview.value.wallet }}</p>
    <p>Расходы: {{ overview.value.expenses }}</p>
    <p>Доходы: {{ overview.value.income }}</p>

    <h3>Инвестиции</h3>
    <div
      v-for="investment in investments"
      :key="investment.id"
      class="investment-item"
    >
      <span>{{ investment.name }}</span>
      <button @click="handleCollect(investment.id)">
        Собрать
      </button>
    </div>
  </div>
</template>
```

---

## useEvents

**Путь:** `src/composables/useEvents.ts`

**Назначение:** Работа с событиями игры (очередь, выбор решений)

### API

```typescript
export function useEvents() {
  // Текущее событие
  currentEvent: Ref<EventQueueItem | null>

  // Проверка наличия следующего события
  hasNextEvent: ComputedRef<boolean>

  // Загрузка следующего события
  loadNextEvent(): EventQueueItem | null

  // Применение выбора решения
  applyChoice(choiceId: string): boolean
}
```

### Логика

#### currentEvent

Reactive ref для хранения текущего отображаемого события:

```typescript
const currentEvent = ref<EventQueueItem | null>(null)
```

#### hasNextEvent

Computed свойство, которое проверяет наличие следующего события:

```typescript
const hasNextEvent = computed(() => {
  return Boolean(store.getNextEvent())
})
```

#### loadNextEvent()

Загружает следующее событие из очереди:

1. Вызывает `store.getNextEvent()`
2. Если события нет - очищает `currentEvent`
3. Иначе - загружает событие в `currentEvent`
4. Возвращает загруженное событие

#### applyChoice(choiceId)

Применяет выбор решения в событии:

1. Проверяет наличие `currentEvent` и choices
2. Находит choice по ID
3. Вызывает `store.applyEventChoice(eventId, choiceId)`
4. Проверяет результат на наличие сообщений об ошибках
5. Очищает `currentEvent`
6. Возвращает результат

### Пример использования

```vue
<script setup lang="ts">
const { currentEvent, hasNextEvent, loadNextEvent, applyChoice } = useEvents()

function handleNextEvent() {
  loadNextEvent()
}

function handleChoice(choiceId: string) {
  applyChoice(choiceId)
}
</script>

<template>
  <div class="events-container">
    <template v-if="currentEvent">
      <h2>{{ currentEvent.title }}</h2>
      <p>{{ currentEvent.description }}</p>

      <div class="choices">
        <button
          v-for="choice in currentEvent.choices"
          :key="choice.id"
          @click="handleChoice(choice.id)"
        >
          {{ choice.title }}
        </button>
      </div>
    </template>

    <template v-else>
      <p>Нет активных событий</p>
      <button v-if="hasNextEvent" @click="handleNextEvent">
        Следующее событие
      </button>
    </template>
  </div>
</template>
```

---

## useToast

**Путь:** `src/composables/useToast.ts`

**Назначение:** Отображение toast уведомлений (успех, ошибка, информация)

### API

```typescript
export function useToast() {
  // Показать успешное сообщение
  showSuccess(message: string): void

  // Показать сообщение об ошибке
  showError(message: string): void

  // Показать информационное сообщение
  showInfo(message: string): void
}
```

### Логика

#### showSuccess(message)

Отображает toast уведомление об успехе:

```typescript
function showSuccess(message: string): void {
  // Вызывает toast.showSuccess() из компонента Toast.vue
}
```

#### showError(message)

Отображает toast уведомление об ошибке:

```typescript
function showError(message: string): void {
  // Вызывает toast.showError() из компонента Toast.vue
}
```

#### showInfo(message)

Отображает информационное toast уведомление:

```typescript
function showInfo(message: string): void {
  // Вызывает toast.showInfo() из компонента Toast.vue
}
```

### Пример использования

```vue
<script setup lang="ts">
const { showSuccess, showError, showInfo } = useToast()

function handleAction() {
  try {
    // Выполнение действия
    showSuccess('Действие выполнено успешно!')
  } catch (error) {
    showError(`Ошибка: ${error.message}`)
  }
}
</script>

<template>
  <button @click="handleAction">
    Выполнить действие
  </button>
</template>
```

---

## useActivityLog

**Путь:** `src/composables/useActivityLog.ts`

**Назначение:** Работа с журналом активности игрока

### API

```typescript
export function useActivityLog() {
  // Получение записей журнала
  getActivityLog(filter?: ActivityLogFilter, limit?: number): ActivityLogEntry[]
}
```

### Логика

#### getActivityLog(filter, limit)

Получает записи журнала активности из store:

```typescript
function getActivityLog(filter?: ActivityLogFilter, limit?: number): ActivityLogEntry[] {
  return store.getActivityLog(filter, limit)
}
```

Параметры:
- `filter` - фильтр по категориям действий
- `limit` - максимальное количество записей

### Пример использования

```vue
<script setup lang="ts">
const { getActivityLog } = useActivityLog()

const recentActivities = computed(() => {
  return getActivityLog(undefined, 10)
})

const educationActivities = computed(() => {
  return getActivityLog({ category: 'education' })
})
</script>

<template>
  <div class="activity-log">
    <h2>Журнал активности</h2>

    <div class="recent-activities">
      <div
        v-for="entry in recentActivities"
        :key="entry.id"
        class="log-entry"
      >
        <span class="timestamp">{{ entry.timestamp }}</span>
        <span class="action">{{ entry.actionTitle }}</span>
        <span class="result">{{ entry.result }}</span>
      </div>
    </div>
  </div>
</template>
```

---

## Интеграция с Pinia Store

Все composables используют `useGameStore()` для доступа к состоянию игры:

```typescript
const store = useGameStore()
```

### Game Store Methods

Composables вызывают следующие методы store:

```typescript
// applyRecoveryAction(actionData)
store.applyRecoveryAction(actionData)

// applyEventChoice(eventId, choiceId)
store.applyEventChoice(eventId, choiceId)

// collectInvestment(portfolioId)
store.collectInvestment(portfolioId)

// getFinanceOverview()
store.getFinanceOverview()

// getInvestments()
store.getInvestments()

// getNextEvent()
store.getNextEvent()

// getActivityLog(filter, limit)
store.getActivityLog(filter, limit)
```

---

## Reactivity и Auto-import

### Auto-import Nuxt

Nuxt автоматически импортирует composables, поэтому их можно использовать без явного импорта:

```vue
<script setup lang="ts">
// Автоматически доступен
const { canExecute, executeAction } = useActions()
const { showSuccess, showError } = useToast()
// ... и другие composables
</script>
```

### Reactivity

Composables возвращают reactive данные через:
- `Ref` для простых значений
- `ComputedRef` для вычисляемых значений

Это обеспечивает автоматическое обновление UI при изменении store.

---

## Best Practices

### 1. Декомпозиция логики

Composables позволяют выделить логику из компонентов:

**До:**
```vue
<script setup lang="ts">
import { useGameStore } from '@/stores/game.store'

const store = useGameStore()

function canExecute(actionId: string): boolean {
  // ... сложная логика проверки
}

function executeAction(actionId: string): void {
  // ... логика выполнения
}
</script>
```

**После:**
```vue
<script setup lang="ts">
const { canExecute, executeAction } = useActions()
</script>
```

### 2. Переиспользование

Composables можно использовать в любом компоненте:

```vue
<!-- RecoveryPage.vue -->
<script setup lang="ts">
const { canExecute, executeAction } = useActions()
</script>

<!-- ShopPage.vue -->
<script setup lang="ts">
const { canExecute, executeAction } = useActions()
</script>
```

### 3. Типизация

Composables обеспечивают типобезопасность:

```typescript
export function useActions() {
  function canExecute(actionId: string): boolean
  function executeAction(actionId: string): boolean
}
```

### 4. Тестирование

Composables легко тестировать:

```typescript
import { describe, it, expect } from 'vitest'
import { useActions } from '@/composables/useActions'

describe('useActions', () => {
  it('should check if action can be executed', () => {
    const { canExecute } = useActions()
    // ... тесты
  })
})
```

---

## Дополнительные ресурсы

- **[Nuxt 4 Documentation](https://nuxt.com/docs/guide/directory-structure/composables)**
- **[Vue 3 Composition API](https://vuejs.org/guide/introduction.html#composition-api)**
- **[Pinia Documentation](https://pinia.vuejs.org/)**
- **[ARCHITECTURE_OVERVIEW.md](core/ARCHITECTURE_OVERVIEW.md)** - Обзор архитектуры
- **[NUXT4_ARCHITECTURE.md](NUXT4_ARCHITECTURE.md)** - Nuxt 4 конфигурация

---

*Документ создан для Nuxt 4 + Vue 3 + TypeScript + Pinia*
