# План: Вынос инлайновых типов и констант

## Цель

Вынести из файлов инлайновые объявления `interface`, `type` и `const` в специализированные файлы внутри модулей. Устранить дублирование.

---

## Принцип организации

Каждая система в `src/domain/engine/systems/` превращается в **папку** с именем системы:

```
src/domain/engine/systems/
├── ActionSystem/
│   ├── index.ts              # сама система (бывший ActionSystem.ts)
│   ├── index.types.ts        # типы, которые использует только index.ts
│   ├── index.constants.ts    # константы, которые использует только index.ts
│   └── index.utils.ts        # утилиты, которые использует только index.ts (если есть)
├── TimeSystem/
│   ├── index.ts
│   ├── index.types.ts
│   ├── index.constants.ts
│   └── index.utils.ts
├── ...и т.д.
```

Аналогичный подход для `game-facade` и `shared`.

---

## 1. Инвентаризация: что найдено

### Легенда

| Символ | Значение |
|--------|----------|
| 🔴 | Дубликат (определён в нескольких местах) |
| 🟡 | Конфликт имён (одно имя — разная структура) |
| ⚪ | Уникальный инлайн, просто нужно вынести |

---

## 2. Типы (interface / type), объявленные инлайн

### 2.1. `ActionSystem` → `systems/ActionSystem/index.types.ts`

| Линии (старый файл) | Имя | Статус |
|----------------------|-----|--------|
| 24–60 | `ActionData` | ⚪ |
| 62–65 | `AvailabilityCheck` | ⚪ |
| 67–71 | `ExecuteResult` | ⚪ |

### 2.2. `TimeSystem` → `systems/TimeSystem/index.types.ts`

| Линии | Имя | Статус |
|-------|-----|--------|
| 13–35 | `TimeComponent` | 🟡 Конфликт: в `engine/types/index.ts` уже есть `TimeComponent` с **другими** полями → переименовать в `RuntimeTimeComponent` |
| 37–41 | `AdvanceOptions` | ⚪ |
| 43–48 | `AdvanceResult` | ⚪ |
| 50 | `PeriodicCallback` | ⚪ |

### 2.3. `MonthlySettlementSystem` → `systems/MonthlySettlementSystem/index.types.ts`

| Линии | Имя | Статус |
|-------|-----|--------|
| 20–23 | `SettlementResult` | ⚪ |
| 25–33 | `SettlementData` | ⚪ |

### 2.4. `CareerProgressSystem` → `systems/CareerProgressSystem/index.types.ts`

| Линии | Имя | Статус |
|-------|-----|--------|
| 14–21 | `CareerTrackEntry` | ⚪ |
| 23–27 | `ChangeCareerResult` | ⚪ |

### 2.5. `EducationSystem` → `systems/EducationSystem/index.types.ts`

| Линии | Имя | Статус |
|-------|-----|--------|
| 15–18 | `CanStartResult` | ⚪ |
| 20–23 | `StartResult` | ⚪ |
| 25–28 | `AdvanceResult` | ⚪ |
| 30–40 | `ActiveCourse` | ⚪ |

### 2.6. `EventChoiceSystem` → `systems/EventChoiceSystem/index.types.ts`

| Линии | Имя | Статус |
|-------|-----|--------|
| 17–34 | `EventChoice` | 🟡 Конфликт: в `engine/types/index.ts` уже есть `EventChoice` → переименовать в `RuntimeEventChoice` |
| 36–45 | `GameEvent` | 🟡 Конфликт: в `engine/types/index.ts` уже есть `GameEvent` → переименовать в `RuntimeGameEvent` |
| 47–50 | `EventChoiceResult` | ⚪ |
| 52–56 | `ResolvedChoice` | ⚪ |

### 2.7. `FinanceActionSystem` → `systems/FinanceActionSystem/index.types.ts`

| Линии | Имя | Статус |
|-------|-----|--------|
| 60–71 | `FinanceOverview` | ⚪ |
| 73–76 | `FinanceActionResult` | ⚪ |
| 78–81 | `FinanceActionWithAvailability` | ⚪ |

### 2.8. `PersistenceSystem` → `systems/PersistenceSystem/index.types.ts`

