# План: Объединение страниц "Развлечения", "Хобби", "Здоровье", "Соц жизнь" в единую страницу "Действия"

## Objective

Объединить 4 отдельные страницы (`/game/fun`, `/game/hobby`, `/game/health`, `/game/social`) в одну страницу `/game/actions` с табами для переключения между категориями действий.

## Context from Analysis

### Текущее состояние

Все 4 страницы имеют **идентичную структуру**:
- Используют `GameLayout` с заголовком
- Используют `SectionHeader` с title/subtitle
- Используют `ActionCardList` для отображения действий
- Получают действия через `getActionsByCategory('category')`
- Отличаются только: заголовком, подзаголовком, категорией

### Навигация

В [`navigation.ts`](src/constants/navigation.ts:3) определены 4 отдельных пункта:
- `fun` → `/game/fun`
- `hobby` → `/game/hobby`
- `health` → `/game/health`
- `social` → `/game/social`

### Возрастные ограничения

В [`age-constants.ts`](src/composables/useAgeRestrictions/age-constants.ts:18) `hiddenTabs` содержит отдельные записи для `social` (разблокируется в 4 года). Остальные (`fun`, `hobby`, `health`) не имеют ограничений — видны всегда.

## Affected Files

| Файл | Изменение |
|------|-----------|
| `src/constants/navigation.ts` | Заменить 4 пункта на 1 "Действия" |
| `src/composables/useAgeRestrictions/age-constants.ts` | Заменить `social` в hiddenTabs на `actions` |
| `src/pages/game/fun/index.vue` | Удалить |
| `src/pages/game/hobby/index.vue` | Удалить |
| `src/pages/game/health/index.vue` | Удалить |
| `src/pages/game/social/index.vue` | Удалить |
| `src/pages/game/actions/index.vue` | **Создать** — единая страница с табами |
| `src/components/game/ActionTabs/ActionTabs.vue` | **Создать** — компонент табов |

## Execution Plan

### Шаг 1: Создать конфигурацию категорий действий

**Файл:** `src/config/action-categories.ts` (новый)

```ts
export interface ActionCategory {
  id: string
  label: string
  subtitle: string
  icon: string
}

export const ACTION_CATEGORIES: ActionCategory[] = [
  { id: 'fun', label: 'Развлечения', subtitle: 'Отдых, веселье и приятные занятия', icon: '🎭' },
  { id: 'hobby', label: 'Хобби', subtitle: 'Творческие занятия для души и развития навыков', icon: '🎨' },
  { id: 'health', label: 'Здоровье', subtitle: 'Забота о физическом и ментальном здоровье', icon: '❤️' },
  { id: 'social', label: 'Соц. жизнь', subtitle: 'Встречи, контакты и социальные связи', icon: '👥' },
]
```

### Шаг 2: Обновить навигацию

**Файл:** [`src/constants/navigation.ts`](src/constants/navigation.ts:3)

Заменить:
```ts
{ id: 'fun', icon: 'Р', label: 'Развлеч.' },
{ id: 'social', icon: 'С', label: 'Соц. жизнь' },
{ id: 'hobby', icon: 'Х', label: 'Хобби' },
{ id: 'health', icon: 'З', label: 'Здоровье' },
```

На:
```ts
{ id: 'actions', icon: 'Д', label: 'Действия' },
```

Обновить `ROUTE_MAP`:
```ts
actions: '/game/actions',
```

### Шаг 3: Обновить возрастные ограничения

**Файл:** [`src/composables/useAgeRestrictions/age-constants.ts`](src/composables/useAgeRestrictions/age-constants.ts:18)

Заменить `social` на `actions` в `hiddenTabs` для INFANT и TODDLER:
```ts
// Было: hiddenTabs: ['finance', 'career', 'home', 'car', 'social', 'shop', 'education'],
// Стало: hiddenTabs: ['finance', 'career', 'home', 'car', 'actions', 'shop', 'education'],
```

Обновить `TAB_UNLOCK_AGE`:
```ts
// Было: social: 4,
// Стало: actions: 4,
```

