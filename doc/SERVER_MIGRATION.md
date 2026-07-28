# Server-First Architecture Migration

Дата: 2026-07-16
Статус: Stage 7 завершён; M0/M1/M2 завершены — client/server dev-процессы, package boundaries и standalone Fastify API реализованы. Nitro handlers остаются compatibility layer. M3 — Docker persistence и PostgreSQL/Redis.

## Цель

Архитектура поддерживает три режима исполнения и миграционный путь на отдельный Node.js сервер:

- **SPA** (только test/offline) — локальное исполнение через Pinia stores + GameWorld bridge
- **Server** — через Nitro Server API (`server/api/game/**`), состояние в сессии
- **Hybrid** — Server при online, fallback на SPA при offline + offline queue

Offline-first: буферизация действий при потере сети с автоматической синхронизацией.

## Текущая реализация client/server split

- `npm run dev` запускает client на `http://localhost:3000` и API server на `http://localhost:3001`.
- `npm run dev:client` запускает только client с `NUXT_PUBLIC_GAME_MODE=server` и API base URL `http://127.0.0.1:3001`.
- `npm run dev:server` запускает legacy Nitro API process для обратной совместимости.
- `npm run dev:standalone-server` запускает независимый Fastify API на `API_PORT` (по умолчанию `3001`); текущий `/api/game/*` envelope сохранён. Именно этот process используется через `npm run dev`.
- `npm run build:client` создаёт static output для Яндекс Игр (`.output/public`).
- `npm run build:server` + `npm run start:server` создают Node server deployment.
- Все successful game API responses используют общий `ApiResponse<T>` envelope; client hydrates Pinia только из server state.

Production server требует внешнего storage вместо Nitro memory driver. Для cross-origin deployment задать `NUXT_PUBLIC_GAME_API_BASE_URL`, `NUXT_GAME_CORS_ORIGIN`, `NUXT_GAME_COOKIE_SAME_SITE=none` и `NUXT_GAME_COOKIE_SECURE=true`.

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
    ├─ `@game-life/contracts` (canonical типы для client + server)
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
| `@game-life/contracts` | Canonical API types (`ApiResponse`, `SyncResponse`, command/version DTO) |
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

## Миграция на отдельный Node.js сервер (Stage 8, ongoing)

План долгосрочной миграции:

1. M0/M1: создать npm workspaces `@game-life/contracts`, `@game-life/domain`, `@game-life/application`.
2. Перенести canonical API DTO в `@game-life/contracts`; legacy `src/domain/api-contract` оставлен compatibility facade.
3. Перенести framework-free GameWorld и commands в `@game-life/domain`; application ports уже выделены.
4. Создать standalone Fastify API, импортирующий packages.
5. Подключить PostgreSQL/Redis, затем обновить `ServerExecutor` на standalone API.
6. Отключить Nitro server-mode в Nuxt, оставить static SPA client.

M0/M1/M2 завершены. Следующий блок — подключение Docker PostgreSQL/Redis и замена memory repository; Nitro endpoints остаются compatibility layer до полного persistence parity.

## Архитектурные правила (важные)

- **`nuxt/server-client-boundary`**: `server/**` не импортируется в `src/**`. Canonical API contract types живут в `@game-life/contracts`; `src/domain/api-contract` и `server/api/types.ts` — compatibility facades.
- **`application` не импортирует `infrastructure`**: `executor-factory.ts` принимает `GameMode` параметром (DI), не импортирует `game-mode.ts` хелперы.
- **`GameMode` типы в `domain/game-mode/`**: нейтральный слой, доступный и application, и infrastructure.
- **Bridge `fromStores`/`applyToStores` — deprecated**: временный мост между Pinia и GameWorld. Будет удалён, когда stores станут true projections над GameWorld.

## Метрики

- Unit-тесты: 210+ (16 для server-first modules)
- Typecheck: 0 ошибок
- Rules audit: 0 violations
- Stage 1-7 завершены; M0/M1 завершены; Stage 8 persistence/standalone deployment в работе

---

## План полной миграции на server-authoritative архитектуру

**Актуализация:** 16 июля 2026
**Статус:** план подготовки
**Цель:** браузер остаётся SPA-клиентом, но сервер становится единственным источником истины для состояния и результатов игровых действий.

### 1. Целевая модель

