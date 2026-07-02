# Чек-лист исправления stores (Только то, что нужно сделать)

> **Статус:** ⏸ Заморожено
> **Дата:** 2026-06-02
> **Примечание:** Документ перенесён в архив. Чек-лист рефакторинга stores — для исторической справки.

**Дата:** 24 апреля 2026
**Статус:** К выполнению

---

## Правильный паттерн для stores

```
index.types.ts          → Только типы (interface, type)
index.constants.ts      → Только константы (const)
index.ts                → Только реализация + импорт констант
```

**Правила:**
1. ✅ Типы объявляются в `index.types.ts` (или `*.types.ts`) и импортируются там, где используются
2. ✅ `index.ts` может импортировать типы (`import type`) для аннотаций public API и локальных переменных
3. ⚠️ Не реэкспортировать типы из `index.ts` без необходимости (предпочтительно импортировать из `*.types.ts` напрямую)
4. ✅ Константы только в `.constants.ts`, типы только в `.types.ts`
5. ✅ В `index.ts` импортировать runtime-константы из `.constants.ts`; типы — через `import type`

---

## Чек-лист исправлений

### 1. player-store (2 файла)

#### ✅ index.constants.ts
```typescript
import type { PlayerState } from './index.types'  // ✅ ОСТАВИТЬ

export const INITIAL_STATE: PlayerState = {
  name: 'Алексей',
  welcomeScreenShown: false,
}
```

#### ❌ index.ts — НУЖНО ИСПРАВИТЬ
```typescript
// УДАЛИТЬ:
// export type { PlayerState }  // если реэкспорт не нужен за пределами модуля

// ДОЛЖНО БЫТЬ:
export { INITIAL_STATE } from './index.constants'

export const usePlayerStore = defineStore('player', () => {
  const name = ref(INITIAL_STATE.name)
  // ...
})
```

---

### 2. skills-store (1 файл)

#### ❌ index.ts — НУЖНО ИСПРАВИТЬ
```typescript
// УДАЛИТЬ:
// export type { SkillsComponent, SkillEntry }
// import { MAX_LEVEL } from './index.types'   // константа не должна жить в .types.ts

// ДОЛЖНО БЫТЬ:
export const useSkillsStore = defineStore('skills', () => {
  const skills = ref<Record<string, SkillEntry>>({})
  // ...
})

// Импортировать типы напрямую из .types.ts в местах использования (внутри store)
```

**Важно:** Если `MAX_LEVEL` используется внутри store — вынести в `index.constants.ts` и импортировать оттуда:

```typescript
import { MAX_LEVEL } from './index.constants'

const clampedLevel = clamp(level, 0, MAX_LEVEL)
```

---

### 3. stats-store (2 файла)

#### ✅ index.constants.ts
```typescript
import type { StatsState } from './index.types'  // ✅ ОСТАВИТЬ

export const INITIAL_STATS: StatsState = {
  energy: 100,
  health: 100,
  hunger: 0,
  stress: 0,
  mood: 100,
  physical: 50,
}
```

#### ✅ index.types.ts
```typescript
// ✅ ОСТАВИТЬ (без констант):
export interface StatsComponent {
  energy: number
  health: number
  hunger: number
  stress: number
  mood: number
  physical: number
}

export interface StatsState {
  energy: number
  health: number
  hunger: number
  stress: number
  mood: number
  physical: number
}
```

#### ❌ index.ts — НУЖНО ИСПРАВИТЬ
```typescript
// УДАЛИТЬ:
// export type { StatsComponent, StatsState }
// export { INITIAL_STATS } // реэкспорт не нужен

// ДОЛЖНО БЫТЬ:
import { INITIAL_STATS } from './index.constants'
import type { StatsComponent, StatsState } from './index.types'

export const useStatsStore = defineStore('stats', () => {
  const energy = ref(INITIAL_STATS.energy)
  // ...
})

// Импортировать типы напрямую из .types.ts в аннотациях:
// ref<StatsState>()
// computed<StatsComponent>()
```

---

### 4. time-store (2 файла)

#### ✅ index.constants.ts
```typescript
import type { TimeState } from './index.types'  // ✅ ОСТАВИТЬ

export const INITIAL_STATE: TimeState = {
  totalHours: 0,
  gameDays: 0,
  gameWeeks: 0,
  gameMonths: 0,
  gameYears: 0,
  currentAge: 18,
  sleepDebt: 0,
}

export const START_AGE = 18
```

