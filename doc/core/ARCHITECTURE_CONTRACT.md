# Архитектурный контракт: Application-First модель

## Цель контракта

Зафиксировать каноническую архитектурную модель для проекта `game_life` и правила, которыми руководствуется миграция. Контракт определяет единый источник истины для размещения кода — куда класть новую логику и где искать существующую.

## Слои и их обязанности

### `domain` — правила, каталоги, pure-логика

**Может содержать:**
- игровые каталоги (actions, career-jobs, education-programs, events)
- pure-утилиты без зависимостей от Nuxt/Pinia/browser API
- типы и интерфейсы для domain-сущностей
- константы и справочники
- pure-функции для расчетов (формулы, валидация входных данных)

**НЕ может содержать:**
- импорты `pinia`, `useStore`, `defineStore`
- обращения к `localStorage`, `sessionStorage`, `window`, `document`
- вызовы `useNuxtApp`, `useRoute`, `useRouter`, `useState`
- UI-компоненты или стили
- orchestration-логику

**Пример:** `src/domain/balance/actions/index.ts`, `src/domain/balance/constants/career-jobs.ts`

---

### `application` — единая точка входа для use-case команд и запросов

**Может содержать:**
- команды (commands): действия пользователя, которые изменяют состояние
- запросы (queries): проверки возможности, получение данных
- порты (ports): интерфейсы для infrastructure-адаптеров
- result-модели для каждого use-case сценария

**Структура:**
- `application/game/commands.ts` — игровые команды
- `application/game/queries.ts` — игровые запросы
- `application/game/ports/` — порты для infrastructure
- `application/game/index.ts` — публичный API
- `application/game/index.types.ts` — result-модели и контракты

**НЕ может содержать:**
- импорты stores или использование Pinia
- прямые мутации состояния
- UI-side effects (toast, modal, navigation)
- знание о Nuxt routing или компонентах

**Пример:** `canExecuteAction()`, `executeAction()`, `applyWorkShift()`, `changeCareer()`

---

### `stores` — состояние, slice-level мутации, сериализация

**Может содержать:**
- reactive state через Pinia
- локальные mutations для своего slice
- применение effect payload от application commands
- `save()` / `load()` для своего slice
- computed projections для UI
- вызовы application commands для orchestration

**НЕ может содержать:**
- бизнес-логику, которая относится к use-case сценариям (для этого есть application)
- cross-store orchestration (для этого есть application или thin game-store facade)
- UI-side effects

**Исключение:** тонкий `game-store` может оставаться агрегирующим фасадом, но НЕ god-объектом с бизнес-логикой.

**Пример:** `src/stores/wallet-store/index.ts`, `src/stores/career-store/index.ts`

---

### `composables` — UI orchestration, coordination

**Может содержать:**
- UI flows: открытие модалки, toast, навигация после результата
- coordination между UI и application/stores
- переиспользуемое presentation-level поведение
- вызовы application commands и stores для данных

**НЕ может содержать:**
- игровые правила или продуктовую логику
- прямые мутации store state (кроме через вызов команд)
- бизнес-решения (можно/нельзя)

**Пример:** `src/composables/useActions/index.ts` — только UI-реакции после результата use-case

---

### `infrastructure` — реализация портов

**Может содержать:**
- адаптеры для портов (LocalStorage, future API, etc.)
- browser API wrappers
- persistence implementation

**НЕ может содержать:**
- продуктовые правила или бизнес-логику
- UI-компоненты

**Пример:** `src/infrastructure/persistence/LocalStorageSaveRepository.ts`

---

### `pages` и `components` — UI only

**Могут содержать:**
- шаблоны, стили
- вызовы composables для получения данных
- вызовы composables для действий пользователя

**НЕ могут содержать:**
- бизнес-логику или use-case логику
- прямые вызовы stores для правил
- импорты domain напрямую (только через application)

---

## Критерии "куда класть новый код"

### Новый игровой сценарий (новое действие, карьера, событие и т.д.)

1. Правила и каталог — в `domain`
2. Use-case логика (проверки, применение) — в `application`
3. Данные для проверки — передаются как параметры из stores
4. Результат возвращается как result-модель
5. Применение эффектов — в stores
6. UI feedback — в composables

### Изменение существующего правила

Искать в `domain` каталог, правило — обновить там.

### Добавление нового типа состояния

1. Snapshot interface — в `domain` или types
2. Store — в `stores`
3. Persistence — store реализует `save()`/`load()`
4. Правила работы — в `application`

### Изменение UI-поведения

В composables для конкретного UI-паттерна.

---

## Контрактные правила миграции

1. **Новая use-case логика идет в `application` first** — не в stores, не в composables, не в pages

2. **`application` не импортирует stores** — только domain и ports

3. **Stores применяют эффекты, но не решают** — применение result payload, не валидация или orchestration

4. **Composables — UI orchestration** — только реакции на результат, не сами решения

5. **`domain` — чистый и не зависит от фреймворка** — без Nuxt, Pinia, browser API

6. **Ports отделяют infrastructure** — `SaveRepository` и другие порты — единственное место для смены адаптера

---

## Архитектурные тесты

Контракт проверяется автоматически:

