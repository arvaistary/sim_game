# Отчёт о статусе миграции

> **Дата:** 21 апреля 2026
> **Проверяемые планы:**
> - `CLASS_TO_FUNCTIONAL_MIGRATION.md` (v2.1)
> - `FULL_ECS_REMOVAL_PLAN.md` (v1.0)

---

## Краткий итог

| План | Статус | Выполнено |
|------|--------|-----------|
| CLASS_TO_FUNCTIONAL_MIGRATION | ✅ Почти завершён | **~97%** |
| FULL_ECS_REMOVAL_PLAN | ✅ Почти завершён | **~92%** |

**ECS архитектура полностью удалена.** Проект работает на 13 Pinia stores + composables. Осталось несколько косметических и мелких багов.

---

## 1. CLASS_TO_FUNCTIONAL_MIGRATION — детальный статус

### Фаза 1: Подготовка ✅
- [x] Типы GameState определены
- [x] Структура flat store спроектирована

### Фаза 2: Core State ✅
- [x] Time state → `time-store`
- [x] Stats state → `stats-store`
- [x] Wallet state → `wallet-store`
- [x] Skills state → `skills-store`

### Фаза 3: Core Actions ✅
- [x] Time actions (advanceHours)
- [x] Stats actions (applyStatChanges)
- [x] Action execution (executeAction)
- [x] Career state/actions → `career-store`
- [x] Education state/actions → `education-store`

### Фаза 4: Advanced ✅
- [x] Event queue → `events-store`
- [x] Work periods → `career-store`
- [x] Monthly settlement → `finance-store`
- [x] Housing → `housing-store`
- [x] Activity log → `activity-store`
- [x] Finance → `finance-store`
- [x] Player → `player-store`

### Фаза 5: Cleanup — остались мелочи

- [x] Bridge/adapter удалены (не нужны, нет переходного периода)
- [x] UI компоненты обновлены (используют stores/composables)
- [ ] **1 TypeScript ошибка** — `game.store.ts:104` type mismatch
- [ ] **save() частично пустой** — time/stats/wallet возвращают `{}`

---

## 2. FULL_ECS_REMOVAL_PLAN — детальный статус

### Фаза 1: Анализ ✅
- [x] Карта API game-facade
- [x] Карта API GameWorld
- [x] Определены требования для persistence

### Фаза 2: Переписать application/game ✅
- [x] `commands.ts` — использует stores напрямую
- [x] `queries.ts` — использует stores напрямую
- [x] Нет импортов из game-facade

### Фаза 3: Persistence — частично
- [x] `LocalStorageSaveRepository` переписан (24 строки)
- [x] `EventMigration` реализован
- [x] `SaveRepository` interface создан
- [ ] **save() в game.store.ts** возвращает пустые `{}` для time/stats/wallet
- [ ] Stores time/stats/wallet не имеют методов save/load

### Фаза 4: Удалить game-facade ✅
- [x] `src/domain/game-facade/` — **полностью удалён**
- [x] `src/domain/index.ts` — обновлён (экспортирует только `balance`)

### Фаза 5: Удалить ECS системы ✅
- [x] `src/domain/engine/systems/` — **полностью удалён** (0 файлов)
- [x] `src/domain/engine/world.ts` — **удалён**
- [x] `src/domain/engine/components/` — **удалён**
- [x] Нет импортов из `engine/` или `game-facade/`

### Фаза 6: Тестирование — 1 ошибка
- [ ] **TypeScript:** 1 ошибка (`game.store.ts:104`)
- [ ] Build не проверен из-за TS ошибки

---

## 3. Что осталось доделать

### 🔴 Обязательное (3 задачи, ~2-3 часа)

#### 3.1 Исправить TypeScript ошибку
**Файл:** `src/stores/game.store.ts:104`
**Проблема:** `actions.canExecuteAction(action)` — передаётся `BalanceAction`, ожидается `string`
**Решение:** Заменить на `actions.canExecute(action)` (принимает GameAction) или передать `action.id`

#### 3.2 Доделать persistence (save/load)
**Файл:** `src/stores/game.store.ts:37-47`
**Проблема:** `save()` возвращает пустые объекты для time/stats/wallet:
```typescript
time: {},   // ДОЛЖНО: time.save()
stats: {},  // ДОЛЖНО: stats.save()
wallet: {}, // ДОЛЖНО: wallet.save()
```
**Решение:**
1. Добавить методы `save()` в `time-store`, `stats-store`, `wallet-store`
2. Вызывать их в `game.store.ts` save()

#### 3.3 Удалить мёртвый `_world` параметр
**Файлы:** `src/application/game/commands.ts`, `src/application/game/queries.ts`
**Проблема:** Все 25 методов содержат `_world: unknown` — наследие от API, принимавшего GameWorld
**Решение:** Удалить параметр из всех сигнатур и обновить вызовы

### 🟡 Желательное (2 задачи, ~1-2 часа)

#### 3.4 Почистить комментарии с упоминаниями legacy
| Файл | Строка | Что |
|------|--------|-----|
| `child-actions-registered.ts` | 7 | Упоминание ActionSystem в комментарии |
| `actions-feature-flags.ts` | 33 | TODO: "мигрировать finance в ActionSystem" |
| `game.store.ts` | 65 | `ActionValidator` — utility, не ECS |
| `index.types.ts` | 6-9 | `@deprecated` для FinanceComponent |
| `useGameModal/index.ts` | 60 | Комментарий "legacy, state-based" |
| `skill-progression-config.ts` | 55 | `LEGACY_SKILL_PROGRESSION_CONFIG` |
| `work-economy.ts` | 3-5 | `LEGACY_WORK_PERIOD_*` константы |
| `childhood-balance.ts` | 43 | `// legacy` комментарий |
| `age-constants.ts` | 99 | `// legacy` комментарий |
| `default-save.ts` | 3 | Упоминание legacy DEFAULT_SAVE |

