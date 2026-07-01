# Event System Migration Guide

## Обзор

Этот документ описывает процесс миграции сохранений для Event System v2. Миграция автоматически преобразует legacy формат событий в новый canonical формат с `instanceId`.

## Версии схемы

| Версия | Описание |
|--------|----------|
| 1 | Legacy формат (без instanceId) |
| 2 | Canonical формат (с instanceId и period dedup) |

## Изменения в формате

### Legacy формат (v1)

#### EventQueueItem
```typescript
{
  id: string
  type: string
  title: string
  description: string
  choices?: EventChoice[]
  data?: Record<string, unknown>
  day: number
}
```

#### EventHistoryEntry
```typescript
{
  eventId: string
  day: number
  choiceId?: string
  effects?: Record<string, number>
}
```

### Canonical формат (v2)

#### EventQueueItem
```typescript
{
  id: string
  instanceId: string  // НОВОЕ
  type: string
  title: string
  description: string
  choices?: EventChoice[]
  data?: Record<string, unknown>
  day: number
  week?: number  // НОВОЕ
  month?: number  // НОВОЕ
  year?: number  // НОВОЕ
  _priority?: string  // НОВОЕ
  _source?: string  // НОВОЕ
}
```

#### EventHistoryEntry
```typescript
{
  instanceId: string  // НОВОЕ (primary key)
  templateId: string  // НОВОЕ (бывший eventId)
  day: number
  week?: number  // НОВОЕ
  month?: number  // НОВОЕ
  year?: number  // НОВОЕ
  choiceId?: string
  choiceText?: string  // НОВОЕ
  effects?: Record<string, number>
  resolvedAt?: number  // НОВОЕ
}
```

## Автоматическая миграция

Миграция выполняется автоматически при загрузке сохранения через [`PersistenceSystem`](../src/domain/engine/systems/PersistenceSystem/index.ts):

1. Система проверяет версию сохранения
2. Если версия < 1.2.0, применяется миграция событий
3. Legacy события преобразуются в canonical формат
4. `eventSchemaVersion` обновляется до 2
5. Инициализируются новые структуры: `seenInstanceIds`, `processedWeeklyEvents`, `processedMonthlyEvents`, `processedYearlyEvents`

## Генерация instanceId

Для legacy событий `instanceId` генерируется по формуле:

```
instanceId = {eventId}_{totalHours}_{timestamp}
```

Пример:
```
instanceId = "weekly_salary_100_1713456789000"
```

Для новых событий используется детерминированный генератор:

```
instanceId = {templateId}_{totalHours}_{sequence}
```

Пример:
```
instanceId = "weekly_salary_100_1"
```

## Проверка миграции

### В консоли браузера

```javascript
// Проверить версию схемы событий
const save = JSON.parse(localStorage.getItem('game-life-save'))
console.log('Event schema version:', save.eventSchemaVersion)

// Проверить формат событий
console.log('Pending events:', save.event_queue?.pendingEvents)
console.log('Event history:', save.event_history?.events)
```

### Через diagnostics

```javascript
import { getSystemContext } from '@/domain/game-facade'

const context = getSystemContext(world)
const diagnostics = context.eventQueue.getDiagnostics()
console.log('Event metrics:', diagnostics.getMetrics())
```

## Ручная миграция

Если автоматическая миграция не сработала, можно выполнить её вручную:

```javascript
import { EventMigration } from '@/infrastructure/persistence/event-migration'

const migration = new EventMigration()
const save = JSON.parse(localStorage.getItem('game-life-save'))

// Проверяем, нужна ли миграция
if (migration.needsMigration(save)) {
  const result = migration.migrateSave(save)
  
  if (result.success) {
    console.log(`Migration successful: ${result.migratedEvents} events migrated`)
    // Сохраняем мигрированные данные
    localStorage.setItem('game-life-save', JSON.stringify(save))
  } else {
    console.error('Migration failed:', result.errors)
  }
}
```

## Валидация после миграции

### Проверка EventQueueItem

```javascript
import { EventMigration } from '@/infrastructure/persistence/event-migration'

const migration = new EventMigration()
const save = JSON.parse(localStorage.getItem('game-life-save'))

const eventQueue = save.event_queue?.pendingEvents || []
eventQueue.forEach(item => {
  if (!migration.validateQueueItem(item)) {
    console.error('Invalid event queue item:', item)
  }
})
```

### Проверка EventHistoryEntry

```javascript
const eventHistory = save.event_history?.events || []
eventHistory.forEach(entry => {
  if (!migration.validateHistoryEntry(entry)) {
    console.error('Invalid event history entry:', entry)
  }
})
```

## Восстановление после неудачной миграции

Если миграция не удалась:

1. **Создайте бэкап**:
   ```javascript
   const save = localStorage.getItem('game-life-save')
   localStorage.setItem('game-life-save-backup', save)
   ```

2. **Отключите event system v2**:
   ```javascript
   import { setEventFeatureFlags } from '@/config/event-feature-flags'
   
   setEventFeatureFlags({
     ingressV2: false,
     dedupV2: false,
     payloadV2: false,
   })
   ```

3. **Перезагрузите страницу**

4. **Сообщите о проблеме** с логами консоли

## Тестирование миграции

Запустите тесты миграции:

```bash
npm test -- event-migration
```

Или конкретный тест:

```bash
npm test -- event-migration.test.ts
```

## Известные проблемы

### Проблема: Дубликаты после миграции

**Симптом**: После миграции появляются дубликаты событий.

**Решение**:
1. Проверьте, что `seenInstanceIds` инициализирован
2. Очистите очередь и историю:
   ```javascript
   localStorage.removeItem('game-life-save')
   location.reload()
   ```

### Проблема: Потеря данных при миграции

**Симптом**: События теряются после миграции.

**Решение**:
1. Восстановите из бэкапа:
   ```javascript
   const backup = localStorage.getItem('game-life-save-backup')
   if (backup) {
     localStorage.setItem('game-life-save', backup)
     location.reload()
   }
   ```
2. Сообщите о проблеме с логами

## Дополнительные ресурсы

- [Event Migration Implementation](../src/infrastructure/persistence/event-migration.ts)
- [Persistence System](../src/domain/engine/systems/PersistenceSystem/index.ts)
- [Rollback Playbook](./ROLLBACK_PLAYBOOK_EVENT_SYSTEM.md)
- [Event System Plan](../plans/event-system-sync.plan.md)