| Линии | Имя | Статус |
|-------|-----|--------|
| 6–10 | `ValidationResult` | ⚪ |
| 12 | `MigrationFn` | 🔴 Дубликат: такой же в `MigrationSystem.ts` |

### 2.9. `SkillsSystem` → `systems/SkillsSystem/index.types.ts`

| Линии | Имя | Статус |
|-------|-----|--------|
| 6–10 | `SkillChangeResult` | ⚪ |

### 2.10. `WorkPeriodSystem` → `systems/WorkPeriodSystem/index.types.ts`

| Линии | Имя | Статус |
|-------|-----|--------|
| 18–24 | `EventChoice` | 🟡 Конфликт: 3 разных `EventChoice` → переименовать в `WorkEventChoice` |

### 2.11. `InvestmentSystem` → `systems/InvestmentSystem/index.types.ts`

| Линии | Имя | Статус |
|-------|-----|--------|
| 8–15 | `InvestmentConfig` | ⚪ |
| 17–29 | `InvestmentRecord` | ⚪ |
| 31–36 | `InvestmentWithState` | ⚪ |
| 38–42 | `InvestmentResult` | ⚪ |

### 2.12. `ActivityLogSystem` → `systems/ActivityLogSystem/index.types.ts`

| Линии | Имя | Статус |
|-------|-----|--------|
| 8–16 | `LogTimestamp` | ⚪ |
| 18–28 | `LogEntry` | ⚪ |
| 30–33 | `LogComponent` | ⚪ |
| 35–40 | `GetEntriesOptions` | ⚪ |
| 42–46 | `GetEntriesResult` | ⚪ |
| 48–53 | `GetEntriesWindowOptions` | ⚪ |
| 55–61 | `GetEntriesWindowResult` | ⚪ |
| 63–66 | `EventListenerEntry` | ⚪ |

### 2.13. `MigrationSystem` → `systems/MigrationSystem/index.types.ts`

| Линии | Имя | Статус |
|-------|-----|--------|
| 4 | `MigrationFn` | 🔴 Дубликат: такой же в `PersistenceSystem` → общий тип в одном из `index.types.ts`, реэкспорт из другого |

### 2.14. `game-facade/system-context.ts` → `game-facade/index.types.ts`

| Линии | Имя | Статус |
|-------|-----|--------|
| 21–36 | `SystemContext` | ⚪ |

### 2.15. `game-facade/commands.ts` + `queries.ts`

| Линии | Имя | Статус |
|-------|-----|--------|
| 4 (commands) | `AnyRecord` | 🔴 Дубликат: такой же в `queries.ts` → вынести в `game-facade/index.types.ts` |

### 2.16. `shared/utils/activity-log-formatters.ts` → `shared/types/activity-log.ts`

| Линии | Имя | Статус |
|-------|-----|--------|
| 24–31 | `ActionMetadata` | ⚪ |
| 33–38 | `ActivityLogEntry` | ⚪ |

### 2.17. `composables/useActivityLog.ts`

| Линии | Имя | Статус |
|-------|-----|--------|
| 7–14 | `DisplayLogEntry` | ⚪ — оставить в composable (composable-специфичный) |

### 2.18. `pages/MainPage.vue`

| Линии | Имя | Статус |
|-------|-----|--------|
| 136–140 | `LogEntryDisplay` | ⚪ — оставить (локальный Vue-тип) |

### 2.19. `engine/utils/activity-log-description.ts`

| Линии | Имя | Статус |
|-------|-----|--------|
| 1–8 | Анонимный тип в параметре функции | ⚪ — вынести в `ActivityLogSystem/index.types.ts` как `ActionLogDescriptionInput` |

---

## 3. Константы, объявленные инлайн

### 3.1. `TimeSystem` → `systems/TimeSystem/index.constants.ts`

| Линии | Имя | Значение |
|-------|-----|----------|
| 59 | `HOURS_IN_DAY` | 24 |
| 60 | `HOURS_IN_WEEK` | 168 |
| 61 | `WEEKS_IN_MONTH` | 4 |
| 62 | `MONTHS_IN_YEAR` | 12 |
| 63 | `DAYS_IN_AGE_YEAR` | 360 |

### 3.2. `FinanceActionSystem` → `systems/FinanceActionSystem/index.constants.ts`

