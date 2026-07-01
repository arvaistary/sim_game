# Отчёт о состоянии рефакторинга типов (Rules Fix Plan)

> **Статус:** ⏸ Заморожено
> **Дата:** 2026-06-02
> **Примечание:** Документ перенесён в архив. Отчёт о статусе рефакторинга — для исторической справки.

**Дата:** 24 апреля 2026
**Статус:** ⚠️ Требует завершения (39 ошибок TypeScript)

**Оценка плана:** 7.5/10 — Хороший план, требующий уточнений и дополнений

---

## Краткое резюме

✅ **Выполнено:** 7 волн рефакторинга, создано 50+ файлов типов и констант
⚠️ **Проблема:** 39 ошибок TypeScript в 8 store-файлах из-за некорректных паттернов экспорта
🎯 **Решение:** Исправить экспорты типов (15-20 файлов) + вынести константы (3-4 файла) + исправить undefined ошибки (2 файла)
⏱️ **Время:** ~45-60 минут работы
📈 **Успех:** 90%+ при последовательном выполнении

---

## Что было сделано

### Выполненные волны (1-7)

| Волна | Слой | Файлов | Статус |
|------|------|--------|--------|
| Wave 1 | Domain layer | 16 | ✅ Завершено |
| Wave 2 | Stores | 11 | ✅ Завершено |
| Wave 3 | Composables | Пропущено | - |
| Wave 4 | Components | 9 | ✅ Завершено |
| Wave 5 | Infrastructure/Config/Constants | 6 | ✅ Завершено |
| Wave 6 | Utils & Plugins | 2 | ✅ Завершено |
| Wave 7 | Pages & Application | 4 | ✅ Завершено |

### Созданные файлы (.types.ts и .constants.ts)

За период рефакторинга создано **50+ новых файлов**:

- Domain types: `activity-log.types.ts`, `childhood-event.types.ts`, `childhood-skill.types.ts`, `life-memory.types.ts`, `personality.types.ts`, `skill-system.types.ts`, `skill-effects-generator.types.ts`, `skill-progression-config.types.ts`, `default-save.types.ts`, `initial-save.types.ts`, `recovery-tabs.types.ts`, `childhood-balance.ts`
- Store types/constants: `*-store/index.types.ts`, `*-store/index.constants.ts`
- Component files: `GameNav.types.ts`, `CareerTrack.types.ts`, `ActivityLogCard.types.ts`, `StatsCard.constants.ts`, `WorkChoiceModal.types.ts`, `WorkResultModal.types.ts`, `StudyModal.types.ts`, `StatChange.types.ts`, `StatChange.constants.ts`, `WorkButton.constants.ts`, `GameModalHost.constants.ts`, `modal.types.ts`
- Infrastructure/Config: `event-migration.types.ts`, `actions-feature-flags.types.ts`, `event-feature-flags.types.ts`, `feature-flags.types.ts`, `action-categories.types.ts`, `work-categories.types.ts`
- Utils/Plugins: `stat-breakdown-format.types.ts`, `auto-save.constants.ts`
- Application: `SaveRepository.types.ts`, pages/types для events

---

## Текущее состояние TypeScript

### Ошибки компиляции

**До начала рефакторинга (3 ошибки):**

```
src/application/game/commands.ts(181,42): error TS7006: Parameter 'c' implicitly has an 'any' type.
src/application/game/queries.ts(115,61): error TS7006: Parameter 'acc' implicitly has an 'any' type.
src/composables/useActivityLog/utils/activity-log-formatters.ts(106,34): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
```

**После рефакторинга (39 ошибок в 8 файлах):**