- `test/unit/architecture/layer-boundaries.test.ts` — проверяет границы слоев (domain, application, infrastructure)
- `test/unit/architecture/store-boundaries.test.ts` — проверяет границы stores

При нарушении правил тесты падают.

---

## Known violations (на июль 2026)

Контракт нарушен в нескольких местах. Нарушения отслеживаются и постепенно устраняются через recovery plan ниже.

### V-1. ~~`application` импортирует Pinia stores~~ — RESOLVED (Фаза 4)

**Статус:** Устранено в Фазе 4 плана `game_world_aggregate_foundation`.

`src/application/game/commands.ts` и `queries.ts` теперь pure functions с signature `(world: GameWorld, ...): Result`. Pinia-импорт остаётся только в `legacy.ts` (временный shim для обратной совместимости с consumers, использует `appGameCommands`/`appGameQueries`). SPAExecutor реализует `GameExecutor`/`GameQueryExecutor` interfaces.

Bridge (`fromStores`/`applyToStores`) остаётся в `src/domain/game-world/bridge.ts` как deprecated модуль. Будет удалён при завершении server-first миграции (когда stores станут true projections над `GameWorld`).

### V-2. Бизнес-логика в `stores` (часть stores)

**Файлы:** `applyWorkShift` логика в `game.store.ts`, `recalculateSkillModifiers` в `skills-store` (хотя сама функция в domain), per-stat модификаторы в stores.

**Нарушает:** §stores «НЕ может содержать: бизнес-логику, которая относится к use-case сценариям».

**Почему:** Исторически stores были единственным местом для бизнес-логики. Частично исправлено в аудите P1-4/P1-5 и Фазах 2-3 `game_world_aggregate_foundation` (делегирование в domain commands через `SPAExecutor`). Полный перенос в projections требует server-first миграции.

---

## Server-first миграция (Strategy A, Stages 1-7)

Архитектура расширена для поддержки server-mode и offline-first. Полное описание в [`SERVER_MIGRATION.md`](../SERVER_MIGRATION.md).

**Статус по этапам:**
- **Stage 1** ✅: `GameMode` типы (domain/game-mode), API contract (domain/api-contract), async executor interfaces
- **Stage 2** ✅: SPA async adapter, Server executor stub, executor-factory (DI по mode)
- **Stage 3** ✅: `useGameStore` async layer (executor, queryExecutor, async methods)
- **Stage 4** ✅: Nitro Server API (7 endpoints), session utils, error-handler
- **Stage 5** ✅: Реальный ServerExecutor (`$fetch`), state-sync, client error-handler, OfflineQueueManager
- **Stage 6** ✅: ModeSwitcher dev component, integration tests (state-sync + error-handler)
- **Stage 7** ✅: SERVER_MIGRATION.md, README update, ARCHITECTURE_CONTRACT/OVERVIEW update
- **M0/M1/M2** ✅: npm workspaces, canonical contracts, framework-free packages и standalone Fastify API
- **M3** 🔄: PostgreSQL/Redis persistence и deployment hardening

**Архитектурные правила server-first:**
- **`nuxt/server-client-boundary`**: `server/**` не импортируется в `src/**`. API contract типы живут в `src/domain/api-contract/` (нейтральный слой).
- **`application` не импортирует `infrastructure`**: `executor-factory.ts` принимает `GameMode` параметром (DI).
- **`GameMode` типы в `domain/game-mode/`**: нейтральный слой.

---

## Recovery plan

Устранение known violations выполняется через стратегию A (ADR-0005): восстановление `GameWorld` aggregate в `src/domain/game-world/` как единого source of truth.

**План:** локальный Spec-kit work item `specs/server-first-arch/plan.md`; устойчивое архитектурное решение зафиксировано в ADR-0005.

**Этапы:**
1. **Фаза 1 — Foundation** ✅: `GameWorld.ts`, `toJSON`/`fromJSON`, `game-facade/`, временный bridge `fromStores`/`applyToStores`.
2. **Фаза 2 — Actions migration** ✅: `executeAction`/`simulateWorkShift`/`resolveEventDecision` перенесены в domain commands с signature `(world: GameWorld, ...)`.
3. **Фаза 3 — Stores → projections** ✅: career, skills, finance, events, wallet/stats/time мигрированы (делегируют в world mutations через SPAExecutor).
4. **Фаза 4 — Application pure + SPAExecutor** ✅: убран импорт Pinia из application (V-1 устранён), реализован `SPAExecutor` + `GameExecutor`/`GameQueryExecutor` interfaces.
5. **Фаза 5 — Cleanup + docs** (текущая): e2e smoke-test ✅; bridge удаление deferred к server-first миграции; docs обновлены.

**Итого:** Фазы 1-4 завершены. Bridge остаётся deprecated — его удаление требует превратить stores в истинные projections (reactive-computed над `gameStore.world: Ref<GameWorld>`), что рискованно в SPA-only режиме. Server-first миграция (Strategy A) удалит bridge естественным путём при замене `SPAExecutor` на `ServerExecutor`.

---

## Когда правила можно нарушить

Только явным решением через PR и обновлением контракта. Хаос по умолчанию не допускается.
