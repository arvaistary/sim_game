# Rollback Playbook: Event System v2

## Обзор

Этот документ описывает процедуры отката (rollback) для Event System v2 в случае проблем после внедрения.

## Feature Flags

Все новые функции Event System v2 управляются через feature flags в [`src/config/event-feature-flags.ts`](../src/config/event-feature-flags.ts):

| Flag | Описание | Значение по умолчанию |
|------|----------|----------------------|
| `ingressV2` | Новый EventIngress API | `true` |
| `dedupV2` | Улучшенный dedup с period guards | `true` |
| `payloadV2` | Новый формат payload с instanceId | `true` |
| `diagnosticsEnabled` | Diagnostics и метрики | `true` |
| `boundedDedupIndex` | Bounded индекс для O(1) dedup | `true` |
| `periodDedupGuards` | Period dedup guards | `true` |

## Быстрый откат (Emergency Rollback)

### Шаг 1: Отключить все v2 функции

Откройте консоль браузера и выполните:

```javascript
// Загрузите модуль feature flags
import { setEventFeatureFlags } from '@/config/event-feature-flags'

// Отключите все v2 функции
setEventFeatureFlags({
  ingressV2: false,
  dedupV2: false,
  payloadV2: false,
  diagnosticsEnabled: false,
  boundedDedupIndex: false,
  periodDedupGuards: false,
})

// Перезагрузите страницу
location.reload()
```

### Шаг 2: Проверьте состояние

После перезагрузки убедитесь, что:
- События продолжают добавляться в очередь
- Дедупликация работает (legacy режим)
- Нет ошибок в консоли

## Пошаговый откат (Gradual Rollback)

Если полный откат не требуется, можно отключать функции по одной:

### Откат 1: Отключить diagnostics

Если диагностика вызывает проблемы с производительностью:

```javascript
import { setEventFeatureFlags } from '@/config/event-feature-flags'

setEventFeatureFlags({ diagnosticsEnabled: false })
```

### Откат 2: Отключить period dedup guards

Если period dedup вызывает проблемы:

```javascript
import { setEventFeatureFlags } from '@/config/event-feature-flags'

setEventFeatureFlags({ periodDedupGuards: false })
```

### Откат 3: Отключить bounded dedup index

Если bounded индекс вызывает проблемы:

```javascript
import { setEventFeatureFlags } from '@/config/event-feature-flags'

setEventFeatureFlags({ boundedDedupIndex: false })
```

### Откат 4: Отключить новый payload формат

Если новый формат вызывает проблемы с совместимостью:

```javascript
import { setEventFeatureFlags } from '@/config/event-feature-flags'

setEventFeatureFlags({ payloadV2: false })
```

### Откат 5: Отключить новый dedup

Если новый dedup вызывает проблемы:

```javascript
import { setEventFeatureFlags } from '@/config/event-feature-flags'

setEventFeatureFlags({ dedupV2: false })
```

### Откат 6: Отключить новый ingress API

Если новый ingress API вызывает проблемы:

```javascript
import { setEventFeatureFlags } from '@/config/event-feature-flags'

setEventFeatureFlags({ ingressV2: false })
```

## Диагностика проблем

### Проблема: События не добавляются в очередь

**Возможные причины:**
1. `ingressV2` включён, но вызывает ошибки
2. Period dedup блокирует все события

**Решение:**
```javascript
import { setEventFeatureFlags } from '@/config/event-feature-flags'

// Сначала попробуйте отключить period dedup
setEventFeatureFlags({ periodDedupGuards: false })

// Если не помогло, отключите ingressV2
setEventFeatureFlags({ ingressV2: false })
```

### Проблема: Дубликаты событий

**Возможные причины:**
1. `dedupV2` отключён
2. Bounded индекс не работает

**Решение:**
```javascript
import { setEventFeatureFlags } from '@/config/event-feature-flags'

// Включите все dedup функции
setEventFeatureFlags({
  dedupV2: true,
  boundedDedupIndex: true,
  periodDedupGuards: true,
})
```

### Проблема: Проблемы с производительностью

**Возможные причины:**
1. Diagnostics включён и записывает слишком много данных
2. Bounded индекс не очищается

**Решение:**
```javascript
import { setEventFeatureFlags } from '@/config/event-feature-flags'

// Отключите diagnostics
setEventFeatureFlags({ diagnosticsEnabled: false })
```

### Проблема: Ошибки при загрузке сохранений

**Возможные причины:**
1. Новый формат payload несовместим со старыми сохранениями
2. Migration не сработала

**Решение:**
```javascript
import { setEventFeatureFlags } from '@/config/event-feature-flags'

// Отключите новый payload формат
setEventFeatureFlags({ payloadV2: false })
```

## Проверка состояния

### Проверить текущие feature flags

```javascript
import { getEventFeatureFlags } from '@/config/event-feature-flags'

console.log('Current event feature flags:', getEventFeatureFlags())
```

### Проверить diagnostics

```javascript
import { getSystemContext } from '@/domain/game-facade'

const context = getSystemContext(world)
const diagnostics = context.eventQueue.getDiagnostics()
console.log('Event diagnostics:', diagnostics.getMetrics())
console.log('Performance budgets:', diagnostics.checkPerformanceBudgets())
```

### Проверить состояние очереди

```javascript
import { getSystemContext } from '@/domain/game-facade'

const context = getSystemContext(world)
const queue = context.eventQueue.getEventQueue()
console.log('Queue size:', queue.count)
console.log('Pending events:', queue.pendingEvents)
```

## Восстановление после отката

После устранения проблемы можно постепенно включать функции обратно:

```javascript
import { setEventFeatureFlags } from '@/config/event-feature-flags'

// Включите по одной функции и проверяйте работу
setEventFeatureFlags({ ingressV2: true })
// Проверьте работу...

setEventFeatureFlags({ dedupV2: true })
// Проверьте работу...

setEventFeatureFlags({ payloadV2: true })
// Проверьте работу...

// И так далее...
```

## Контакты

При возникновении проблем:
1. Проверьте консоль браузера на наличие ошибок
2. Соберите diagnostics: `context.eventQueue.getDiagnostics().createSnapshot()`
3. Сохраните состояние feature flags: `getEventFeatureFlags()`
4. Свяжитесь с командой разработки

## Дополнительные ресурсы

- [Event System Plan](../plans/event-system-sync.plan.md)
- [Event Architecture](../doc/engine/ECS_ARCHITECTURE.md)
- [Feature Flags Documentation](../src/config/event-feature-flags.ts)