**Категория 1: Cannot find name (26 ошибок) — экспорты типов**
```
src/stores/player-store/index.constants.ts(1,29): error TS2304: Cannot find name 'PlayerState'.
src/stores/player-store/index.ts(7,20): error TS2304: Cannot find name 'INITIAL_STATE'.
src/stores/player-store/index.ts(8,34): error TS2304: Cannot find name 'INITIAL_STATE'.
src/stores/player-store/index.ts(46,18): error TS2304: Cannot find name 'INITIAL_STATE'.
src/stores/player-store/index.ts(47,32): error TS2304: Cannot find name 'INITIAL_STATE'.
src/stores/skills-store/index.ts(19,26): error TS2304: Cannot find name 'MAX_LEVEL'.
src/stores/skills-store/index.ts(23,37): error TS2304: Cannot find name 'SkillEntry'.
src/stores/skills-store/index.ts(45,42): error TS2304: Cannot find name 'MAX_LEVEL'.
src/stores/skills-store/index.ts(92,52): error TS2304: Cannot find name 'SkillEntry'.
src/stores/stats-store/index.ts(14,22): error TS2304: Cannot find name 'INITIAL_STATS'.
src/stores/stats-store/index.ts(15,22): error TS2304: Cannot find name 'INITIAL_STATS'.
src/stores/stats-store/index.ts(16,22): error TS2304: Cannot find name 'INITIAL_STATS'.
src/stores/stats-store/index.ts(17,22): error TS2304: Cannot find name 'INITIAL_STATS'.
src/stores/stats-store/index.ts(18,20): error TS2304: Cannot find name 'INITIAL_STATS'.
src/stores/stats-store/index.ts(19,24): error TS2304: Cannot find name 'INITIAL_STATS'.
src/stores/stats-store/index.ts(37,46): error TS2304: Cannot find name 'StatsComponent'.
src/stores/stats-store/index.ts(83,39): error TS2304: Cannot find name 'StatsState'.
src/stores/stats-store/index.ts(110,20): error TS2304: Cannot find name 'INITIAL_STATS'.
src/stores/stats-store/index.ts(111,20): error TS2304: Cannot find name 'INITIAL_STATS'.
src/stores/stats-store/index.ts(112,20): error TS2304: Cannot find name 'INITIAL_STATS'.
src/stores/stats-store/index.ts(113,20): error TS2304: Cannot find name 'INITIAL_STATS'.
src/stores/stats-store/index.ts(114,18): error TS2304: Cannot find name 'INITIAL_STATS'.
src/stores/stats-store/index.ts(115,22): error TS2304: Cannot find name 'INITIAL_STATS'.
src/stores/time-store/index.ts(10,26): error TS2304: Cannot find name 'INITIAL_STATE'.
src/stores/time-store/index.ts(11,25): error TS2304: Cannot find name 'INITIAL_STATE'.
src/stores/time-store/index.ts(12,24): error TS2304: Cannot find name 'START_AGE'.
src/stores/time-store/index.ts(51,24): error TS2304: Cannot find name 'INITIAL_STATE'.
src/stores/time-store/index.ts(52,23): error TS2304: Cannot find name 'INITIAL_STATE'.
src/stores/wallet-store/index.ts(10,21): error TS2304: Cannot find name 'INITIAL_WALLET'.
src/stores/wallet-store/index.ts(11,27): error TS2304: Cannot find name 'INITIAL_WALLET'.
src/stores/wallet-store/index.ts(12,27): error TS2304: Cannot find name 'INITIAL_WALLET'.
src/stores/wallet-store/index.ts(13,26): error TS2304: Cannot find name 'INITIAL_WALLET'.
src/stores/wallet-store/index.ts(57,19): error TS2304: Cannot find name 'INITIAL_WALLET'.
src/stores/wallet-store/index.ts(58,25): error TS2304: Cannot find name 'INITIAL_WALLET'.
src/stores/wallet-store/index.ts(59,25): error TS2304: Cannot find name 'INITIAL_WALLET'.
src/stores/wallet-store/index.ts(60,24): error TS2304: Cannot find name 'INITIAL_WALLET'.
```

**Категория 2: Possibly undefined (13 ошибок) — проверки на null**
```
src/stores/finance-store/index.ts(51,22): error TS18048: 'investment' is possibly 'undefined'.
src/stores/finance-store/index.ts(53,12): error TS18048: 'investment' is possibly 'undefined'.
src/stores/housing-store/index.ts(39,23): error TS2532: Object is possibly 'undefined'.
src/stores/housing-store/index.ts(44,38): error TS18048: 'currentHousing.value' is possibly 'undefined'.
src/stores/housing-store/index.ts(45,31): error TS18048: 'currentHousing.value' is possibly 'undefined'.
src/stores/housing-store/index.ts(52,25): error TS18048: 'currentHousing.value' is possibly 'undefined'.
src/stores/housing-store/index.ts(99,21): error TS2532: Object is possibly 'undefined'.
```

