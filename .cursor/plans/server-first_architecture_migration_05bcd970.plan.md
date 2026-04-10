---
name: Server-First Architecture Migration
overview: Миграция архитектуры игры с текущего SPA подхода на Server-First подход с поддержкой будущей миграции на отдельный Node.js фреймворк. Создание унифицированного Application Layer, который может работать как локально (SPA), так и через сервер (Nitro API). Включает offline-first возможности и подготовку для интеграции с Яндекс.Игры.
todos:
  - id: stage1-config
    content: Создать конфигурацию режимов (game-mode.ts) с типом GameMode, хелперами и offline-first флагами
    status: pending
  - id: stage1-interface
    content: Создать интерфейсы GameExecutor и GameQueryExecutor в executor.types.ts
    status: pending
  - id: stage1-api-types
    content: Создать типы для API запросов/ответов в server/api/types.ts с unified error handling
    status: pending
  - id: stage2-spa-executor
    content: Реализовать SPA Executor как обертку над appGameCommands с Promise.resolve()
    status: pending
  - id: stage2-spa-query-executor
    content: Реализовать SPA Query Executor для чтения данных (getFinanceOverview, getInvestments и т.д.)
    status: pending
  - id: stage2-server-executor-stub
    content: Создать заглушку Server Executor с ошибкой 'not implemented yet'
    status: pending
  - id: stage2-factory
    content: Создать фабрику createExecutor(mode) для выбора нужного исполнителя
    status: pending
  - id: stage3-store-refactor
    content: "Обновить useGameStore: добавить executor, сделать методы асинхронными, добавить логику режимов"
    status: pending
  - id: stage3-composables
    content: Обновить composables (useActions, useFinance, useEvents) для работы с async методами store
    status: pending
  - id: stage4-session-utils
    content: Создать утилиты для работы с сессиями в server/utils/session.ts с TTL
    status: pending
  - id: stage4-api-types-impl
    content: Создать общие типы API responses (ApiResponse<T>, ErrorResponse)
    status: pending
  - id: stage4-api-state
    content: Создать API endpoint GET /api/game/state для получения состояния
    status: pending
  - id: stage4-api-init
    content: Создать API endpoint POST /api/game/init для инициализации мира
    status: pending
  - id: stage4-api-actions
    content: Создать API endpoint POST /api/game/actions/execute с возвратом результата + состояния
    status: pending
  - id: stage4-api-queries
    content: Создать API endpoints для запросов (GET /api/game/finance, GET /api/game/investments)
    status: pending
  - id: stage5-server-executor
    content: Реализовать Server Executor с вызовами через $fetch к Nitro API
    status: pending
  - id: stage5-server-query-executor
    content: Реализовать Server Query Executor для чтения данных с сервера
    status: pending
  - id: stage5-error-handling
    content: Создать unified error handler для API responses и сетевых ошибок
    status: pending
  - id: stage5-offline-queue
    content: Реализовать offline queue для действий при отсутствии соединения
    status: pending
  - id: stage5-store-server-mode
    content: Обновить useGameStore для полной работы в Server Mode с синхронизацией
    status: pending
  - id: stage6-mode-switcher
    content: Создать компонент ModeSwitcher для переключения режимов в разработке
    status: pending
  - id: stage6-test-spa
    content: Протестировать все функции в SPA режиме, убедиться что ничего не сломалось
    status: pending
  - id: stage6-test-server
    content: "Протестировать Server Mode: базовые операции, сохранение, обработку ошибок"
    status: pending
  - id: stage6-test-offline
    content: Протестировать offline-first: работу без интернета, очередь действий, синхронизацию
    status: pending
  - id: stage7-docs
    content: Создать документацию SERVER_MIGRATION.md с объяснением архитектуры и offline-first
    status: pending
  - id: stage7-readme
    content: Обновить doc/README.md с секцией о режимах работы и offline-first
    status: pending
  - id: stage8-yandex-games-prep
    content: Подготовить инфраструктуру для интеграции с Яндекс.Игры токеном (placeholder)
    status: pending
