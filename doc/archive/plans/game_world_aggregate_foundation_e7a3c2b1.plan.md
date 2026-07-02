---
name: game_world_aggregate_foundation
overview: "Реализация ADR-0005 (Strategy A): восстановление GameWorld aggregate в src/domain/game-world/ как единого source of truth. Stores становятся projections, application layer — чистым (без импорта Pinia). Bridge-период через fromStores/applyToStores для постепенной миграции. Финальная цель — server-first готовность (этапы 4-8 server-first плана выполняются без изменений после этого плана)."
todos:
  - id: f1_game_world_skeleton
    content: "Создать src/domain/game-world/ скелет: GameWorld.ts (state-container класс с time/stats/wallet/skills/career/education/finance/events/activity slices как readonly поля), GameWorld.types.ts (GameWorldSnapshot interface, описывающий форму состояния), index.ts (re-exports). GameWorld хранит состояние в plain объектах (без Vue reactive), мутируется только через command-methods. Без бизнес-логики на этом шаге — только state shape + constructor."
    status: completed
  - id: f1_serialization
    content: "Реализовать GameWorld.toJSON(): GameWorldJSON и статический GameWorld.fromJSON(json: GameWorldJSON): GameWorld. Формат JSON должен совпадать с текущей структурой save-данных (default-save.ts), чтобы существующие save-файлы загружались без миграции. Добавить version-поле для будущих миграций. Юнит-тесты: round-trip toJSON→fromJSON сохраняет все поля."
    status: completed
  - id: f1_game_facade
    content: "Восстановить src/domain/game-facade/index.ts как тонкую обёртку над GameWorld: createWorldFromJSON(json) (делегирует в GameWorld.fromJSON), createEmptyWorld() (init state), getGameFacade(world) (возвращает helper с геттерами). Domain-only, без импортов application/stores. Юнит-тесты на createEmptyWorld и round-trip через facade."
    status: completed
  - id: f1_bridge_from_stores
    content: "Временный bridge (src/domain/game-world/bridge.ts, пометить @deprecated в TSDoc): GameWorld.fromStores(storesSnapshot) — собирает world из текущих Pinia store snapshots. Используется ТОЛЬКО на этапе миграции, пока stores остаются source of truth. Принимает plain объект (не Pinia refs), чтобы domain не зависел от Vue. Юнит-тест с mock-snapshot."
    status: completed
  - id: f1_bridge_apply_to_stores
    content: "Временный bridge (продолжение bridge.ts): world.applyToStores(stores) — пушит состояние из GameWorld обратно в Pinia stores (через существующие store.load() методы). Помечен @deprecated. Используется в переходный период, пока stores не станут projections. Юнит-тест round-trip: fromStores→applyToStores не теряет данные."
    status: completed
  - id: f2_migrate_actions
    content: "Миграция executeAction/simulateWorkShift/resolveEventDecision на signature (world: GameWorld, ...). Создать src/domain/game-world/commands/ с command-функциями, которые мутируют world и возвращают CommandResult. Бизнес-логика (calculateStatChanges, salaryMultiplier, checks) переносится сюда из src/application/game/commands.ts. Старые appGameCommands становятся тонкой обёрткой: создают/читают world из stores через bridge, вызывают domain commands, пушат обратно. Совместимость сохраняется."
    status: completed
  - id: f2_verify_actions_parity
    content: "Тесты на паритет: для каждого действия убедиться, что результат старой реализации (через stores напрямую) и новой (через GameWorld + domain command) совпадает по: денег, времени, статов, навыков, activity log. Юнит-тесты с fixture save-состоянием. Это гарантирует безрегрессионную миграцию."
    status: completed
  - id: f3_career_projection
    content: "Миграция career-store в projection над GameWorld. careerStore.currentJob становится computed/getter из world.career; все мутации (addWorkHours, addPendingSalary, collectSalary, endWork) делегируют в world.career.* и затем синхронизируют store через world.applyToStores(stores). Bridge-период: store всё ещё reactive для UI, но state-of-truth — world."
    status: completed
  - id: f3_skills_projection
    content: "Миграция skills-store (включая skillModifiers computed) в projection над GameWorld. addSkillXp/applySkillChanges делегируют в world.skills.*, store reactive-state синхронизируется через applyToStores. recalculateSkillModifiers остаётся в domain (уже там), вызывается из world.skills при изменении уровней."
    status: completed
  - id: f3_finance_projection
    content: "Миграция finance-store (investments, dividends) в projection над GameWorld по тому же паттерну, что career/skills. Аудит всех store мутаций: divest, invest, collectDividends — переносятся в world.finance.*, store делегирует."
    status: completed
  - id: f3_events_projection
    content: "Миграция events-store (currentEvent, eventQueue, cooldowns) в projection над GameWorld. setCurrentEvent, showNextEvent, resolveCurrentEvent — переносятся в world.events.*. Cooldown-логика (cooldownByEventId, lastWeeklyEventWeek) — в world.events. Store делегирует."
    status: completed
  - id: f3_wallet_stats_time_projection
    content: "Миграция wallet/stats/time-store в projections. Это самые простые stores (числовые поля + clamp-логика), но time-store содержит sleepDebt/advanceHours бизнес-логику — переносим в world.time. stats-store — чистая проекция чисел. wallet-store — деньги + earn/spend."
    status: completed
  - id: f4_application_pure
    content: "Убрать импорт Pinia из src/application/game/commands.ts, queries.ts, index.types.ts. Все appGameCommands теперь принимают world: GameWorld как первый аргумент (от SPAExecutor или вызывающего code). Проверить architecture-тест layer-boundaries.test.ts — счётчик violations application→stores должен упасть с 3 до 0. Если остаётся — разобрать каждый случай."
    status: completed
  - id: f4_spa_executor
    content: "Реализовать src/application/game/SPAExecutor.ts: createSPAExecutor() возвращает executor, который принимает world из game-store (через gameStore.world reactive-ref), вызывает pure appGameCommands, и через triggerRef или world.applyToStores(stores) синхронизирует изменения обратно в Pinia stores для UI. SPAExecutor реализует GameExecutor interface (определён в index.types.ts)."
    status: completed
  - id: f4_executor_interface
    content: "Зафиксировать GameExecutor и GameQueryExecutor interfaces в src/application/game/index.types.ts. Сигнатура: executeAction(world: GameWorld, actionId: string): Promise<ExecuteResult> (без optional world?). В TSDoc указать: SPAExecutor поставляет world из Pinia, ServerExecutor — из сессии по sessionId. Это разблокирует этапы 4-8 server-first плана."
    status: completed
  - id: f5_e2e_smoke
    content: "E2E smoke-test полного цикла через новый стек: start game → execute action (через SPAExecutor) → work shift → event resolve → save/load. Цель: убедиться, что bridge-период завершён, все stores корректно projections, GameWorld — единственный source of truth. Если есть регрессии — вернуться к соответствующей Фазе 3 store."
    status: completed
  - id: f5_docs_update
    content: "Обновить документацию после завершения миграции: ARCHITECTURE_CONTRACT.md (убрать из Known violations application→stores, обновить раздел Recovery plan), ARCHITECTURE_OVERVIEW.md (добавить GameWorld aggregate в описание domain layer), STORES_REFERENCE.md (отметить stores как projections над GameWorld). Записать факт завершения в IMPLEMENTATION_STATUS.md."
    status: completed
  - id: f5_remove_bridge
    content: "Удалить временный bridge.ts (fromStores/applyToStores) — DEFERRED к server-first миграции. В SPA-only режиме bridge не критичен (изолирован в deprecated-модуле, не нарушает V-1). Удаление требует превратить stores в истинные projections над gameStore.world: Ref<GameWorld>, что рискованно в SPA-only режиме. Server-first миграция (Strategy A) удалит bridge при замене SPAExecutor на ServerExecutor."
    status: pending