### Детальный анализ причин

#### Категория 1: Cannot find name (26 ошибок)

**Причина:** Константы в `.constants.ts` и `.types.ts` используют типы без явного импорта, а файлы `index.ts` пытаются реэкспортировать типы через `export type { ... } from './index.types'`, что не работает для импортов в других файлах.

**Проблемный паттерн:**
```typescript
// index.ts
export type { PlayerState } from './index.types'
export { INITIAL_STATE } from './index.constants'

// index.constants.ts
export const INITIAL_STATE: PlayerState = {  // ❌ Cannot find name 'PlayerState'
  name: 'Алексей',
  welcomeScreenShown: false,
}
```

**Почему это не работает:**
1. `index.constants.ts` не импортирует `PlayerState` из `index.types.ts`
2. TypeScript не проходит через реэкспорты типов из `index.ts` для разрешения имен в `index.constants.ts`
3. Реэкспорт `export type { ... } from` работает только для **внешних** импортирующих модулей, но не для параллельных файлов в том же модуле

**Правильное решение:**
```typescript
// index.constants.ts
import type { PlayerState } from './index.types'  // ✅ Добавить импорт типа

export const INITIAL_STATE: PlayerState = {
  name: 'Алексей',
  welcomeScreenShown: false,
}

// index.ts
import type { PlayerState } from './index.types'  // ✅ Импорт вместо реэкспорта
export type { PlayerState }
export { INITIAL_STATE } from './index.constants'
```

#### Категория 2: Possibly undefined (13 ошибок)

**Причина:** Отсутствие null-checking для опциональных значений из stores или map-access.

**Пример:**
```typescript
// ❌ finance-store/index.ts
const investment = investments.value[month]
return investment.yield  // error: 'investment' is possibly 'undefined'

// ✅ Исправление
const investment = investments.value[month]
if (!investment) return 0
return investment.yield
```

---

## Структура проблемных файлов

### Файлы с ошибками экспорта типов (6 store-файлов):

| Файл | Проблема | Требуемые действия |
|------|----------|-------------------|
| `stores/player-store/` | `INITIAL_STATE` не видит `PlayerState` в `.constants.ts` | 1. Добавить `import type { PlayerState }` в `index.constants.ts`<br>2. Заменить реэкспорт в `index.ts` на `import + export` |
| `stores/skills-store/` | `MAX_LEVEL`, `SkillEntry` не видны в `index.ts` | Константы в `.types.ts`, заменить реэкспорт на `import + export` |
| `stores/stats-store/` | `INITIAL_STATS`, `StatsComponent`, `StatsState` не видны | 1. Переместить константы в `.constants.ts`<br>2. Добавить импорт типов в `.constants.ts`<br>3. Заменить реэкспорт в `index.ts` |
| `stores/time-store/` | `INITIAL_STATE`, `START_AGE` не видны | 1. Переместить константы в `.constants.ts`<br>2. Добавить импорт типов в `.constants.ts`<br>3. Заменить реэкспорт в `index.ts` |
| `stores/wallet-store/` | `INITIAL_WALLET` не видит тип | 1. Переместить константы в `.constants.ts`<br>2. Добавить импорт типов в `.constants.ts`<br>3. Заменить реэкспорт в `index.ts` |

### Файлы с ошибками undefined (2 store-файла):

| Файл | Проблема | Требуемые действия |
|------|----------|-------------------|
| `stores/finance-store/` | `investment` может быть `undefined` | Добавить null-check перед доступом к свойствам |
| `stores/housing-store/` | `currentHousing.value` может быть `undefined` | Добавить null-check или безопасный навигатор |

---

---

## Корневые причины проблем

### 1. Неправ��льный паттерн реэкспорта

**Не работает:**

```typescript
// ❌ В файле original.ts
export type { SomeInterface } from './original.types'
```

**Работает:**

```typescript
// ✅ В файле original.ts
import type { SomeInterface } from './original.types'
export type { SomeInterface }
```