isProject: false
---

# План миграции на Server-First архитектуру

## Цель
Создать гибкую архитектуру, которая:
- Сейчас работает в SPA режиме (локально)
- Позднее может работать через Nitro Server API
- В будущем легко мигрирует на отдельный Node.js фреймворк
- Поддерживает offline-first (работа без интернета)
- Готова к интеграции с Яндекс.Игры токеном

## Архитектура до и после

### Текущая архитектура
```
UI Layer (Composables + Components)
    ↓
Pinia Store (useGameStore)
    ↓
Application Layer (appGameCommands + appGameQueries) [синхронные]
    ↓
Domain Layer (GameWorld + Systems) [классы]
    ↓
Infrastructure (LocalStorageSaveRepository)
```

### Целевая архитектура
```
UI Layer (Composables + Components) [без изменений]
    ↓
Pinia Store (useGameStore) [асинхронный, режим-независимый]
    ↓
Application Layer (Executors)
    ├─ SPAExecutor (локальный, синхронный)
    │   └─ SPAQueryExecutor (чтение данных)
    └─ ServerExecutor (через API, асинхронный)
        └─ ServerQueryExecutor (чтение данных)
    ↓
Offline Layer (Queue Manager)
    └─ OfflineQueue (буфер действий при отсутствии сети)
    ↓
Network Layer
    ├─ Online: API calls
    └─ Offline: Local execution
    ↓
Domain Layer (GameWorld + Systems) [без изменений, shared]
    ↓
Infrastructure
    ├─ LocalStorageSaveRepository (SPA mode + offline cache)
    ├─ Session/Database Repository (Server mode)
    └─ Sync Manager (конфликт resolution)
```

---

## ЭТАП 1: Создание фундамента для переключения режимов

### 1.1 Создать конфигурацию режимов
**Файл:** `src/infrastructure/config/game-mode.ts`

Создать:
- Тип `GameMode = 'spa' | 'server' | 'hybrid'`
- Константу `gameMode` через `nuxt.config.ts` runtime config:
  ```typescript
  runtimeConfig: {
    public: {
      gameMode: 'spa'  // default, можно менять через .env
    }
  }
  ```
- Хелперы `isServerMode()`, `isSPAMode()`, `isHybridMode()`
- Offline флаги: `isOnline()` (navigator.onLine), `isOfflineCapable()`
- Event listeners для online/offline событий

**Важно:** НЕ использовать `import.meta.server` - это значит "код выполняется на сервере", а не "клиент использует серверный режим".

### 1.2 Создать интерфейсы исполнителей
**Файл:** `src/application/game/executor.types.ts`

Определить два интерфейса:

**GameExecutor** (для команд/мутаций):
```typescript
export interface GameExecutor {
  // world параметр опциональный - в server mode не нужен
  executeAction(world?: GameWorld, actionId: string): Promise<ExecuteResult>
  applyWorkShift(world?: GameWorld, hours: number): Promise<string>
  startEducationProgram(world?: GameWorld, programId: string): Promise<string>
  advanceEducation(world?: GameWorld): Promise<string>
  executeFinanceDecision(world?: GameWorld, actionId: string): Promise<string>
  resolveEventDecision(world?: GameWorld, eventId: string, choiceId: string): Promise<string>
  collectInvestment(world?: GameWorld, investmentId: string): Promise<string>
  advanceTime(world?: GameWorld, hours: number): Promise<void>
  applyMonthlySettlement(world?: GameWorld): Promise<string>
  executeLifestyleAction(world?: GameWorld, cardData: AnyRecord): Promise<string>
}
```

