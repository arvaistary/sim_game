# Decision Guide: куда класть новый код

## Архитектурный контракт

В проекте принята **application-first / layered** архитектура:

```
pages/components -> composables -> application -> domain
                                       |
                                    ports
                                       |
                                 infrastructure
```

### Слои и их обязанности

| Слой | Обязанности | Что НЕ должен делать |
|------|-------------|----------------------|
| **domain** | Правила, формулы, справочники, константы, pure-функции | Знать о Nuxt, Pinia, persistence, browser API |
| **application** | Use-case команды и запросы, бизнес-логика | Импортировать stores, использовать Pinia |
| **stores** | Хранение состояния, slice-level мутации, сериализация | Содержать новую кросс-store бизнес-логику |
| **composables** | UI orchestration, coordination между UI и application | Напрямую мутировать domain, содержать правила |
| **infrastructure** | Адаптеры (persistence, external APIs) | Содержать продуктовые правила |

## Правило first choice

**Новая игровая логика всегда идет в `application` first.**

Если нужно добавить новый геймплейный сценарий:
1. Создай команду/запрос в `src/application/game/`
2. Назови файл по области: `actions.ts`, `career.ts`, `education.ts`, `events.ts`, `finance.ts`
3. Используй существующие domain-функции
4. Stores остаются для состояния и применения эффектов

## Чек-лист: куда класть код

### Нужно добавить новое действие (action)
- **Domain**: добавь определение в `src/domain/balance/actions/`
- **Application**: добавь валидацию в `commands.ts` или создай команду
- **Store**: только для применения эффектов
- **UI**: только для отображения результата

### Нужно добавить карьерную логику
- **Application**: создай команду `changeCareer`, `applyWorkShift`
- **Store**: только career store для состояния
- **UI**: только вызов use-case и отображение

### Нужно добавить финансовую логику
- **Application**: создай команду `invest`, `withdraw`, запросы `getFinanceOverview`
- **Store**: только finance/wallet store для состояния

### Нужно добавить образовательную логику
- **Application**: создай команду `startEducation`, `completeEducation`
- **Store**: только education store для состояния

### Нужно добавить событие (event)
- **Domain**: определение события в `src/domain/balance/constants/game-events.ts`
- **Application**: команда `resolveEventChoice`
- **Store**: events store для очереди и истории

### Нужно добавить UI-компонент
- **Components/Composables**: только presentation + orchestration
- **Никогда**: бизнес-правила напрямую в компоненте

### Нужно добавить persistence
- **Port**: определи интерфейс в `src/application/game/ports/`
- **Infrastructure**: реализуй адаптер в `src/infrastructure/`

## Критерии нарушения архитектуры

Код нарушает контракт, если:
- В `pages` или `components` есть business logic
- В `composables` есть валидация или правила
- В `stores` есть новая кросс-store логика
- В `application` есть Pinia или store-импорты
- В `domain` есть Nuxt/Pinia/browser API

## Пример: добавление новой механики

❌ **Неправильно** (смешивание слоев):
```ts
// В composable
function useWork() {
  const store = useGameStore()
  if (store.money < 100) return { error: 'Нет денег' }
  store.wallet.earn(100) // <- бизнес-логика в UI слое
}
```

✅ **Правильно** (application-first):
```ts
// В application/game/commands.ts
export function applyWorkShift(getSalary: () => number): WorkShiftResult {
  const salary = getSalary()
  return { success: true, salary }
}

// В composable (UI orchestration)
function useWork() {
  const gameStore = useGameStore()
  const apply = () => {
    const result = applyWorkShift(() => gameStore.currentJob?.salaryPerHour ?? 0)
    if (result.success) gameStore.wallet.earn(result.salary)
    return result
  }
  return { apply }
}
```