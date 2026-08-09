# Справочник Vue Composables

**Последнее обновление:** 2 июня 2026
**Технологический стек:** Nuxt 4 + Vue 3 + TypeScript + Pinia

---

## Обзор

Composables в проекте Game Life - это переиспользуемые функции с Composition API для логики Vue компонентов. Каждый composable инкапсулирует определённую функциональность и предоставляет её через реактивные API.

---

## useActions

**Путь:** `src/composables/useActions/index.ts`

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
```

---

## useFinance

**Путь:** `src/composables/useFinance/index.ts`

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

### Пример использования

```vue
<script setup lang="ts">
const { overview, investments, collectInvestment } = useFinance()

function handleCollect(portfolioId: string) {
  collectInvestment(portfolioId)
}
</script>
```

---

## useEvents

**Путь:** `src/composables/useEvents/index.ts`

**Назначение:** Работа с событиями игры (очередь, выбор решений)

### API

```typescript
export function useEvents() {
  // Текущее событие
  currentEvent: Ref<GameEvent | null>

  // Проверка наличия следующего события
  hasNextEvent: ComputedRef<boolean>

  // Загрузка следующего события
  loadNextEvent(): GameEvent | null

  // Применение выбора решения
  applyChoice(choiceId: string): Promise<boolean>
}
```

---

## useToast

**Путь:** `src/composables/useToast/index.ts`

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

---

## useActivityLog

**Путь:** `src/composables/useActivityLog/index.ts`

**Назначение:** Работа с журналом активности игрока

### API

```typescript
export function useActivityLog() {
  // Получение записей журнала
  getActivityLog(filter?: ActivityLogFilter, limit?: number): ActivityLogEntry[]
}
```

---

## useSkills

**Путь:** `src/composables/useSkills/index.ts`

**Назначение:** Работа с навыками персонажа

### API

```typescript
export function useSkills() {
  // Навыки персонажа
  skills: ComputedRef<Skill[]>

  // Получение уровня навыка
  getSkillLevel(skillId: string): number

  // Получение прогресса навыка
  getSkillProgress(skillId: string): number
}
```

---

## useTime

**Путь:** `src/composables/useTime/index.ts`

**Назначение:** Работа со временем игры

### API

```typescript
export function useTime() {
  // Текущий возраст
  age: ComputedRef<number>

  // Текущая возрастная группа
  currentAgeGroup: ComputedRef<AgeGroup>

  // Текущий месяц
  currentMonth: ComputedRef<number>

  // Текущий год
  currentYear: ComputedRef<number>

  // Продвижение времени
  advanceTime(hours: number): void
}
```

---

## useCareer

**Путь:** `src/composables/useCareer/index.ts`

**Назначение:** Работа с карьерой персонажа

### API

```typescript
export function useCareer() {
  // Текущая работа
  currentJob: ComputedRef<CareerJob | null>

  // Карьерный трек
  careerTrack: ComputedRef<CareerTrackEntry>

  // Профессионализм
  professionalism: ComputedRef<number>

  // Опыт работы
  workExperience: ComputedRef<number>

  // Подача заявки на работу
  applyForJob(jobId: string): boolean

  // Смена работы
  changeJob(jobId: string): boolean

  // Получение карьерного трека
  getCareerTrack(): CareerTrackEntry
}
```

---

## useEducation

**Путь:** `src/composables/useEducation/index.ts`

**Назначение:** Работа с образованием персонажа

### API

```typescript
export function useEducation() {
  // Активная программа
  activeProgram: ComputedRef<EducationProgram | null>

  // Прогресс образования
  educationProgress: ComputedRef<number>

  // Образовательный ранг
  educationRank: ComputedRef<EducationRank | null>

  // Начало программы
  startProgram(programId: string): boolean

  // Прогресс обучения
  advanceProgress(): boolean

  // Завершение программы
  completeProgram(): void

  // Проверка возможности обучения
  canStartProgram(programId: string): boolean
}
```

---

## useWallet

**Путь:** `src/composables/useWallet/index.ts`

**Назначение:** Работа с кошельком персонажа

### API

```typescript
export function useWallet() {
  // Баланс кошелька
  balance: ComputedRef<number>

  // Доход
  income: ComputedRef<number>

  // Расходы
  expenses: ComputedRef<number>

  // Трата денег
  spend(amount: number): boolean

  // Получение денег
  earn(amount: number): void
}
```

---

## useHousing

**Путь:** `src/composables/useHousing/index.ts`

**Назначение:** Работа с жильём персонажа

### API

```typescript
export function useHousing() {
  // Текущее жильё
  currentHousing: ComputedRef<HousingLevel | null>

  // Мебель
  furniture: ComputedRef<Furniture[]>

  // Контракт аренды
  rentalContract: ComputedRef<RentalContract | null>

  // Улучшение жилья
  upgradeHousing(): boolean

  // Ухудшение жилья
  downgradeHousing(): boolean

  // Добавление мебели
  addFurniture(furniture: Furniture): void

  // Удаление мебели
  removeFurniture(furnitureId: string): void
}
```

---

## useGameModal

**Путь:** `src/composables/useGameModal/index.ts`

**Назначение:** Работа с модальными окнами игры

### API

```typescript
export function useGameModal() {
  // Открыть модальное окно
  openModal(type: string, data?: unknown): void

  // Закрыть модальное окно
  closeModal(): void

  // Текущее модальное окно
  currentModal: Ref<GameModal | null>
}
```

---

## useModalStack

**Путь:** `src/composables/useModalStack/index.ts`

**Назначение:** Управление стеком модальных окон

### API

```typescript
export function useModalStack() {
  // Стек модальных окон
  modalStack: Ref<GameModal[]>

  // Открыть модальное окно (добавить в стек)
  pushModal(modal: GameModal): void

  // Закрыть модальное окно (удалить из стека)
  popModal(): void

  // Закрыть все модальные окна
  clearStack(): void
}
```

---

## Reactivity и Auto-import

### Auto-import Nuxt

Nuxt автоматически импортирует composables, поэтому их можно использовать без явного импорта:

```vue
<script setup lang="ts">
// Автоматически доступны
const { canExecute, executeAction } = useActions()
const { showSuccess, showError } = useToast()
const { overview, investments } = useFinance()
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

Composables можно использовать в любом компоненте.

### 3. Типизация

Composables обеспечивают типобезопасность.

### 4. Тестирование

Composables легко тестировать.

---

## Дополнительные ресурсы

- **[Nuxt 4 Documentation](https://nuxt.com/docs/guide/directory-structure/composables)**
- **[Vue 3 Composition API](https://vuejs.org/guide/introduction.html#composition-api)**
- **[Pinia Documentation](https://pinia.vuejs.org/)**
- **[../core/ARCHITECTURE_OVERVIEW.md](../core/ARCHITECTURE_OVERVIEW.md)** - Обзор архитектуры
- **[STORES_REFERENCE.md](./STORES_REFERENCE.md)** - Справочник stores

---

**Последнее обновление:** 2 июня 2026