**GameQueryExecutor** (для чтения данных):
```typescript
export interface GameQueryExecutor {
  getFinanceOverview(world?: GameWorld): Promise<FinanceOverview>
  getInvestments(world?: GameWorld): Promise<Investment[]>
  getCareerTrack(world?: GameWorld): Promise<CareerTrack>
  canExecuteAction(world?: GameWorld, actionId: string): Promise<AvailabilityCheck>
  peekScheduledEvent(world?: GameWorld): Promise<EventQueueItem | null>
  getActivityLog(world?: GameWorld, filter?: string, limit?: number): Promise<ActivityLogEntry[]>
  getActivityTimelineWindow(world?: GameWorld, count: number, beforeIndex?: number): Promise<ActivityLogWindow>
}
```

Типы результатов:
- `ExecuteResult` (из `ActionSystem/index.types.ts`)
- `AnyRecord` (из `domain/game-facade/index.types.ts`)
- Создать недостающие типы: `FinanceOverview`, `Investment[]`, `CareerTrack`, `ActivityLogWindow`

### 1.3 Создать типы для API
**Файл:** `server/api/types.ts`

Создать универсальные типы для API responses:
```typescript
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ErrorResponse
}

export interface ErrorResponse {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface ActionExecuteResponse {
  result: ExecuteResult
  state: GameWorldJSON
  timestamp: number
}

export interface GameStateResponse {
  state: GameWorldJSON
  timestamp: number
  version: string
}
```

---

## ЭТАП 2: Реализация SPA Executor

### 2.1 Создать SPA Executor
**Файл:** `src/application/game/spa-executor.ts`

Реализовать `createSPAExecutor(): GameExecutor` который:
- Принимает `GameWorld` как параметр (обязательный для SPA)
- Вызывает методы из `appGameCommands`
- Оборачивает синхронные вызовы в `Promise.resolve()`
- Возвращает результаты в ожидаемом формате

Пример реализации:
```typescript
export function createSPAExecutor(): GameExecutor {
  return {
    executeAction: async (world?: GameWorld, actionId: string) => {
      if (!world) throw new Error('World is required for SPA executor')
      const ctx = getSystemContext(world)
      const result = ctx.action.execute(actionId)
      return Promise.resolve(result)
    },
    // ... остальные методы аналогично
  }
}
```

### 2.2 Создать SPA Query Executor
**Файл:** `src/application/game/spa-query-executor.ts`

Реализовать `createSPAQueryExecutor(): GameQueryExecutor` который:
- Принимает `GameWorld` как параметр
- Вызывает методы из `appGameQueries`
- Оборачивает синхронные вызовы в `Promise.resolve()`

```typescript
export function createSPAQueryExecutor(): GameQueryExecutor {
  return {
    getFinanceOverview: async (world?: GameWorld) => {
      if (!world) throw new Error('World is required for SPA query executor')
      return Promise.resolve(appGameQueries.getFinanceOverview(world))
    },
    getInvestments: async (world?: GameWorld) => {
      if (!world) throw new Error('World is required for SPA query executor')
      return Promise.resolve(appGameQueries.getInvestments(world))
    },
    // ... остальные методы аналогично
  }
}
```

### 2.3 Создать заглушку Server Executor
**Файл:** `src/application/game/server-executor.ts`

Реализовать `createServerExecutor(): GameExecutor` который:
- Сейчас выбрасывает ошибку "Server mode not implemented yet"
- Позже будет вызывать Nitro API через `$fetch`
- **Важно:** Не требует `world` параметра

### 2.4 Создать заглушку Server Query Executor
**Файл:** `src/application/game/server-query-executor.ts`

Аналогично 2.3 для query методов.

### 2.5 Создать фабрику исполнителей
**Файл:** `src/application/game/executor-factory.ts`

Функции:
- `createExecutor(mode: GameMode): GameExecutor`
- `createQueryExecutor(mode: GameMode): GameQueryExecutor`

Для 'spa' возвращаются SPA executors, для 'server' - server executors.

---

