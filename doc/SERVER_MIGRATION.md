# Server-First Architecture Migration

Дата: 2026-07-02
Статус: Stages 1-6 завершены, Stage 7 (этот документ) в процессе, Stage 8 (Я.Игры + выделенный сервер) отложен.

## Цель

Архитектура поддерживает три режима исполнения и миграционный путь на отдельный Node.js сервер:

- **SPA** (по умолчанию) — локальное исполнение через Pinia stores + GameWorld bridge
- **Server** — через Nitro Server API (`server/api/game/**`), состояние в сессии
- **Hybrid** — Server при online, fallback на SPA при offline + offline queue

Offline-first: буферизация действий при потере сети с автоматической синхронизацией.

## Архитектура

### Слои и направления зависимостей

```
UI Layer (Components + Composables)
    ↓
Pinia Store (useGameStore) [async + режим-aware]
    ↓
Application Layer (Executors + offline queue + state-sync)
    ├─ SPAExecutor (Promise.resolve обёртка над pure commands)
    ├─ ServerExecutor ($fetch к Nitro API)
    └─ OfflineQueueManager (буфер действий)
    ↓
Domain Layer
    ├─ GameWorld aggregate
    ├─ api-contract (shared типы для client + server)
    └─ game-mode (типы режимов)
    ↓
Infrastructure
    ├─ LocalStorageSaveRepository (SPA + offline cache)
    └─ config/game-mode.ts (runtimeConfig helpers)
```

Server-side:

```
server/api/game/** (Nitro endpoints)
    ↓
server/utils/session.ts (cookie-based, TTL 24h)
server/utils/error-handler.ts (unified responses)
    ↓
Domain Layer (GameWorld, commands, queries) [общий с client]
```

### Ключевые модули

**Application (`src/application/game/`)**

| Модуль | Назначение |
|--------|------------|
| `commands.ts`, `queries.ts` | Pure functions над `GameWorld` |
| `async-executor.types.ts` | `AsyncGameExecutor`/`AsyncGameQueryExecutor` интерфейсы |
| `spa-async-executor.ts` | Sync→async адаптер для SPA режима |
| `server-executor.ts`, `server-query-executor.ts` | Реализация через `$fetch` |
| `executor-factory.ts` | Factory по `GameMode` (DI, без импортов infrastructure) |
| `state-sync.ts` | `loadWorldFromServer`, `syncWorldWithServer`, `checkConflict` |
| `error-handler.ts` | `parseApiError`, `isNetworkError`, классификация ошибок |
| `offline-queue.ts` | `OfflineQueueManager` (enqueue/sync/persist) |
| `legacy.ts` | Back-compat shim для `appGameCommands`/`appGameQueries` (deprecated) |

**Domain (`src/domain/`)**

| Модуль | Назначение |
|--------|------------|
| `game-mode/` | Типы `GameMode`, `GameModeConfig`, `SyncStatus` |
| `api-contract/` | Shared типы API (`ApiResponse`, `SyncResponse`, и т.д.) — нейтральный слой |
| `game-world/` | `GameWorld` aggregate + bridge к Pinia |

**Infrastructure (`src/infrastructure/config/`)**

| Модуль | Назначение |
|--------|------------|
| `game-mode.ts` | `getGameMode()`, `isServerMode()`, `subscribeToNetworkChanges` |

**Server (`server/api/game/`, `server/utils/`)**

| Endpoint | Метод | Назначение |
|----------|-------|------------|
| `/api/game/state` | GET | Получить состояние мира |
| `/api/game/init` | POST | Инициализировать мир (новый или из save) |
| `/api/game/actions/execute` | POST | Выполнить action |
| `/api/game/finance/overview` | GET | Финансовый обзор |
| `/api/game/investments` | GET | Список инвестиций |
| `/api/game/career/track` | GET | Карьерный трек |
| `/api/game/sync` | POST | Применить offline queue |