| Линии | Имя |
|-------|-----|
| 14–58 | `FINANCE_ACTIONS` |

### 3.3. `WorkPeriodSystem` → `systems/WorkPeriodSystem/index.constants.ts`

| Линии | Имя |
|-------|-----|
| 33–38 | `baseStatChangesPerHour` → переименовать в `BASE_STAT_CHANGES_PER_HOUR` |

### 3.4. `ActivityLogSystem` → `systems/ActivityLogSystem/index.constants.ts`

| Линии | Имя |
|-------|-----|
| 71–82 | `LOG_ENTRY_TYPES` |
| 84 | `MAX_ENTRIES = 200` |

### 3.5. `engine/world.ts` → `engine/constants/component-keys.ts`

| Линии | Имя |
|-------|-----|
| 7–12 | `LEGACY_TO_CANONICAL_KEY` |
| 14–19 | `CANONICAL_TO_LEGACY_KEY` |

> `world.ts` — не система, а ядро движка. Константы выносятся в `engine/constants/`.

### 3.6. `game-facade/system-context.ts` → `game-facade/index.constants.ts`

| Линии | Имя |
|-------|-----|
| 16–19 | `GAME_DOMAIN_EVENT` |

### 3.7. `shared/utils/activity-log-formatters.ts` → `shared/constants/activity-log.ts`

| Линии | Имя |
|-------|-----|
| 4 | `ACTION_ID_PATTERN` |
| 6–8 | `ACTION_ID_ALIASES` |

### 3.8. `shared/utils/skill-tooltip-content.ts` → `shared/constants/metric-labels.ts`

| Линии | Имя |
|-------|-----|
| 3–69 | `EFFECT_LABELS` |

### 3.9. `shared/utils/stat-changes-format.ts` → `shared/constants/metric-labels.ts`

| Линии | Имя |
|-------|-----|
| 3–10 | `STAT_LABELS_RU` |
| 12 | `STAT_KEY_ORDER` |

### 3.10. `engine/utils/stat-change-summary.ts`

| Линии | Имя | Статус |
|-------|-----|--------|
| 3–10 | `LABELS` | 🔴 Дубликат `STAT_LABELS_RU` → удалить, импортировать из `shared/constants/metric-labels.ts` |

### 3.11. `engine/systems/StatsSystem.ts`

| Линии | Имя | Статус |
|-------|-----|--------|
| 13–20 | `statDefs` | 🔴 Дубликат `STAT_DEFS` в `shared/constants/index.ts` → удалить, импортировать из shared |

### 3.12. `pages/FinancePage.vue` → `shared/constants/metric-labels.ts`

| Линии | Имя |
|-------|-----|
| 76–82 | `expenseLabels` → `EXPENSE_LABELS_RU` |

### 3.13. `pages/MainPage.vue` → `shared/constants/navigation.ts`

| Линии | Имя |
|-------|-----|
| 177–189 | `routeMap` → `ROUTE_MAP` |

### 3.14. `composables/useActivityLog.ts`

| Линии | Имя | Статус |
|-------|-----|--------|
| 5 | `PAGE_SIZE = 8` | Оставить — composable-специфичная константа |

---

## 4. Дубликаты и конфликты (приоритет устранения)

### 4.1. 🔴 Дубликаты констант

| Что | Где | Решение |
|-----|-----|---------|
| `STAT_LABELS_RU` / `LABELS` | `stat-changes-format.ts` / `stat-change-summary.ts` | Объединить в `shared/constants/metric-labels.ts` → `STAT_LABELS_RU` |
| `statDefs` / `STAT_DEFS` | `StatsSystem.ts` / `shared/constants/index.ts` | Удалить из `StatsSystem`, импортировать из shared |
| `MigrationFn` | `PersistenceSystem.ts` / `MigrationSystem.ts` | Оставить в `PersistenceSystem/index.types.ts`, реэкспортировать из `MigrationSystem/index.types.ts` |
| `AnyRecord` | `commands.ts` / `queries.ts` | Вынести в `game-facade/index.types.ts` |

### 4.2. 🟡 Конфликты имён (одно имя — разная структура)