## ЭТАП 3: Рефакторинг Pinia Store

### 3.1 Обновить useGameStore для работы с executor
**Файл:** `src/stores/game.store.ts`

Изменения:
- Добавить поля:
  - `executor: Ref<GameExecutor>` (инициализируется через `createExecutor`)
  - `queryExecutor: Ref<GameQueryExecutor>` (инициализируется через `createQueryExecutor`)
  - `isOnline: Ref<boolean>` (отслеживание статуса сети)
  - `pendingSync: Ref<boolean>` (флаг ожидания синхронизации)
- Обновить методы команд с синхронных на асинхронные:
  - `executeAction(actionId: string): Promise<string>`
  - `applyWorkShift(hours: number): Promise<string>`
  - `startEducationProgram(programId: string): Promise<string>`
  - и т.д.
- Обновить методы чтения для работы с queryExecutor:
  - `getFinanceOverview(): Promise<...>`
  - `getInvestments(): Promise<...>`
- Добавить логику режимов:
  - **SPA режим:** вызывать executor напрямую с world, обновлять через `triggerRef(world)`
  - **Server режим:** вызывать executor (без world), парсить ответ и обновить state
  - **Hybrid режим:** пытаться использовать server executor при online, fallback на spa executor
- Добавить обработку offline:
  - При offline использовать только SPA executor
  - Сохранять failed actions в offline queue (этап 5)
- Обновить `initWorld()` для работы с обоими режимами
- Добавить event listeners для `online`/`offline` событий

### 3.2 Обновить composables для работы с асинхронными методами
**Файлы:**
- `src/composables/useActions/index.ts`
- `src/composables/useFinance/index.ts`
- `src/composables/useEvents/index.ts`

Изменения:
- Обновить методы на асинхронные
- Добавить `async/await` при вызове store методов
- Добавить loading states (isExecuting, isLoading)
- Добавить error handling с toast уведомлениями
- Сохранить текущую логику валидации и UI
- Добавить индикатор offline режима (если нужно)

---

## ЭТАП 4: Создание Nitro Server API

### 4.1 Создать утилиты для работы с сессиями
**Файл:** `server/utils/session.ts`

Создать функции:
- `generateSessionId(): string` - генерация уникального ID (crypto.randomUUID())
- `getSessionId(event: H3Event): string` - получение/создание ID сессии из cookie
- `getSessionStorage(): Storage` - абстракция над хранилищем (использовать Nitro storage)
- `saveWorldForSession(sessionId: string, world: GameWorld): Promise<void>`
- `loadWorldForSession(sessionId: string): Promise<GameWorld | null>`
- `deleteSession(sessionId: string): Promise<void>` - для cleanup
- `cleanupExpiredSessions(): Promise<void>` - удаление сессий старее 24ч

Использовать Nitro storage (`useStorage`) с TTL:
```typescript
const storage = useStorage('sessions')
// Сохранение с TTL
await storage.setItem(`session:${sessionId}`, world, { ttl: 86400 }) // 24 часа
```

### 4.2 Создать общий error handler
**Файл:** `server/utils/error-handler.ts`

Создать функции:
- `handleApiError(error: unknown): ApiResponse<never>`
- `createApiError(code: string, message: string, details?: Record<string, unknown>): ErrorResponse`
- `wrapApiResponse<T>(data: T): ApiResponse<T>`

Обрабатывать:
- Session not found (404)
- Validation errors (400)
- Internal errors (500)
- Сериализованный формат ошибок

### 4.3 Создать базовый API endpoint для состояния
**Файл:** `server/api/game/state.get.ts`

Endpoint `GET /api/game/state`:
- Получает sessionId из cookie
- Проверяет валидность сессии
- Загружает GameWorld из storage
- Возвращает `ApiResponse<GameStateResponse>` с:
  - `state: world.toJSON()`
  - `timestamp: Date.now()`
  - `version: '1.0'`