Обновить `UNLOCK_MESSAGES`:
```ts
// Было: social: '❤️ Теперь вам доступны Отношения! ...'
// Стало: actions: '🎭 Теперь вам доступны Действия! Вы можете развлекаться, заниматься хобби, заботиться о здоровье и общаться.'
```

### Шаг 4: Создать компонент табов

**Файл:** `src/components/game/ActionTabs/ActionTabs.vue` (новый)

Компонент принимает:
- `categories: ActionCategory[]` — список категорий
- `activeCategory: string` — текущая активная категория
- `@update:activeCategory` — событие при переключении

Визуально: горизонтальные табы с иконками и названиями категорий.

### Шаг 5: Создать единую страницу действий

**Файл:** `src/pages/game/actions/index.vue` (новый)

```vue
<template>
  <GameLayout title="Действия">
    <ActionTabs
      v-model:active-category="activeCategory"
      :categories="visibleCategories"
    />
    <SectionHeader
      :title="currentCategory.label"
      :subtitle="currentCategory.subtitle"
    />
    <ActionCardList
      :actions="sortedActions"
      :empty-text="actionsEmptyHint"
      :is-disabled="(a: any) => !canExecute(a.id)"
      :get-disabled-reason="getDisabledReason"
      @execute="executeAction"
    />
  </GameLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { definePageMeta } from '#imports'
import { useActions } from '@/composables/useActions'
import { useGameStore } from '@/stores/game.store'
import { ACTION_CATEGORIES } from '@/config/action-categories'

definePageMeta({ middleware: 'game-init' })

const store = useGameStore()
const { getActionsByCategory, canExecute, executeAction, actionsEmptyHint } = useActions()

const activeCategory = ref('fun')

const currentCategory = computed(() =>
  ACTION_CATEGORIES.find(c => c.id === activeCategory.value) ?? ACTION_CATEGORIES[0]
)

const actions = computed(() => getActionsByCategory(activeCategory.value))

function getDisabledReason(action: any): string {
  const result = store.canExecuteAction(action.id)
  return result.reason ?? 'Действие недоступно'
}

const sortedActions = computed(() => {
  void store.worldTick
  return [...actions.value].sort((a, b) => (canExecute(a.id) ? 0 : 1) - (canExecute(b.id) ? 0 : 1))
})

// Фильтрация категорий по возрасту (social недоступен до 4 лет)
const visibleCategories = computed(() => {
  const { isTabVisible } = useAgeRestrictions()
  return ACTION_CATEGORIES.filter(c => c.id === 'fun' || c.id === 'hobby' || c.id === 'health' || isTabVisible('actions'))
})
</script>
```

### Шаг 6: Удалить старые страницы

Удалить директории:
- `src/pages/game/fun/`
- `src/pages/game/hobby/`
- `src/pages/game/health/`
- `src/pages/game/social/`

### Шаг 7: Проверка и тесты

- Проверить что навигация корректно показывает "Действия" вместо 4 отдельных вкладок
- Проверить что табы переключаются и показывают правильные действия
- Проверить возрастную блокировку (до 4 лет страница "Действия" скрыта)
- Запустить существующие тесты для проверки совместимости

## Guardrails

- **Не менять** логику действий (actions catalog, executeAction, canExecute)
- **Не менять** GameLayout, SectionHeader, ActionCardList — они переиспользуются
- Сохранить обратную совместимость: если есть ссылки на старые роуты, добавить редиректы

## Non-goals

- Не менять визуальный стиль карточек действий
- Не менять систему возрастных ограничений (только обновить ключи)
- Не добавлять новые категории действий (только объединить существующие)

## Validation Plan

1. Визуальная проверка: страница `/game/actions` открывается, табы переключаются
2. Функциональная проверка: действия выполняются, статистика обновляется
3. Возрастная проверка: до 4 лет страница скрыта, после 4 — появляется с уведомлением
4. Навигация: клик по "Действия" в навбаре ведёт на `/game/actions`
5. Запуск тестов: `npm test`