```text
Vue UI
  -> composables / client store
  -> ServerExecutor
  -> Nitro API
  -> server application service
  -> GameWorld + domain commands
  -> persistent storage
  -> DTO состояния и результата
```

Правила:

- `ssr: false` можно сохранить: это режим отображения страниц, а не режим исполнения игры.
- `GameWorld` на сервере — authoritative state.
- Pinia на клиенте — projection/cache для UI, не источник игровых решений.
- Клиент отправляет намерение (`actionId` и минимальные параметры), но не стоимость, эффекты или итоговые значения.
- Все проверки ресурсов, возраста, денег, времени, cooldown и событий выполняются на сервере.
- Nitro остаётся первым backend; выделение отдельного Node.js сервера — последующий этап без изменения API-контрактов.

### 2. Текущие разрывы, которые нужно закрыть

- `nuxt.config.ts` использует server mode по умолчанию; legacy SPA path ещё не удалён.
- Часть UI и legacy `appGameCommands` всё ещё содержит синхронные compatibility вызовы.
- `ServerExecutor` и async-методы существуют, но не являются единственным путём выполнения.
- `hybrid` сейчас возвращает SPA fallback, а не полноценный server-online режим.
- `/api/game/sync` уже покрывает основные типы; новый canonical command envelope и idempotency пока не подключены.
- Server storage использует memory driver и TTL 24 часа; это неприемлемо для production persistence.

Критерий выхода: составлена таблица всех UI-команд и для каждой указан единственный server endpoint/application command.

### 3. Унифицировать application layer

1. Перенести каждую мутацию в явную команду над `GameWorld`.
2. Убрать обращения application/domain-команд к Pinia stores.
3. Создать единый `GameApplicationService` для server handlers:
   - загрузить aggregate;
   - проверить команду;
   - выполнить domain command;
   - применить периодические эффекты;
   - сохранить aggregate;
   - вернуть typed result и state version.
4. Оставить `GameWorld`, commands и queries в shared/domain слое.
5. Пометить `SPAExecutor`, `legacy.ts`, `fromStores` и `applyToStores` как migration-only до cutover.

Команды должны покрывать:

- lifestyle action;
- рабочую смену и карьеру;
- образование;
- финансовые действия и инвестиции;
- события и выборы;
- переход времени и monthly settlement;
- новую игру, загрузку и сброс состояния.

### 4. Стабилизировать API-контракт

Общий контракт хранить в `@game-life/contracts/`. Для каждого endpoint определить request, response, error code и правила авторизации.

| Endpoint | Назначение | Требования |
|---|---|---|
| `POST /api/game/init` | создать новую игру или восстановить save | session + version |
| `GET /api/game/state` | получить состояние мира | typed projection |
| `POST /api/game/actions/execute` | выполнить одну команду | idempotency + version check |
| `POST /api/game/sync` | применить очередь намерений | порядок и retry-safe |
| `GET /api/game/career/track` | получить карьеру | server state |
| `GET /api/game/finance/overview` | получить финансы | server state |
| `GET /api/game/investments` | получить инвестиции | server state |
| `GET /api/game/activity-log` | получить журнал | добавить при необходимости |

Не использовать разные payload-форматы для одиночной команды и batch без общего `GameCommandEnvelope`:

```ts
{
  commandId: string,
  actionId: string,
  payload: Record<string, unknown>,
  clientVersion?: number,
  idempotencyKey: string,
  createdAt: number
}
```

Ответ должен содержать `result`, `state`, `stateVersion`, `appliedCommandId` и typed error при отказе.

### 5. Подключить production persistence

1. Сохранить repository interface между API и хранилищем.
2. Оставить Nitro memory storage только для compatibility/demo до persistence cutover.
3. PostgreSQL использовать как source of truth; Redis — для cache, locks и rate limits.
4. Хранить session/user id, сериализованный `GameWorld`, `stateVersion`, processed idempotency keys, timestamps и schema version.
5. Добавить миграции save schema и backup/restore policy.
6. Для serverless использовать внешнее хранилище, не process memory.

### 6. Обеспечить конкурентность и повторяемость

Реализовать:

- optimistic locking по `stateVersion` или короткую per-session lock;
- защиту от двойного клика и повторной доставки запроса;
- idempotency key для каждой команды;
- последовательное применение batch-команд;
- `409 conflict` с актуальным state для устаревшего клиента;
- server command log для диагностики.