### 4.4 Создать API endpoint для инициализации
**Файл:** `server/api/game/init.post.ts`

Endpoint `POST /api/game/init`:
- Принимает опциональные `saveData` в теле запроса
- Создает/обновляет sessionId в cookie
- Создает GameWorld через `createWorldFromSave()`
- Сохраняет в session storage
- Возвращает `ApiResponse<GameStateResponse>` с начальным состоянием

### 4.5 Создать API endpoint для действий
**Файл:** `server/api/game/actions/execute.post.ts`

Endpoint `POST /api/game/actions/execute`:
- Получает sessionId, загружает world
- Вызывает `getSystemContext(world).action.execute(actionId)`
- Сохраняет обновленный world
- **Важно:** Возвращает `ApiResponse<ActionExecuteResponse>` с:
  - `result: ExecuteResult` - результат выполнения
  - `state: world.toJSON()` - обновленное состояние (избегает лишний запрос)
  - `timestamp: Date.now()`
- Обработка ошибок через error handler

### 4.6 Создать API endpoints для запросов
**Файлы:**
- `server/api/game/finance/overview.get.ts` - `getFinanceOverview()`
- `server/api/game/investments.get.ts` - `getInvestments()`
- `server/api/game/career/track.get.ts` - `getCareerTrack()`
- `server/api/game/events/next.get.ts` - `peekScheduledEvent()`
- `server/api/game/activity-log.get.ts` - `getActivityLog()`

Каждый endpoint:
- Получает sessionId, загружает world
- Вызывает соответствующий метод из `appGameQueries`
- Возвращает `ApiResponse<T>` с данными

### 4.7 Создать API endpoint для синхронизации offline queue
**Файл:** `server/api/game/sync.post.ts`

Endpoint `POST /api/game/sync`:
- Принимает массив действий из offline queue
- Применяет действия по очереди
- Возвращает финальное состояние
- Используется для синхронизации после восстановления соединения

---

## ЭТАП 5: Реализация Server Executor и Offline Support

### 5.1 Обновить Server Executor
**Файл:** `src/application/game/server-executor.ts`

Реализовать методы для вызова Nitro API:
```typescript
export function createServerExecutor(): GameExecutor {
  return {
    executeAction: async (_world?: GameWorld, actionId: string) => {
      // world параметр игнорируется - сервер сам загрузит из сессии
      const response = await $fetch<ApiResponse<ActionExecuteResponse>>(
        '/api/game/actions/execute',
        {
          method: 'POST',
          body: { actionId }
        }
      )

      if (!response.success) {
        throw new Error(response.error?.message || 'Unknown error')
      }

      return response.data!.result
    },
    // ... остальные методы аналогично
  }
}
```

**Важно:** Использовать типы из `server/api/types.ts` для типобезопасности.

### 5.2 Реализовать Server Query Executor
**Файл:** `src/application/game/server-query-executor.ts`

Реализовать методы для чтения данных с сервера:
```typescript
export function createServerQueryExecutor(): GameQueryExecutor {
  return {
    getFinanceOverview: async (_world?: GameWorld) => {
      const response = await $fetch<ApiResponse<FinanceOverview>>(
        '/api/game/finance/overview'
      )

      if (!response.success) {
        throw new Error(response.error?.message || 'Unknown error')
      }

      return response.data!
    },
    // ... остальные методы аналогично
  }
}
```

### 5.3 Создать утилиты синхронизации состояния
**Файл:** `src/application/game/state-sync.ts`

Функции:
- `loadWorldFromServer(): Promise<GameWorldJSON>` - загружает состояние с `/api/game/state`
- `syncWorldWithServer(): Promise<void>` - перезагружает состояние и применяет к store
- `mergeServerState(serverState: GameWorldJSON): void` - мержит серверное состояние с локальным
- `checkConflict(localState: GameWorldJSON, serverState: GameWorldJSON): ConflictInfo` - проверка конфликтов