#### 3.5 Feature flags — убрать невалидные TODO
**Файл:** `src/config/actions-feature-flags.ts`
- `financeUnifiedV2: false` — TODO упоминает ActionSystem (неактуально, ECS удалён)
- `eventIngressIntegration: false` — проверить актуальность

---

## 4. Сколько легаси осталось

### Количественная оценка

| Метрика | До миграции | Сейчас | Разница |
|---------|-------------|--------|---------|
| ECS классы (системы) | 32 | **0** | -100% |
| GameWorld | 1 | **0** | -100% |
| game-facade файлы | 4+ | **0** | -100% |
| Импорты из engine/ | 30+ | **0** | -100% |
| Pinia stores | 0 | **13** | +13 |
| Composables | 0 | **22 файла** | +22 |
| `class` в src/ | 32+ | **3** | -91% |

### Оставшиеся 3 класса (НЕ legacy)
| Класс | Файл | Назначение |
|-------|------|------------|
| `ActionValidator` | `domain/balance/actions/action-schema.ts` | Утилита валидации |
| `EventMigration` | `infrastructure/persistence/event-migration.ts` | Миграция сохранений |
| `LocalStorageSaveRepository` | `infrastructure/persistence/LocalStorageSaveRepository.ts` | Infrastructure adapter |

Все 3 класса — utility/infrastructure, не имеют отношения к ECS.

### Нулевые ссылки на ECS
```
grep "game-facade" → 0 файлов
grep "GameWorld"   → 0 файлов
grep "engine/"     → 0 файлов (импорты)
```

---

## 5. Текущая архитектура

```
src/
├── stores/              (13 Pinia stores — ЕДИНСТВЕННОЕ состояние)
│   ├── time-store/      ✅
│   ├── stats-store/     ✅
│   ├── wallet-store/    ✅
│   ├── skills-store/    ✅
│   ├── career-store/    ✅
│   ├── education-store/ ✅
│   ├── events-store/    ✅
│   ├── actions-store/   ✅
│   ├── finance-store/   ✅
│   ├── activity-store/  ✅
│   ├── housing-store/   ✅
│   ├── player-store/    ✅
│   ├── game.store.ts    ✅ (фасад над stores)
│   └── index.ts         (barrel exports)
│
├── composables/         (22 файла — бизнес-логика + UI helpers)
│   ├── use-time/        ✅
│   ├── use-stats/       ✅
│   ├── use-wallet/      ✅
│   ├── use-skills/      ✅
│   ├── use-career/      ✅
│   ├── use-education/   ✅
│   ├── use-finance/     ✅
│   ├── use-housing/     ✅
│   ├── use-activity/    ✅
│   ├── useActions/      ✅
│   ├── useEvents/       ✅
│   ├── useFinance/      ✅
│   └── ...              ✅
│
├── application/         (commands/queries — используют stores)
│   └── game/
│       ├── commands.ts  ✅ (25 методов, все через stores)
│       ├── queries.ts   ✅ (13 методов, все через stores)
│       ├── index.ts
│       ├── index.types.ts
│       └── ports/SaveRepository.ts
│
├── domain/              (только баланс — данные, константы, типы)
│   ├── balance/
│   │   ├── actions/     (конфигурация действий)
│   │   ├── constants/   (баланс, ивенты, навыки)
│   │   ├── types/       (интерфейсы)
│   │   └── utils/       (вспомогательные функции)
│   └── index.ts         export * as balance
│
├── infrastructure/      (persistence)
│   └── persistence/
│       ├── LocalStorageSaveRepository.ts
│       ├── event-migration.ts
│       └── constants.ts
│
├── components/          (Vue UI)
├── pages/               (Vue routes)
├── plugins/
├── middleware/
├── config/
├── constants/
└── utils/
```

---

## 6. Критерии готовности из планов — чеклист

### Из CLASS_TO_FUNCTIONAL_MIGRATION.md (Приложение C)

| Критерий | Статус |
|----------|--------|
| Удалён GameWorld | ✅ 0 ссылок |
| Удалены ECS классы | ✅ 0 ссылок на TimeSystem/StatsSystem/... |
| Flat store | ✅ Всё в Pinia defineStore |
| TypeScript 0 ошибок | ❌ 1 ошибка (game.store.ts:104) |
| Тесты >80% coverage | ⚠️ Не проверено |

### Из FULL_ECS_REMOVAL_PLAN.md (Критерии готовности)

| Критерий | Метод проверки | Результат |
|----------|----------------|-----------|
| Нет ссылок на game-facade | `grep -r "game-facade" src/` | ✅ 0 |
| Нет ссылок на GameWorld | `grep -r "GameWorld" src/` | ✅ 0 |
| Нет ссылок на системы | `grep -r "TimeSystem\|StatsSystem" src/` | ✅ 0 (только в комментариях) |
| TypeScript 0 ошибок | `npx tsc --noEmit` | ❌ 1 ошибка |
| Build успешен | `npm run build` | ⚠️ Не проверен |

---

## 7. Рекомендации

1. **Немедленно:** исправить TS ошибку в `game.store.ts:104` — это блокирует build
2. **В течение дня:** доделать save/load для time/stats/wallet stores
3. **При удобстве:** удалить `_world` параметр из commands/queries API
4. **По желанию:** почистить legacy комментарии и имена констант
5. **Проверить:** build (`npm run build`) после исправления TS ошибки