isProject: false
---

# План: GameWorld aggregate foundation (ADR-0005, Strategy A)

## Контекст

ADR-0005 (июль 2026) зафиксировал стратегию: восстановить `GameWorld` aggregate в `src/domain/game-world/` как единый source of truth. Stores становятся projections, application layer — чистым (без импорта Pinia). Это разблокирует server-first миграцию (этапы 4-8 server-first плана выполняются почти без изменений после этого плана).

**Текущее состояние (после аудита P0-P1):**
- `appGameCommands.executeAction` централизован, но импортирует Pinia stores напрямую (3 файла-нарушителя: `commands.ts`, `queries.ts`, `index.types.ts` — отслеживается architecture-тестом, violations capped ≤3).
- `calculateStatChanges` + `recalculateSkillModifiers` + `salaryMultiplier` подключены к stores (P1-6, P1-7), но бизнес-логика живёт в application layer, а не domain.
- `layer-boundaries.test.ts` защищает domain/infrastructure от новых нарушений, но application→stores нарушения остаются.

**Финальная цель плана:**
- `GameWorld` — единственный source of truth в `src/domain/game-world/`.
- Все Pinia stores — projections (reactive getters + thin setters, делегирующие в world).
- `application` layer — pure: signature `(world: GameWorld, ...): CommandResult`, 0 импортов Pinia.
- `SPAExecutor` реализует `GameExecutor` interface, готов к server-first миграции.