### 5.4 Создать Unified Error Handler
**Файл:** `src/application/game/error-handler.ts`

Создать функции:
- `handleApiError(error: unknown): string` - парсит ошибку API и возвращает сообщение
- `isNetworkError(error: unknown): boolean` - проверяет, это ошибка сети
- `isValidationError(error: unknown): boolean` - проверяет, это ошибка валидации
- `showErrorToast(message: string): void` - показывает toast с ошибкой

### 5.5 Реализовать Offline Queue Manager
**Файл:** `src/application/game/offline-queue.ts`

Создать класс `OfflineQueueManager`:
```typescript
export class OfflineQueueManager {
  private queue: QueuedAction[] = []
  private isProcessing = false

  enqueue(action: QueuedAction): void {
    this.queue.push(action)
    this.persist()
  }

  async syncWithServer(): Promise<void> {
    if (!navigator.onLine || this.isProcessing) return

    this.isProcessing = true
    try {
      for (const action of this.queue) {
        await this.executeAction(action)
      }
      this.queue = []
      this.persist()
    } finally {
      this.isProcessing = false
    }
  }

  private async executeAction(action: QueuedAction): Promise<void> {
    // Отправка на сервер через /api/game/sync или по одному
  }

  private persist(): void {
    localStorage.setItem('offline-queue', JSON.stringify(this.queue))
  }

  private load(): void {
    const stored = localStorage.getItem('offline-queue')
    if (stored) {
      this.queue = JSON.parse(stored)
    }
  }
}
```

Типы:
```typescript
interface QueuedAction {
  id: string
  type: 'action' | 'work' | 'education' | 'finance'
  timestamp: number
  payload: Record<string, unknown>
}
```

### 5.6 Обновить useGameStore для Server Mode и Offline
**Файл:** `src/stores/game.store.ts`

Добавить логику:
- Создать `offlineQueueManager: OfflineQueueManager`
- Добавить слушатель `online` события для автоматической синхронизации
- Обновить методы:
  - **Server mode + online:** вызывать executor, парсить `response.data.state`, обновлять store
  - **Server mode + offline:** использовать SPA executor, добавлять в offline queue
  - **Hybrid mode:** пытаться server executor, при ошибке сети - SPA executor + offline queue
- После восстановления соединения: вызвать `offlineQueueManager.syncWithServer()`
- Обновить `initWorld()` для загрузки с `/api/game/init` или LocalStorage
- Обработать ошибки сети и показывать toast уведомления
- Добавить computed свойства:
  - `pendingSyncCount` - количество действий в очереди
  - `syncStatus` - статус синхронизации ('idle', 'syncing', 'error')

---

## ЭТАП 6: Тестирование и отладка

### 6.1 Создать переключатель режимов в UI
**Файл:** `src/components/dev/ModeSwitcher.vue`

Компонент для разработки:
- Radiobutton или toggle для выбора режима (SPA/Server)
- Сохраняет выбор в localStorage
- Перезагружает приложение при переключении

### 6.2 Тестирование SPA Mode
- Проверить все функции в SPA режиме
- Убедиться, что ничего не сломалось
- Протестировать сохранение/загрузку

### 6.3 Тестирование Server Mode
- Переключиться в server mode
- Проверить базовые операции (действия, работа, обучение)
- Проверить сохранение состояния между запросами
- Проверить обработку ошибок сети

### 6.4 Интеграционные тесты
Создать тесты в `tests/e2e/`:
- Тест API endpoints
- Тест переключения режимов
- Тест сохранения состояния

---

## ЭТАП 7: Документация и cleanup

### 7.1 Создать документацию
**Файл:** `doc/SERVER_MIGRATION.md`

Документация:
- Объяснение архитектуры
- Как переключать режимы
- Как добавлять новые API endpoints
- Как мигрировать на отдельный сервер