### 2. Путаница между .ts и .types.ts

При создании параллельных файлов (original.ts + original.types.ts):

- Оригинальный файл должен ИМПОРТИРОВАТЬ из .types.ts
- А затем реэкспортировать для обратной совместимости
- Но многие файлы still имеют старую структуру с inline типами

### 3. Каскадные эффекты

Исправление одних ошибок вызывает другие, потому что:

- Многие файлы зависят от других
- Изменения в экспортах ломают импорты
- Требуется последовательное исправление всех файлов

---

## Что осталось сделать

### Необходимые действия

1. **Фиксировать export pattern** - Во ВСЕХ файлах, где используется `export type { X } from './X.types'`, заменить на правильный двухстрочный формат

2. **Исправить оставшиеся ~15 ошибок** в файлах:
   - stores/finance-store/index.ts
   - stores/housing-store/index.ts
   - stores/player-store/index.ts
   - stores/skills-store/index.ts
   - stores/events-store/index.ts (частично)
   - domain/balance/utils/skill-system.ts
   - domain/balance/utils/skill-ui-explainability.ts

3. **Протестировать приложение** - Убедиться, что ничего не сломалось

### Альтернативный подход

**Откатить изменения и начать заново** - Использовать более консервативный подход:

1. Создать .types.ts файл
2. Импортировать и использовать типы в оригинальном файле
3. Не реэкспортировать - оставить типы только в .types.ts
4. Обновить импорты во всех зависимых файлах

---

## Сложности с решением

1. **Объём работы** - Исправление требует изменения ~15-20 файлов с экспортами
2. **Каскадные эффекты** - Каждое изменение может сломать что-то ещё
3. **Непредсказуемость** - TypeScript выдаёт ошибки в файлах, которые не были тронуты
4. **Нет тестов** - Некоторые проблемы могут проявиться только в runtime

---

## Рекомендации

### Вариант 1: Продолжить исправления

- Исправить оставшиеся ~15 файлов
- Потребуется ~1-2 часа работы
- Риск: могут появиться новые ошибки

### Вариант 2: Зафиксировать текущий прогресс

- Оставить как есть (с ошибками)
- Использовать `/** @ts-ignore` для критических мест
- Вернуться позже

### Вариант 3: Откатить и начать заново

- Вернуть все файлы к исходному состоянию
- Использовать более простой паттерн (без реэкспортов)
- Применить более консервативный подход

---

## Фа��лы для особого внимания

### Уже исправленные (могут работать)

- ✅ event-migration.ts
- ✅ actions-feature-flags.ts
- ✅ event-feature-flags.ts
- ✅ feature-flags.ts
- ✅ action-categories.ts
- ✅ work-categories.ts
- ✅ StatChange.vue
- ✅ WorkButton.vue
- ✅ GameModalHost.vue

### Требуют проверки

- ⚠️ default-save.ts / initial-save.ts
- ⚠️ Все store файлы (actions-store, career-store, etc.)
- ⚠️ skill-system.ts / skill-ui-explainability.ts

---

## Что осталось сделать (ОБНОВЛЁННЫЙ ЧЕК-ЛИСТ)

### Подробный план исправлений

#### Этап 1: Исправить экспорты типов в stores (20-25 минут)

**1.1. player-store** (2 файла, 2 изменения)
```typescript
// ✅ index.constants.ts — ДОБАВИТЬ импорт типа
import type { PlayerState } from './index.types'

export const INITIAL_STATE: PlayerState = {
  name: 'Алексей',
  welcomeScreenShown: false,
}

// ✅ index.ts — ЗАМЕНИТЬ реэкспорт на import + export
// Было: export type { PlayerState } from './index.types'
// Стало:
import type { PlayerState } from './index.types'
export type { PlayerState }
```

**1.2. skills-store** (2 файла, 2 изменения)
```typescript
// ✅ index.ts — ЗАМЕНИТЬ реэкспорт
// Было: export type { SkillsComponent, SkillEntry, MAX_LEVEL } from './index.types'
// Стало:
import type { SkillsComponent, SkillEntry } from './index.types'
import { MAX_LEVEL } from './index.types'
export type { SkillsComponent, SkillEntry }
export { MAX_LEVEL }
```