## Режимы и переключение

### Конфигурация

`nuxt.config.ts` `runtimeConfig.public`:

```typescript
runtimeConfig: {
  public: {
    gameMode: 'spa',          // 'spa' | 'server' | 'hybrid'
    gameOfflineQueue: true,    // включить offline queue (server/hybrid)
    gameApiBaseUrl: '',        // URL API (пусто = тот же origin)
  },
},
```

Переключение через `.env`:

```
NUXT_PUBLIC_GAME_MODE=server
NUXT_PUBLIC_GAME_API_BASE_URL=https://api.example.com
```

### Dev ModeSwitcher

`src/components/dev/ModeSwitcher/ModeSwitcher.vue` — dev-компонент для переключения режимов в UI. Сохраняет override в `localStorage` (`gl_game_mode_override`) и перезагружает страницу.

## Offline-first поток

1. Пользователь выполняет действие в server/hybrid режиме
2. `useGameStore.executeActionAsync` вызывает `executor.executeAction`
3. `ServerExecutor` делает `$fetch` к API
4. При network error:
   - `OfflineQueueManager.enqueue` добавляет действие в очередь
   - Очередь persist-ится в `localStorage` (`gl_offline_queue`)
5. При восстановлении сети (`setOnlineStatus(true)`):
   - `flushOfflineQueue` отправляет batch через `POST /api/game/sync`
   - При success — очередь очищается
   - При повторной ошибке — остаётся для retry

## Добавление нового API endpoint

1. Добавить типы в `src/domain/api-contract/types.ts` (shared contract)
2. Создать handler в `server/api/game/<path>.<method>.ts`
3. Использовать `getOrCreateSessionId` + `loadWorldForSession`/`saveWorldForSession`
4. Добавить метод в `ServerExecutor` (`src/application/game/server-executor.ts`)
5. При необходимости — расширить `AsyncGameExecutor` интерфейс

Пример endpoint:

```typescript
export default defineEventHandler(async (event) => {
  const sessionId: string = getOrCreateSessionId(event)
  const world: GameWorld | null = await loadWorldForSession(sessionId)

  if (!world) {
    throw createError({ statusCode: 404, statusMessage: 'Session not found' })
  }

  // domain logic
  await saveWorldForSession(sessionId, world)
  return world.toJSON()
})
```

## Миграция на отдельный Node.js сервер (Stage 8, отложен)

План долгосрочной миграции:

1. Выделить `src/domain/` + `src/application/game/commands.ts`/`queries.ts` в npm-пакет `@game-life/domain`
2. Создать сервер (Express/NestJS/Fastify), импортирующий общий domain пакет
3. Реализовать те же API endpoints, используя БД вместо in-memory storage
4. Обновить `ServerExecutor` (`apiBaseUrl`) на новый сервер
5. Отключить Nitro server-mode в Nuxt, оставить только SPA клиент

Подготовленные абстракции (executor factory, api-contract, session utils) делают эту миграцию механической.

## Архитектурные правила (важные)

- **`nuxt/server-client-boundary`**: `server/**` не импортируется в `src/**`. Поэтому API contract типы живут в `src/domain/api-contract/`, а `server/api/types.ts` их реэкспортирует.
- **`application` не импортирует `infrastructure`**: `executor-factory.ts` принимает `GameMode` параметром (DI), не импортирует `game-mode.ts` хелперы.
- **`GameMode` типы в `domain/game-mode/`**: нейтральный слой, доступный и application, и infrastructure.
- **Bridge `fromStores`/`applyToStores` — deprecated**: временный мост между Pinia и GameWorld. Будет удалён, когда stores станут true projections над GameWorld.

## Метрики

- Unit-тесты: 210+ (16 для server-first modules)
- Typecheck: 0 ошибок
- Rules audit: 0 violations
- Stage 1-6 завершены, Stage 7 (docs) в процессе, Stage 8 отложен