| Имя | Где (1) | Где (2) | Решение |
|-----|---------|---------|---------|
| `TimeComponent` | `engine/types/index.ts` (ECS: day, hour, age…) | `TimeSystem.ts` (Runtime: totalHours, hourOfDay, gameWeeks…) | Переименовать runtime → `RuntimeTimeComponent` |
| `EventChoice` | `engine/types/index.ts` (ECS: id, text, effects) | `EventChoiceSystem.ts` (Runtime: text, outcome, skillCheck…) | Переименовать runtime → `RuntimeEventChoice` |
| `EventChoice` | `EventChoiceSystem.ts` | `WorkPeriodSystem.ts` (label, outcome, salaryMultiplier) | Переименовать work → `WorkEventChoice` |
| `GameEvent` | `engine/types/index.ts` (ECS: type, payload) | `EventChoiceSystem.ts` (id, title, choices…) | Переименовать runtime → `RuntimeGameEvent` |

---

## 5. Целевая структура файлов

### 5.1. `src/domain/engine/systems/` — каждая система в папке

```
src/domain/engine/systems/
├── ActionSystem/
│   ├── index.ts                    # класс ActionSystem
│   ├── index.types.ts              # ActionData, AvailabilityCheck, ExecuteResult
│   ├── index.constants.ts          # (пока пусто — констант нет)
│   └── index.utils.ts              # (пока пусто — утилит нет)
├── ActivityLogSystem/
│   ├── index.ts                    # класс ActivityLogSystem
│   ├── index.types.ts              # LogTimestamp, LogEntry, LogComponent, GetEntries*, EventListenerEntry
│   ├── index.constants.ts          # LOG_ENTRY_TYPES, MAX_ENTRIES
│   └── index.utils.ts              # (пока пусто)
├── CareerProgressSystem/
│   ├── index.ts
│   ├── index.types.ts              # CareerTrackEntry, ChangeCareerResult
│   ├── index.constants.ts
│   └── index.utils.ts
├── EducationSystem/
│   ├── index.ts
│   ├── index.types.ts              # CanStartResult, StartResult, AdvanceResult, ActiveCourse
│   ├── index.constants.ts
│   └── index.utils.ts
├── EventChoiceSystem/
│   ├── index.ts
│   ├── index.types.ts              # RuntimeEventChoice, RuntimeGameEvent, EventChoiceResult, ResolvedChoice
│   ├── index.constants.ts
│   └── index.utils.ts
├── EventHistorySystem/
│   ├── index.ts                    # (без изменений — нет инлайнов)
│   ├── index.types.ts
│   ├── index.constants.ts
│   └── index.utils.ts
├── EventQueueSystem/
│   ├── index.ts                    # (без изменений — нет инлайнов)
│   ├── index.types.ts
│   ├── index.constants.ts
│   └── index.utils.ts
├── FinanceActionSystem/
│   ├── index.ts
│   ├── index.types.ts              # FinanceOverview, FinanceActionResult, FinanceActionWithAvailability
│   ├── index.constants.ts          # FINANCE_ACTIONS
│   └── index.utils.ts
├── InvestmentSystem/
│   ├── index.ts
│   ├── index.types.ts              # InvestmentConfig, InvestmentRecord, InvestmentWithState, InvestmentResult
│   ├── index.constants.ts
│   └── index.utils.ts
├── MigrationSystem/
│   ├── index.ts
│   ├── index.types.ts              # MigrationFn (реэкспорт из PersistenceSystem/index.types.ts)
│   ├── index.constants.ts
│   └── index.utils.ts
├── MonthlySettlementSystem/
│   ├── index.ts
│   ├── index.types.ts              # SettlementResult, SettlementData
│   ├── index.constants.ts
│   └── index.utils.ts
├── PersistenceSystem/
│   ├── index.ts
│   ├── index.types.ts              # ValidationResult, MigrationFn
│   ├── index.constants.ts
│   └── index.utils.ts
├── RecoverySystem/
│   ├── index.ts                    # (без изменений — нет инлайнов)
│   ├── index.types.ts
│   ├── index.constants.ts
│   └── index.utils.ts
├── SkillsSystem/
│   ├── index.ts
│   ├── index.types.ts              # SkillChangeResult
│   ├── index.constants.ts
│   └── index.utils.ts
├── StatsSystem/
│   ├── index.ts                    # удалить statDefs, импортировать STAT_DEFS
│   ├── index.types.ts
│   ├── index.constants.ts
│   └── index.utils.ts
├── TimeSystem/
│   ├── index.ts
│   ├── index.types.ts              # RuntimeTimeComponent, AdvanceOptions, AdvanceResult, PeriodicCallback
│   ├── index.constants.ts          # HOURS_IN_DAY, HOURS_IN_WEEK, WEEKS_IN_MONTH, MONTHS_IN_YEAR, DAYS_IN_AGE_YEAR
│   └── index.utils.ts
├── WorkPeriodSystem/
│   ├── index.ts
│   ├── index.types.ts              # WorkEventChoice
│   ├── index.constants.ts          # BASE_STAT_CHANGES_PER_HOUR
│   └── index.utils.ts
└── index.ts                        # реэкспорт всех систем
```