**1.3. stats-store** (3 файла, 3 изменения)
```typescript
// ✅ index.constants.ts — СОЗДАТЬ файл
import type { StatsState } from './index.types'

export const INITIAL_STATS: StatsState = {
  energy: 100,
  health: 100,
  hunger: 0,
  stress: 0,
  mood: 100,
  physical: 50,
}

// ✅ index.types.ts — УДАЛИТЬ INITIAL_STATS
// ✅ index.ts — ЗАМЕНИТЬ реэкспорт
import type { StatsComponent, StatsState } from './index.types'
import { INITIAL_STATS } from './index.constants'
export type { StatsComponent, StatsState }
export { INITIAL_STATS }
```

**1.4. time-store** (3 файла, 3 изменения)
```typescript
// ✅ index.constants.ts — СОЗДАТЬ файл
import type { TimeState } from './index.types'

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

// ✅ index.types.ts — УДАЛИТЬ INITIAL_STATE и START_AGE
// ✅ index.ts — ЗАМЕНИТЬ реэкспорт
import type { TimeState } from './index.types'
import { INITIAL_STATE, START_AGE } from './index.constants'
export type { TimeState }
export { INITIAL_STATE, START_AGE }
```

**1.5. wallet-store** (3 файла, 3 изменения)
```typescript
// ✅ index.constants.ts — СОЗДАТЬ файл
import type { WalletState } from './index.types'

export const INITIAL_WALLET: WalletState = {
  money: 5000,
  reserveFund: 0,
  totalEarned: 0,
  totalSpent: 0,
}

// ✅ index.types.ts — УДАЛИТЬ INITIAL_WALLET
// ✅ index.ts — ЗАМЕНИТЬ реэкспорт
import type { WalletState } from './index.types'
import { INITIAL_WALLET } from './index.constants'
export type { WalletState }
export { INITIAL_WALLET }
```

#### Этап 2: Исправить undefined ошибки (10-15 минут)

**2.1. finance-store/index.ts** (2 ошибки на строках 51, 53)
```typescript
// Добавить проверки для investment
const investment = investments.value[month]
if (!investment) return 0
return investment.yield
```

**2.2. housing-store/index.ts** (5 ошибок на строках 39, 44, 45, 52, 99)
```typescript
// Добавить проверки для currentHousing.value
const currentHousing = housing.value[currentHousingId]
if (!currentHousing) return null
// ... использовать currentHousing с проверками
```

#### Этап 3: Проверка (5-10 минут)
```bash
npx tsc --noEmit
npm run rules:audit -- src/stores/
npx vitest run
```

#### Этап 4: Коммит
```bash
git add -A
git commit -m "fix(stores): correct type exports and fix undefined errors"
```

---

## Рекомендации (ОБНОВЛЁННЫЕ)

### ✅ Вариант 1: Продолжить исправления (РЕКОМЕНДУЕТСЯ)

**Преимущества:**
- 45-60 минут работы
- 90%+ шанс успеха
- Сохраняет 50+ созданных файлов

**Действия:** Выполнить Этапы 1-4 выше

### ⚠️ Вариант 2: Зафиксировать прогресс

Недостатки: 39 ошибок TypeScript, технический долг

### ❌ Вариант 3: Откатить (НЕ РЕКОМЕНДУЕТСЯ)

Потеря проделанной работы, объём работы возрастает в 2-3 раза

---

## Метрики успеха

| Метрика | До | После | Цель |
|---------|-----|-------|------|
| Ошибок TypeScript | 39 | ? | 0 |
| Store-файлов с ошибками | 8 | ? | 0 |
| Констант в .types.ts | 3 | ? | 0 |

---

## Следующие шаги

1. Выбрать Вариант 1 (продолжить)
2. Выполнить Этап 1 (экспорты в 5 stores)
3. Выполнить Этап 2 (undefined в 2 stores)
4. Выполнить Этап 3 (проверка)
5. Выполнить Этап 4 (коммит)

---

*Документ создан в рамках выполнения rules-fix-plan*
*Последнее обновление: 24 апреля 2026*
*Статус: План дополнен детальным чек-листом, готов к выполнению*