#### ✅ index.types.ts
```typescript
// ✅ ОСТАВИТЬ (без констант):
export interface TimeState {
  totalHours: number
  gameDays: number
  gameWeeks: number
  gameMonths: number
  gameYears: number
  currentAge: number
  sleepDebt: number
}
```

#### ❌ index.ts — НУЖНО ИСПРАВИТЬ
```typescript
// УДАЛИТЬ:
// export type { TimeState }
// export { INITIAL_STATE, START_AGE } // реэкспорт не нужен

// ДОЛЖНО БЫТЬ:
import { INITIAL_STATE, START_AGE } from './index.constants'
import type { TimeState } from './index.types'

export const useTimeStore = defineStore('time', () => {
  const totalHours = ref(INITIAL_STATE.totalHours)
  const startAge = ref(START_AGE)
  // ...
})

// Импортировать типы напрямую из .types.ts в аннотациях:
// ref<TimeState>()
```

---

### 5. wallet-store (2 файла)

#### ✅ index.constants.ts
```typescript
import type { WalletState } from './index.types'  // ✅ ОСТАВИТЬ

export const INITIAL_WALLET: WalletState = {
  money: 5000,
  reserveFund: 0,
  totalEarned: 0,
  totalSpent: 0,
}
```

#### ✅ index.types.ts
```typescript
// ✅ ОСТАВИТЬ (без констант):
export interface WalletState {
  money: number
  reserveFund: number
  totalEarned: number
  totalSpent: number
}
```

#### ❌ index.ts — НУЖНО ИСПРАВИТЬ
```typescript
// УДАЛИТЬ:
// export type { WalletState }
// export { INITIAL_WALLET } // реэкспорт не нужен

// ДОЛЖНО БЫТЬ:
import { INITIAL_WALLET } from './index.constants'
import type { WalletState } from './index.types'

export const useWalletStore = defineStore('wallet', () => {
  const money = ref(INITIAL_WALLET.money)
  // ...
})

// Импортировать типы напрямую из .types.ts в аннотациях:
// ref<WalletState>()
```

---

## Этап 2: Исправить undefined ошибки

### 6. finance-store/index.ts (2 места)

**Ошибка на строках 51, 53:** `investment is possibly 'undefined'`

#### ❌ Было:
```typescript
const divest = (investmentId: string): number => {
  const index = investments.value.findIndex(inv => inv.id === investmentId)
  if (index === -1) return 0

  const investment = investments.value[index]
  investments.value.splice(index, 1)
  walletStore.earn(investment.amount, false)  // ❌ Ошибка здесь

  return investment.amount  // ❌ И здесь
}
```

#### ✅ Стало:
```typescript
const divest = (investmentId: string): number => {
  const index = investments.value.findIndex(inv => inv.id === investmentId)
  if (index === -1) return 0

  const investment = investments.value[index]
  if (!investment) return 0  // ✅ Добавить проверку

  investments.value.splice(index, 1)
  walletStore.earn(investment.amount, false)

  return investment.amount
}
```

---

### 7. housing-store/index.ts (5 мест)

**Ошибки на строках 39, 44, 45, 52, 99:** `currentHousing.value is possibly 'undefined'`

#### ❌ Было (пример):
```typescript
const currentHousing = housing.value[currentHousingId]
return currentHousing.monthlyCost  // ❌ Ошибка
```

#### ✅ Стало:
```typescript
const currentHousing = housing.value[currentHousingId]
if (!currentHousing) return null  // ✅ Добавить проверку
return currentHousing.monthlyCost
```

**Применить аналогичные проверки для всех 5 мест:**
- Строка 39
- Строка 44
- Строка 45
- Строка 52
- Строка 99

---

## Проверка после исправлений

```bash
# 1. Проверка TypeScript
npm run typecheck

# 2. Аудит правил
npm run rules:audit -- src/stores/

# 3. Тесты
npx vitest run
```

---

## Итоговая структура каждого store

```
stores/player-store/
├── index.types.ts       # Только типы
├── index.constants.ts   # Только константы (с import type из .types.ts)
└── index.ts             # Реализация + import { INITIAL_STATE } from './index.constants'
```

**Ключевой момент:** В `index.ts` допускаются `import type` для аннотаций; runtime-импорты должны оставаться чистыми (константы/функции из `.constants.ts` и соседних модулей).

---

*Документ создан для быстрого исправления ошибок*
*Последнее обновление: 24 апреля 2026*