### 5.2. `src/domain/engine/` — константы ядра

```
src/domain/engine/constants/
├── index.ts                        # реэкспорт из components + component-keys
└── component-keys.ts               # LEGACY_TO_CANONICAL_KEY, CANONICAL_TO_LEGACY_KEY
```

### 5.3. `src/domain/game-facade/`

```
src/domain/game-facade/
├── index.ts                        # (существующий)
├── commands.ts                     # импорт AnyRecord из index.types.ts
├── queries.ts                      # импорт AnyRecord из index.types.ts
├── system-context.ts               # импорт SystemContext из index.types.ts, GAME_DOMAIN_EVENT из index.constants.ts
├── index.types.ts                  # SystemContext, AnyRecord
└── index.constants.ts              # GAME_DOMAIN_EVENT
```

### 5.4. `src/shared/`

```
src/shared/
├── constants/
│   ├── index.ts                    # (существующий — STAT_DEFS, NAV_ITEMS)
│   ├── activity-log.ts             # ACTION_ID_PATTERN, ACTION_ID_ALIASES
│   ├── metric-labels.ts            # STAT_LABELS_RU, STAT_KEY_ORDER, METRIC_LABELS, EFFECT_LABELS, EXPENSE_LABELS_RU
│   └── navigation.ts              # ROUTE_MAP
├── types/
│   └── activity-log.ts             # ActionMetadata, ActivityLogEntry
└── utils/
    ├── index.ts                    # (существующий)
    ├── activity-log-formatters.ts  # импорт констант из constants/activity-log.ts, типов из types/activity-log.ts
    ├── skill-tooltip-content.ts    # импорт EFFECT_LABELS из constants/metric-labels.ts
    └── stat-changes-format.ts      # импорт STAT_LABELS_RU из constants/metric-labels.ts
```

---

## 6. Порядок выполнения (батчи)

### Батч 1: Системы без инлайнов (создать структуру папок)

Системы, где нет инлайновых типов/констант — просто переносим файл в папку:

- `EventHistorySystem.ts` → `EventHistorySystem/index.ts`
- `EventQueueSystem.ts` → `EventQueueSystem/index.ts`
- `RecoverySystem.ts` → `RecoverySystem/index.ts`

Создаём пустые `index.types.ts`, `index.constants.ts`, `index.utils.ts` для каждой.

### Батч 2: Системы с типами (по 2 параллельно)

1. `ActionSystem/` — создать папку, перенести систему, создать `index.types.ts`
2. `TimeSystem/` — создать папку, перенести систему, создать `index.types.ts` + `index.constants.ts`
3. `MonthlySettlementSystem/` — папка + `index.types.ts`
4. `CareerProgressSystem/` — папка + `index.types.ts`
5. `EducationSystem/` — папка + `index.types.ts`
6. `EventChoiceSystem/` — папка + `index.types.ts`
7. `FinanceActionSystem/` — папка + `index.types.ts` + `index.constants.ts`
8. `InvestmentSystem/` — папка + `index.types.ts`
9. `ActivityLogSystem/` — папка + `index.types.ts` + `index.constants.ts`
10. `PersistenceSystem/` — папка + `index.types.ts`
11. `SkillsSystem/` — папка + `index.types.ts`
12. `WorkPeriodSystem/` — папка + `index.types.ts` + `index.constants.ts`
13. `StatsSystem/` — папка + удалить дубликат `statDefs`
14. `MigrationSystem/` — папка + `index.types.ts` (реэкспорт `MigrationFn`)

