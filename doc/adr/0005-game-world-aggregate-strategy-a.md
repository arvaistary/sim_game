# ADR-0005: State abstraction strategy — GameWorld aggregate (Strategy A)

**Дата:** июль 2026
**Статус:** Принято

## Контекст

Текущая архитектура (после ADR-0002 «Удаление ECS» и ADR-0003 «Слоистая архитектура») хранит состояние игры в Pinia stores как единственный source of truth. Бизнес-логика размазана между stores, composables и `application/commands.ts`, который **напрямую импортирует Pinia stores** — это нарушает [doc/core/ARCHITECTURE_CONTRACT.md §application](../core/ARCHITECTURE_CONTRACT.md).

Параллельно существовал план миграции на server-first архитектуру (см. архив `archive/plans/server-first_architecture_migration_05bcd970.plan.md`), целевой ориентир которого — долгосрочный переезд game-runtime на Node.js бекенд. В server mode Domain Layer обязан работать **без Pinia вообще**: состояние приходит deserialize-нутым из сессии, а не из Vue reactive-системы.

Разрыв: server-first план предполагает чистый `application` layer с signature `(world: GameWorld, ...)` и `GameWorld` aggregate в `domain/`, но в коде этого нет. Дальнейшая разработка без зафиксированной стратегии state abstraction закрепит store-centric модель и потребует переписывания при переходе на сервер.

## Решение

Принять **Стратегию A: восстановить `GameWorld` aggregate в `src/domain/game-world/` как единый source of truth; Pinia stores становятся тонкими projections/view-models над `GameWorld`.**

### Форма реализации

- **НЕ обязательно** восстанавливать именно ECS (Components/Systems/Entities из ADR-0001-era). Достаточно `GameWorld` как state-container + command-handler pattern (actions как methods класса или как command-объекты).
- `GameWorld` живёт в `src/domain/game-world/` (не в `balance/` — там pure-каталоги без state).
- `game-facade/` восстанавливается как тонкая обёртка над `GameWorld` для application-слоя: `createWorldFromSave()`, `getGameFacade()`.
- Stores читают snapshot из `GameWorld.toJSON()` через подписку или явный poll. Они **не** хранят состояние как source of truth — только UI-derived state и projections.
- API чистого application layer: `executeAction(world: GameWorld, actionId: string): CommandResult`. `world` прокидывается из store-facade, application его трансформирует и возвращает result.
- `GameExecutor`/`GameQueryExecutor` интерфейсы (из server-first плана 1.2) — без optional `world?`. В SPA mode `SPAExecutor` сам поставляет world из Pinia store, в server mode `ServerExecutor` грузит world из сессии по sessionId. Сигнатура одна, разница — кто поставляет `world`.
- `GameWorld.toJSON(): GameWorldJSON` + `GameWorld.fromJSON(json): GameWorld` — сериализация (заменит концептуальный тип из server-first плана реальным).

### Это НЕ откат ADR-0002

ADR-0002 удалил ECS **как реализацию** (Phaser-зависимость, сложная components-systems-entities иерархия). ADR-0005 вводит `GameWorld` aggregate **на command-pattern** — state-container + command-methods. Это новая реализация агрегата, а не возврат к Phaser ECS.

## Последствия

### Положительные

- Server-first план становится достижимым: Domain Layer работает без Pinia, в server mode world приходит из сессии.
- `application` layer становится чистым: signature `(world, params)` вместо `useXxxStore()` — нарушений контракта нет.
- Единый source of truth: вся бизнес-логика в `domain/game-world/`, stores — тонкие projections. Дедупликация executeAction/applyWorkShift/resolveEvent (P1-4, P1-5) закрепляется архитектурно.
- Game state сериализуется одним вызовом `world.toJSON()` — Save/Load упрощается.
- Тестируемость: `GameWorld` тестируется в изоляции без Vue/Nuxt/Pinia.

### Отрицательные

- **Крупнейшая задача плана**: закладывать 2-3 недели. Перенос бизнес-логики из stores в domain поэтапно (actions → career → skills → finance → events).
- Bridge-период: на первом этапе `GameWorld.fromStores(...)` собирает world из stores, `world.applyToStores(stores)` пушит обратно. Это временный bridge для постепенного перехода.
- Риск регрессий: миграция затрагивает всю бизнес-логику. Покрыть architecture-тестами (`test/unit/architecture/layer-boundaries.test.ts` уже добавлен в P1-8).

## Альтернативы

### Альтернатива 1: Стратегия B — StoreFacade/snapshot (stores остаются source of truth, application работает со snapshot-копией)

- **Плюсы:** Быстрый server-first MVP, минимум изменений в текущем коде.
- **Минусы:** Закрепляет store-centric модель. При переезде на Node.js (этап 8 server-first плана) потребует полного переписывания — stores не существуют без Vue reactive-системы.
- **Почему нет:** Финальная цель — отдельный Node.js бекенд. Стратегия B даёт краткосрочный выигрыш ценой долгосрочного долга.

### Альтернатива 2: Восстановить полный ECS (Components/Systems/Entities из ADR-0001)

- **Плюсы:** Соответствует оригинальному видению server-first плана (game-facade + systems).
- **Минусы:** ECS — избыточная сложность для current scope. Возврат к тому, что было удалено в ADR-0002.
- **Почему нет:** ADR-0002 зафиксировал причину удаления ECS. Command-pattern на `GameWorld` даёт те же преимущества (state-container + чистый domain) без overhead.

## План внедрения

Эта ADR фиксирует стратегию. Конкретная реализация разбивается на подзадачи в отдельном плане (после этого ADR):

1. **Фаза 1 — Foundation.** Создать `src/domain/game-world/GameWorld.ts` (state-container), `toJSON`/`fromJSON`, `game-facade/`. Bridge: `fromStores`/`applyToStores`.
2. **Фаза 2 — Миграция actions.** Перенести `executeAction`/`simulateWorkShift`/`resolveEventDecision` на signature `(world, ...)`.
3. **Фаза 3 — Миграция stores.** Каждый store (career, skills, finance, events, ...) становится projection над `GameWorld`.
4. **Фаза 4 — `application` чистый.** Убрать импорт Pinia из `src/application/game/commands.ts`, `queries.ts`, `index.types.ts` (сейчас 3 файла, отслеживается architecture-тестом `layer-boundaries.test.ts`).
5. **Фаза 5 — `SPAExecutor`.** `createSPAExecutor()` возвращает executor: принимает `world` из Pinia store → вызывает pure `appGameCommands` → push в stores через `world.applyToStores()`.
6. **Фаза 6 — Server-first готов.** Этапы 4-8 server-first плана (Nitro API, ServerExecutor, Node.js переезд) выполняются почти без изменений.

---

**Связанные документы:**
- [../archive/plans/server-first_architecture_migration_05bcd970.plan.md](../archive/plans/server-first_architecture_migration_05bcd970.plan.md) — целевая архитектура (завершена, заархивирована)
- [../archive/plans/game_life_—_аудит_и_рекомендации_3a3e7e84.plan.md](../archive/plans/game_life_—_аудит_и_рекомендации_3a3e7e84.plan.md) — P-Foundation (завершена, заархивирована)
- [doc/core/ARCHITECTURE_CONTRACT.md](../core/ARCHITECTURE_CONTRACT.md) — §application не импортирует stores
- [doc/adr/0002-ecs-removal.md](0002-ecs-removal.md) — почему ADR-0005 НЕ откат ECS
- [doc/adr/0003-layered-architecture.md](0003-layered-architecture.md) — слоистая архитектура