Оффлайн-очередь хранит только намерения. Она не считается подтверждённым изменением authoritative state: после reconnect сервер повторно валидирует каждую команду.

### 7. Перевести клиент на единый async path

1. Сделать `createExecutor('server')` production default.
2. Оставить в `game.store.ts` один публичный async API.
3. Перевести все компоненты и composables на него: действия, работа, карьера, образование, финансы, события, инвестиции и время.
4. Обновлять Pinia только через `state -> projection` adapter после ответа сервера.
5. Запретить UI прямой вызов domain commands и legacy `appGameCommands`.
6. Добавить единое состояние loading/error/conflict и блокировку повторного запуска.

Критерий: поиск по `src/` не находит production call sites синхронных игровых мутаций.

### 8. Реализовать lifecycle сессии

1. При открытии игры вызвать `GET /state`.
2. При `session_not_found` вызвать `POST /init`.
3. В production включить `httpOnly`, `sameSite`, `secure` для cookie.
4. Для публичной игры использовать signed session id; для аккаунтов заменить его на user id.
5. Добавить reset/logout endpoint с подтверждением.
6. Разделить anonymous demo session и постоянную пользовательскую игру.

### 9. Безопасность и эксплуатация

- Валидировать body через schema validator.
- Не принимать от клиента `statChanges`, money delta, salary и вычисленные эффекты.
- Ограничить размер payload и частоту команд.
- Добавить CSRF protection для cookie-based mutations.
- Не логировать персональные данные и полное состояние без необходимости.
- Добавить structured logs: session/user, command id, duration, result, error code.
- Добавить health/readiness endpoints и метрики ошибок API.

### 10. Тестовая стратегия

Добавить до cutover:

1. Unit-тесты domain commands и queries.
2. Contract tests каждого API endpoint.
3. Integration tests с тестовым persistent repository.
4. Тесты init, reload, TTL, reset и missing session.
5. Тесты duplicate request, stale version, concurrency и batch retry.
6. Browser E2E в `server` mode.
7. Parity tests: одинаковые сценарии через SPA и server executor.
8. Regression matrix desktop/tablet/mobile; существующий integrity gate сохранить.

Минимальные acceptance scenarios:

- refresh не теряет игру;
- повторный запрос не применяет действие дважды;
- клиент не может подменить цену или эффект;
- сервер отклоняет действие при недостатке ресурсов;
- reconnect применяет очередь в исходном порядке;
- ошибка сервера не оставляет Pinia в неподтверждённом состоянии;
- после deploy состояние доступно из внешнего хранилища.

### 11. Rollout и удаление legacy

**Фаза A — подготовка:** контракты, application service, repository interface, inventory команд.
**Фаза B — API:** завершить endpoints и server validation.
**Фаза C — клиент:** перевести UI на async executor и server projections.
**Фаза D — persistence:** Redis/PostgreSQL, locks, idempotency, schema migrations.
**Фаза E — shadow/canary:** сравнивать server результаты на одинаковых сценариях.
**Фаза F — cutover:** поставить `gameMode: 'server'` по умолчанию, убрать production fallback на SPA.
**Фаза G — cleanup:** удалить legacy sync path, SPAExecutor, bridge и неиспользуемые offline assumptions.

### M3 durable persistence cutover

M3 adds PostgreSQL/JSONB persistence, CAS state versions and transactional processed-command idempotency. Nitro and standalone Fastify use same application service and domain executor. `DATABASE_URL` is server-only; run `npm run db:migrate` before deployment and require `/api/ready` to report matching migration count. Redis remains deferred and cannot become canonical state. Rollback is application rollback with forward-compatible schema recovery; no destructive migration rollback.

### Definition of Done

Миграция завершена, когда:

- все игровые мутации проходят через server application service;
- клиент не вычисляет и не подтверждает игровые результаты;
- server state хранится во внешнем persistent storage;
- работают idempotency, version conflict и concurrency protection;
- reload/reconnect/deploy не теряют состояние;
- server-mode E2E и contract tests проходят в CI;
- `spa` остаётся только тестовым/offline режимом либо удалён отдельным решением;
- документация и runtime configuration отражают server mode как production default.