### Батч 3: Обновить реэкспорт

- Обновить `src/domain/engine/systems/index.ts` — реэкспорт из новых папок
- Обновить все импорты в файлах-потребителях (game-facade, composables, pages, store)

### Батч 4: Вынос констант engine/world.ts

- Создать `src/domain/engine/constants/component-keys.ts`
- Обновить `world.ts` — импорт констант

### Батч 5: game-facade

- Создать `src/domain/game-facade/index.types.ts` (SystemContext, AnyRecord)
- Создать `src/domain/game-facade/index.constants.ts` (GAME_DOMAIN_EVENT)
- Обновить `system-context.ts`, `commands.ts`, `queries.ts`

### Батч 6: shared — устранение дубликатов

1. Создать `src/shared/constants/metric-labels.ts` — объединить STAT_LABELS_RU, LABELS, METRIC_LABELS, EFFECT_LABELS, EXPENSE_LABELS_RU
2. Создать `src/shared/constants/activity-log.ts` — ACTION_ID_PATTERN, ACTION_ID_ALIASES
3. Создать `src/shared/constants/navigation.ts` — ROUTE_MAP
4. Создать `src/shared/types/activity-log.ts` — ActionMetadata, ActivityLogEntry
5. Обновить файлы-потребители:
   - `stat-changes-format.ts` — импорт STAT_LABELS_RU
   - `stat-change-summary.ts` — удалить LABELS, импорт STAT_LABELS_RU
   - `activity-log-formatters.ts` — импорт констант и типов
   - `skill-tooltip-content.ts` — импорт EFFECT_LABELS
   - `StatsSystem/index.ts` — удалить statDefs, импорт STAT_DEFS
   - `FinancePage.vue` — импорт EXPENSE_LABELS_RU
   - `MainPage.vue` — импорт ROUTE_MAP

### Батч 7: Проверка

1. `npx tsc --noEmit` — нет ошибок типов
2. `npm test` — тесты проходят
3. Проверить все `index.ts` реэкспорты

---

## 7. Итого

| Категория | Количество |
|-----------|-----------|
| Инлайн-типов к выносу | ~45 |
| Инлайн-констант к выносу | ~15 |
| Дубликатов к устранению | 4 |
| Конфликтов имён к разрешению | 4 |
| Системных папок к созданию | 17 |
| Новых файлов типов (index.types.ts) | 17 |
| Новых файлов констант (index.constants.ts) | 17 |
| Новых файлов утилит (index.utils.ts) | 17 (большинство — пустые) |
| Новых файлов в shared | 4 |
| Новых файлов в game-facade | 2 |
| Новых файлов в engine/constants | 1 |

---

## 8. Дополнительные находки (расширение плана)

### 8.1. `src/composables/` — применить тот же подход

Каждый composable превращается в папку:

```
src/composables/
├── useToast/
│   ├── index.ts              # useToast() (бывший useToast.ts)
│   ├── index.types.ts        # ToastItem
│   └── index.constants.ts    # DEFAULT_TIMEOUT
├── useActivityLog/
│   ├── index.ts              # useActivityLog()
│   ├── index.types.ts        # DisplayLogEntry
│   └── index.constants.ts    # PAGE_SIZE
├── useActions/
│   ├── index.ts              # useActions()
│   ├── index.types.ts        # (пока пусто)
│   └── index.constants.ts    # (пока пусто — allCategories — computed, не константа)
├── useEvents/
│   ├── index.ts              # useEvents()
│   ├── index.types.ts        # (пока пусто)
│   └── index.constants.ts    # (пока пусто)
└── useFinance/
    ├── index.ts              # useFinance()
    ├── index.types.ts        # (пока пусто)
    └── index.constants.ts    # (пока пусто)
```

**Что вынести:**

| Composable | Типы | Константы |
|------------|------|-----------|
| `useToast` | `ToastItem` (стр. 3–8) | `DEFAULT_TIMEOUT = 3000` (стр. 13) |
| `useActivityLog` | `DisplayLogEntry` (стр. 7–14) | `PAGE_SIZE = 8` (стр. 5) |

### 8.2. `src/application/game/` — применить тот же подход