## Ключевые решения

### 1. Bridge-период, а не big-bang

Полная миграция всех stores за один PR — высокий риск регрессий. План использует **bridge-период** через `GameWorld.fromStores()`/`applyToStores()` (Фаза 1): stores остаются reactive source of truth для UI, но бизнес-логика переезжает в domain commands, которые работают с GameWorld. Миграция store-by-store (Фаза 3: career → skills → finance → events → wallet/stats/time).

### 2. Совместимость save-формата

`GameWorld.toJSON()`/`fromJSON()` должны совпадать с текущей структурой save-данных (`src/domain/balance/constants/default-save.ts`). Существующие save-файлы загружаются без миграции. Добавляется только `version`-поле для будущих schema-эволюций.

### 3. Domain-only без Vue

`src/domain/game-world/` — pure TypeScript, без импортов Vue/Nuxt/Pinia. Bridge (`fromStores`/`applyToStores`) принимает plain объекты (snapshots), а не Pinia refs — domain не зависит от реактивности. Pinia stores в `src/stores/` отвечают за reactive-связь с UI.

### 4. SPAExecutor как точка интеграции

После Фазы 4 вся бизнес-логика вызывается через `SPAExecutor`. UI/composables используют executor, а не `appGameCommands` напрямую. В server mode `SPAExecutor` заменяется на `ServerExecutor` с той же сигнатурой — остальной код не меняется.

## Риски и митигации

| Риск | Митигация |
|------|-----------|
| Регрессии в бизнес-логике при переносе | Фаза 2.2 — тесты на паритет старой/новой реализации для каждого действия |
| Bridge-период затягивается | Фаза 5.2 — явная задача на удаление bridge после завершения миграции всех stores |
| Save-несовместимость | Фаза 1.2 — round-trip тесты toJSON/fromJSON, формат совпадает с default-save.ts |
| Pinia reactive-state рассинхрон с GameWorld | Фаза 3 — каждый store мигрируется отдельно с e2e smoke-test после |
| Architecture-тест не ловит новые нарушения | Фаза 4.1 — счётчик violations application→stores должен упасть до 0 |

## Рекомендованный порядок работ

```
Фаза 1 (Foundation, ~3-5 дней):
  f1_game_world_skeleton → f1_serialization → f1_game_facade
    → f1_bridge_from_stores → f1_bridge_apply_to_stores

Фаза 2 (Actions migration, ~3-4 дня):
  f2_migrate_actions → f2_verify_actions_parity

Фаза 3 (Stores → projections, ~5-7 дней, по одному store за PR):
  f3_career_projection
    → f3_skills_projection
    → f3_finance_projection
    → f3_events_projection
    → f3_wallet_stats_time_projection

Фаза 4 (Application pure + Executor, ~2-3 дня):
  f4_executor_interface → f4_application_pure → f4_spa_executor

Фаза 5 (Cleanup + docs, ~2 дня):
  f5_e2e_smoke → f5_remove_bridge → f5_docs_update
```

**Итого: 15-21 рабочий день (~3-4 недели).** Разбить на 5 PR по фазам, каждый с e2e smoke-test перед merge.

## Зависимости

- **Внешние:** нет новых зависимостей. Использует существующий Pinia, TypeScript, Vitest.
- **Внутренние:** план выполняется после завершения P0-P1 аудита (дедупликация executeAction, подключение calculateStatChanges/skillModifiers — закрепляет бизнес-логику, которая переносится в domain).

## Выход за рамки плана

- **Server-first этапы 4-8** (Nitro API, ServerExecutor, Node.js переезд) — отдельный план после этого. Этот план только готовит foundation.
- **Новые игровые механики** — не добавляются. План чисто архитектурный.
- **UI изменения** — минимальные. Stores остаются reactive для UI, компоненты не меняются (кроме случаев, где явно нужны правки).
