# Server-First Architecture Migration

Дата: 2026-07-16
Статус: Stage 7 завершён; отдельные client/server dev-процессы и server-authoritative cutover реализованы. Stage 8 — production persistence и deployment hardening.

## Цель

Архитектура поддерживает три режима исполнения и миграционный путь на отдельный Node.js сервер:

- **SPA** (только test/offline) — локальное исполнение через Pinia stores + GameWorld bridge
- **Server** — через Nitro Server API (`server/api/game/**`), состояние в сессии
- **Hybrid** — Server при online, fallback на SPA при offline + offline queue

Offline-first: буферизация действий при потере сети с автоматической синхронизацией.

## Текущая реализация client/server split

- `npm run dev` запускает client на `http://localhost:3000` и API server на `http://localhost:3001`.
- `npm run dev:client` запускает только client с `NUXT_PUBLIC_GAME_MODE=server` и API base URL `http://127.0.0.1:3001`.
- `npm run dev:server` запускает только Nitro API process; CORS и cookie credentials настроены для локального client.
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

- `nuxt.config.ts` использует `gameMode: 'spa'`.
- UI вызывает синхронные методы `gameStore` и legacy `appGameCommands`.
- `ServerExecutor` и async-методы существуют, но не являются единственным путём выполнения.
- `hybrid` сейчас возвращает SPA fallback, а не полноценный server-online режим.
- `/api/game/sync` обрабатывает только тип `action`; work/career/education/finance/event требуют общего контракта.
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

Общий контракт хранить в `src/domain/api-contract/`. Для каждого endpoint определить request, response, error code и правила авторизации.

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
2. Оставить Nitro memory storage только для тестов и локального demo.
3. Для production выбрать Redis или PostgreSQL.
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