```
src/application/game/
├── index.ts                  # реэкспорт
├── commands.ts               # (без изменений)
├── queries.ts                # (без изменений)
├── index.types.ts            # FinanceOverviewDto, EventChoiceInput
├── index.constants.ts        # (пока пусто)
└── ports/
    └── SaveRepository.ts     # (оставить — порт/интерфейс)
```

**Что вынести:**

| Файл | Типы |
|------|------|
| `types.ts` → `index.types.ts` | `FinanceOverviewDto`, `EventChoiceInput` (уже в отдельном файле, просто переименовать) |

### 8.3. `src/infrastructure/persistence/` — применить тот же подход

```
src/infrastructure/persistence/
├── index.ts                  # реэкспорт LocalStorageSaveRepository
├── LocalStorageSaveRepository.ts
├── index.types.ts            # (пока пусто — SaveRepository импортируется из application)
└── index.constants.ts        # DEFAULT_SAVE_KEY
```

**Что вынести:**

| Файл | Константы |
|------|-----------|
| `LocalStorageSaveRepository.ts` | `DEFAULT_SAVE_KEY = 'game_life_save_vue'` (стр. 3) |

### 8.4. `src/domain/engine/utils/` — применить тот же подход

```
src/domain/engine/utils/
├── index.ts                  # реэкспорт
├── activity-log-description.ts → activity-log-description/index.ts
├── stat-change-summary.ts → stat-change-summary/index.ts
```

Или, следуя подходу, каждую утилиту в папку:

```
src/domain/engine/utils/
├── index.ts
├── activity-log-description/
│   ├── index.ts
│   ├── index.types.ts        # ActionLogDescriptionInput
│   └── index.constants.ts    # (пусто)
└── stat-change-summary/
    ├── index.ts
    ├── index.types.ts        # (пусто)
    └── index.constants.ts    # (пусто — LABELS удалён как дубликат)
```

### 8.5. `src/domain/balance/` — реорганизация

Модуль `balance` уже хорошо структурирован, но есть проблемы:

#### 8.5.1. `balance/actions/` — вынести `ACTION_CATEGORIES`

| Файл | Что | Куда |
|------|-----|------|
| `actions/index.ts` стр. 27–38 | `ACTION_CATEGORIES` | `actions/index.constants.ts` |
| `actions/index.ts` стр. 40–82 | `ALL_ACTIONS_MAP`, `registerActions`, `getActionById`, `getActionsByCategory`, `getAllActions`, `getActionsCount` | Оставить в `index.ts` (это логика реестра) |

#### 8.5.2. 🔴 Кросс-модульные дубликаты констант

| Что | Где (1) | Где (2) | Решение |
|-----|---------|---------|---------|
| `HOURS_IN_DAY=24`, `HOURS_IN_WEEK=168` | `TimeSystem.ts` (readonly) | `balance/utils/hourly-rates.ts` → `BALANCE_CONSTANTS` | Единый источник: `balance/constants/time.ts`, оба потребителя импортируют оттуда |
| `baseStatChangesPerHour` | `WorkPeriodSystem.ts` стр. 33–38 | `balance/constants/work-economy.ts` → `LEGACY_BASE_STAT_CHANGES_PER_WORK_DAY` | Удалить из `WorkPeriodSystem`, импортировать из balance |
| `FINANCE_ACTIONS` | `FinanceActionSystem.ts` стр. 14–58 | `balance/actions/finance-actions.ts` → `FINANCE_ACTIONS` | 🔴 **Разные данные!** В системе — 3 действия (резерв, вклад, бюджет), в balance — 10+ действий. Переименовать в системе в `SYSTEM_FINANCE_ACTIONS` или удалить и использовать из balance |

### 8.6. `src/pages/` — дублирование `formatMoney()`

Функция `formatMoney()` дублируется в **6+ страницах**:

- `MainPage.vue` (стр. 168)
- `CareerPage.vue` (стр. 77)
- `EducationPage.vue` (стр. 90)
- `FinancePage.vue` (стр. 99)
- `RecoveryPage.vue` (стр. 100)
- `ShopPage.vue` (стр. 74)
- `HomePage.vue` (стр. 74)

**Решение:** Вынести в `src/shared/utils/format.ts`:

```typescript
export function formatMoney(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}
```