### 7.2 Обновить README
**Файл:** `doc/README.md`

Добавить секцию о режимах работы:
- SPA режим (по умолчанию)
- Server режим (через Nitro)
- Как переключать

### 7.3 Удалить временные файлы
- Удалить ModeSwitcher (если не нужен в проде)
- Очистить комментарии TODO
- Удалить отладочные console.log

---

## ЭТАП 8: Подготовка к миграции на отдельный сервер

### 8.1 Выделить Domain Layer в отдельный пакет
Создать монорепо или npm пакет:
- `packages/domain` - GameWorld, Systems, типы
- `packages/application` - Executors, commands, queries
- `packages/client-nuxt` - Nuxt интеграция
- `packages/server-express` (или NestJS/Fastify)

### 8.2 Создать прототип сервера на Express/NestJS
Реализовать те же API endpoints что и в Nitro:
- Использовать тот же Domain Layer
- Использовать базу данных вместо session storage
- Добавить аутентификацию

### 8.3 Обновить Server Executor для работы с новым сервером
Изменить базовые URL и формат запросов

### 8.4 Отключить Server Mode в Nuxt
Оставить только SPA режим после миграции

---

## Порядок реализации

### Минимальная MVP (2-3 недели)
1. Этап 1.1-1.3: Конфигурация, интерфейсы, типы API
2. Этап 2.1-2.5: SPA Executor + SPA Query Executor
3. Этап 3.1-3.2: Рефакторинг store и composables
4. Тестирование SPA режима

### Nitro Integration (3-4 недели)
5. Этап 4.1-4.7: Nitro API endpoints + error handling
6. Этап 5.1-5.6: Server Executor + Offline Queue
7. Этап 6.1-6.7: Тестирование всех режимов
8. Этап 7.1-7.4: Документация

### Я.Игры + Migration Prep (опционально, позже)
9. Этап 8.1-8.7: Подготовка к отдельному серверу и Яндекс.Игры

**Итого: 5-7 недель для полной реализации**

---

## Риски и митигация

### Риск 1: Синхронные методы в Domain Layer
**Проблема:** Domain Layer использует синхронные вызовы, но API должен быть асинхронным
**Решение:** Исполнители оборачивают синхронные вызовы в Promise. Это работает, т.к. вычисления быстрые.

### Риск 2: Состояние не синхронизируется
**Проблема:** Клиент и сервер могут иметь разное состояние
**Решение:** API возвращает обновленное состояние вместе с результатом, избегая лишний запрос.

### Риск 3: Производительность в Server Mode
**Проблема:** Много сетевых запросов
**Решение:** Offline queue для batching, optimistic updates, кеширование.

### Риск 4: Конфликты при offline sync
**Проблема:** Несовпадение локального и серверного состояния
**Решение:** Использовать timestamp-based conflict resolution, приоритет серверу, UI уведомление.

### Риск 5: Сложность миграции
**Проблема:** Слишком много изменений сразу
**Решение:** Постепенная миграция по этапам, возможность откатиться на любой этап.

### Риск 6: Размер GameWorld
**Проблема:** Сериализованный мир может быть большим для сети
**Решение:** Delta encoding, сжатие, отправка только изменившихся компонентов.

### Риск 7: Яндекс.Игры токен
**Проблема:** Токен может устареть или быть невалидным
**Решение:** Автоматическое обновление токена, fallback на offline mode, явная авторизация.

---

## Метрики успеха

- [ ] Все тесты в SPA режиме проходят
- [ ] Все тесты в Server режиме проходят
- [ ] Все тесты в Hybrid режиме проходят
- [ ] Offline queue работает корректно
- [ ] Автоматическая синхронизация работает
- [ ] Производительность в server mode приемлема (< 200ms на действие)
- [ ] Размер GameWorld < 100KB (после оптимизации)
- [ ] Документация полная и понятная
- [ ] Code review пройден
- [ ] Integration tests проходят