Также `formatEffect()` дублируется в `ShopPage.vue` и `HomePage.vue` — вынести туда же.

### 8.7. `src/pages/ActivityLogPage.vue` — инлайн-константа

| Линии | Что | Куда |
|-------|-----|------|
| 51–60 | `filters` — массив фильтров лога | `src/shared/constants/activity-log.ts` как `ACTIVITY_LOG_FILTERS` |

### 8.8. `src/domain/balance/constants/default-save.ts` — типы SaveData

Файл `default-save.ts` содержит **и типы, и данные**. Следуя подходу:

| Что | Куда |
|-----|------|
| `SaveData`, `TimeData`, `JobData`, `HousingData`, `EducationData`, `RelationshipData`, `FinanceData`, `EventStateData`, `LifetimeStatsData`, `StatsData` | Оставить в `default-save.ts` — это типы, специфичные для структуры сохранения, тесно связанные с дефолтными данными |

> **Примечание:** Типы `JobData` в `default-save.ts` и `JobData` в `engine/types/index.ts` — **разные интерфейсы с одинаковым именем**. Это отдельная проблема, но не относится к текущей задаче выноса инлайнов.

---

## 9. Обновлённый порядок выполнения (расширенный)

### Батч 1: Системы без инлайнов (создать структуру папок)

- `EventHistorySystem/`, `EventQueueSystem/`, `RecoverySystem/`

### Батч 2: Системы с типами (по 2 параллельно)

- 14 систем (ActionSystem → MigrationSystem)

### Батч 3: Обновить реэкспорт `systems/index.ts` + все импорты

### Батч 4: Вынос констант engine/world.ts

### Батч 5: game-facade — index.types.ts + index.constants.ts

### Батч 6: shared — устранение дубликатов

### Батч 7: Composables → папки

- `useToast/`, `useActivityLog/`, `useActions/`, `useEvents/`, `useFinance/`

### Батч 8: application/game → реорганизация

- Переименовать `types.ts` → `index.types.ts`

### Батч 9: infrastructure/persistence → вынести DEFAULT_SAVE_KEY

### Батч 10: engine/utils → папки

- `activity-log-description/`, `stat-change-summary/`

### Батч 11: balance/actions → вынести ACTION_CATEGORIES

### Батч 12: Кросс-модульные дубликаты

- Создать `balance/constants/time.ts` — единый источник `HOURS_IN_DAY`, `HOURS_IN_WEEK`
- Удалить `baseStatChangesPerHour` из `WorkPeriodSystem` → импорт из `balance/constants/work-economy.ts`
- Разрешить конфликт `FINANCE_ACTIONS` (система vs balance)
- Удалить `LABELS` из `stat-change-summary.ts` → импорт `STAT_LABELS_RU`
- Удалить `statDefs` из `StatsSystem` → импорт `STAT_DEFS`

### Батч 13: Pages — вынести общие утилиты

- Создать `src/shared/utils/format.ts` → `formatMoney()`, `formatEffect()`
- Обновить 7+ страниц
- Вынести `ACTIVITY_LOG_FILTERS` из `ActivityLogPage.vue` в `shared/constants/activity-log.ts`
- Вынести `ROUTE_MAP` из `MainPage.vue` в `shared/constants/navigation.ts`
- Вынести `expenseLabels` из `FinancePage.vue` в `shared/constants/metric-labels.ts`

### Батч 14: Проверка

- `npx tsc --noEmit`
- `npm test`
- Проверить все `index.ts` реэкспорты

---

## 10. Итоговая статистика (расширенная)

| Категория | Количество |
|-----------|-----------|
| Инлайн-типов к выносу | ~50 |
| Инлайн-констант к выносу | ~20 |
| Дубликатов функций к устранению | 3 (`formatMoney`, `formatEffect`, `LABELS`) |
| Дубликатов констант к устранению | 5 |
| Конфликтов имён к разрешению | 4 |
| Системных папок к созданию (engine/systems) | 17 |
| Composable папок к созданию | 5 |
| Новых файлов в shared | 5 |
| Новых файлов в game-facade | 2 |
| Новых файлов в engine/constants | 1 |
| Новых файлов в engine/utils (папки) | 2 |
| Страниц к обновлению (formatMoney) | 7+ |
