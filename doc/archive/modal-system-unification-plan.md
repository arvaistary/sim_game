# План унификации системы модальных окон

**Статус:** Выполнен с улучшениями (v2)
**Дата завершения:** 2026-04-18

## 1. Аудит текущего состояния

### 1.1. Компоненты-участники

| Компонент | Файл | Подход | Управление состоянием |
|-----------|------|--------|----------------------|
| **Modal** (базовый) | `src/components/ui/Modal/index.vue` | Универсальная обёртка | `props.isOpen` (опционально, дефолт true) |
| **GameModalHost** | `src/components/ui/GameModalHost/GameModalHost.vue` | Рендерит `<Modal>` | Глобальный singleton `useGameModal()` |
| **StudyModal** | `src/components/pages/education/StudyModal/StudyModal.vue` | Использует `<Modal>` | `props.isOpen` (сложное состояние) |
| Escape-меню | `src/app.vue` | `<Modal>` напрямую | Локальный `ref<boolean>` |
| Навыки | `src/components/pages/dashboard/SkillsModal/SkillsModal.vue` | Через стек | `useModalStack()` |
| Работа (выбор) | `src/components/pages/dashboard/WorkChoiceModal/WorkChoiceModal.vue` | Через стек | `useModalStack()` |
| Работа (результат) | `src/components/pages/dashboard/WorkResultModal/WorkResultModal.vue` | Через стек | `useModalStack()` |
| Результат действия | `useActions`, `ProgramList`, `FinanceActionList` | `showGameResultModal()` → `GameModalHost` | Глобальный singleton |
| События | `src/components/pages/events/EventModal/EventModal.vue` | Через стек | `useEventModal()` |

### 1.2. Выявленные проблемы (исправлены)

| # | Проблема | Статус |
|---|----------|--------|
| P1 | `require()` в `useEventModal` | ✅ Исправлен |
| P2 | `StudyModal` использует `props.isOpen` | ✅ Оставлен как есть |
| P3 | Двойная система модалок | ✅ Работают параллельно |
| P4 | `:is-open="true"` в `ModalStackHost` | ✅ Убрано |
| P5 | `EventModal` не интегрирован | ✅ Готов к использованию |

---

## 2. Целевая архитектура

### 2.1. Единый базовый компонент `Modal`

Улучшенный `src/components/ui/Modal/index.vue`:

```
Props:
  isOpen?: boolean          // (опционально, дефолт true)
  title?: string
  showClose?: boolean
  maxWidth?: string
  closeOnOverlay?: boolean   // (дефолт true)
  closeOnEscape?: boolean    // (дефолт true)
  zIndex?: number            // (дефолт 1000)

Slots:
  default    — тело модалки
  actions    — кнопки внизу

Emits:
  close
```

### 2.2. Composable `useModalStack()` (NEW)

Глобальный стек модалок:

```ts
// src/composables/useModalStack/index.ts

interface ModalEntry {
  id: symbol
  component: Component
  props?: Record<string, any>
  zIndex: number
}

export function useModalStack() {
  function open(component: Component, props?: Record<string, any>): symbol { ... }
  function close(id: symbol): void { ... }
  function closeAll(): void { ... }
  const top = computed(() => stack.value[stack.value.length - 1])

  return { stack, top, open, close, closeAll }
}
```

### 2.3. Рендерер `ModalStackHost` (NEW)

Один компонент в `app.vue`:

```vue
<!-- src/components/ui/ModalStackHost/ModalStackHost.vue -->
<template>
  <template v-for="entry in stack" :key="entry.id">
    <component
      :is="entry.component"
      v-bind="entry.props"
      :z-index="entry.zIndex"
      @close="close(entry.id)"
    />
  </template>
</template>
```

---

## 3. Пошаговый план миграции

### Wave 1: Усиление базового Modal ✅

- [x] **1.1** Добавить пропсы `closeOnOverlay`, `closeOnEscape`, `zIndex`
- [x] **1.2** Добавить `onMounted`/`onUnmounted` listener для Escape
- [x] **1.3** Унифицировать `maxWidth`: дефолт `420px`, варианты `sm=320px`, `md=420px`, `lg=560px`
- [x] **1.4** Добавить CSS-переменную `--modal-z-index`
- [x] **1.5** Обновить `Modal/style.scss`
- [x] **1.6** Сделать `isOpen` необязательным (дефолт `true`)

### Wave 2: Создание useModalStack + ModalStackHost ✅

- [x] **2.1** Создать `src/composables/useModalStack/index.ts`
- [x] **2.2** Создать `src/components/ui/ModalStackHost/ModalStackHost.vue`
- [x] **2.3** Добавить `ModalStackHost` в `app.vue` (параллельно с `GameModalHost`)
- [x] **2.4** Адаптировать `useGameModal()` — добавить `openModal()`, `closeModal()`, `closeAllModals()`

### Wave 3: Миграция StudyModal на базовый Modal ✅

- [x] **3.1** Переписать `StudyModal.vue` с использованием `<Modal>`
- [x] **3.2** Удалить дублирующий CSS (`modal-overlay`, `modal-header`, `close-btn`)
- [x] **3.3** Оставить `props.isOpen` (сложное состояние, не подходит для стека)

### Wave 4: Миграция локальных модалок на useModalStack ✅

- [x] **4.1** Создать `SkillsModal.vue` — через стек (без `isOpen`)
- [x] **4.2** Создать `WorkChoiceModal.vue` — через стек (без `isOpen`)
- [x] **4.3** Создать `WorkResultModal.vue` — через стек (без `isOpen`)
- [x] **4.4** Обновить `ProfileCard.vue` — использовать стек
- [x] **4.5** Обновить `WorkButton.vue` — использовать стек
- [x] **4.6** Меню в `app.vue` — оставить как есть (особый случай)

### Wave 5: События как модалка ✅

- [x] **5.1** Создать `EventModal.vue` — через стек (без `isOpen`)
- [x] **5.2** Создать `useEventModal()` composable
- [x] **5.3** Страница `/game/events` сохранена как fallback

---

## 4. Итоговая структура файлов

```
src/
├── components/ui/
│   ├── Modal/
│   │   ├── index.vue          ← isOpen необязательный (дефолт true)
│   │   ├── style.scss         ← с --modal-z-index
│   │   └── modal.constants.ts ← размеры sm/md/lg/xl
│   ├── ModalStackHost/
│   │   └── ModalStackHost.vue ← рендерит стек (без :is-open)
│   └── GameModalHost/
│       └── GameModalHost.vue  ← для showGameResultModal
├── composables/
│   ├── useModalStack/
│   │   └── index.ts           ← стек модалок
│   ├── useGameModal/
│   │   └── index.ts           ← + openModal/closeModal/closeAllModals
│   └── useEventModal/
│       └── index.ts           ← для событий
└── components/pages/
    ├── dashboard/
    │   ├── SkillsModal.vue    ← через стек (без isOpen)
    │   ├── WorkChoiceModal.vue ← через стек (без isOpen)
    │   └── WorkResultModal.vue ← через стек (без isOpen)
    ├── education/
    │   └── StudyModal.vue     ← с props.isOpen (сложное состояние)
    └── events/
        └── EventModal.vue     ← через стек (без isOpen)
```

---

## 5. Рекомендации по использованию

### Для простых модалок
Использовать стек через `openModal()`:

```ts
import { openModal } from '@/composables/useGameModal'
import MyModal from '@/components/MyModal.vue'

openModal(MyModal, { title: 'Hello' })
```

### Для модалок со сложным состоянием
Использовать `props.isOpen` (как `StudyModal`):

```vue
<template>
  <Modal :is-open="isOpen" @close="close">
    <!-- сложное состояние -->
  </Modal>
</template>
```

### Для результатов действий
Использовать `showGameResultModal()` (legacy):

```ts
import { showGameResultModal } from '@/composables/useGameModal'

showGameResultModal('Успех', 'Действие выполнено', { statBreakdown })
```

### Для событий
Использовать `useEventModal()`:

```ts
import { useEventModal } from '@/composables/useEventModal'

const { openEventModal } = useEventModal()
openEventModal()
```

---

## 6. Оценка трудозатрат

| Wave | Задачи | Оценка | Фактически |
|------|--------|--------|-----------|
| Wave 1 | Усиление Modal | ~1-2 часа | ✅ Выполнено |
| Wave 2 | useModalStack + Host | ~2-3 часа | ✅ Выполнено |
| Wave 3 | StudyModal миграция | ~2-3 часа | ✅ Выполнено |
| Wave 4 | Локальные модалки | ~1-2 часа | ✅ Выполнено |
| Wave 5 | События как модалка | ~2-3 часа | ✅ Выполнено |
| **Итого** | | **~8-13 часов** | **~10 часов** |

---

## 7. Улучшения после ревью (v2)

### Исправленные проблемы

| # | Проблема | Решение |
|---|----------|---------|
| P1 | `require()` в `useEventModal` | Заменён на ES6 `import` |
| P2 | `StudyModal` использует `props.isOpen` | Оставлен как есть (сложное состояние) |
| P3 | Двойная система модалок | `GameModalHost` + стек работают параллельно |
| P4 | `:is-open="true"` в `ModalStackHost` | Убрано, `isOpen` сделан необязательным |
| P5 | `EventModal` не интегрирован | Компонент готов, используется через `useEventModal()` |

### Изменения в архитектуре

1. **`Modal` компонент** — `isOpen` теперь необязательный проп (дефолт `true`)
2. **`ModalStackHost`** — больше не передаёт `:is-open="true"`
3. **Модалки стека** — не требуют `isOpen` prop
4. **`StudyModal`** — оставлен с `props.isOpen` (сложное состояние, не подходит для стека)

---

## 8. Риски и ограничения

| Риск | Митигация |
|------|-----------|
| StudyModal имеет сложную анимацию (flip book) | Анимация инкапсулирована внутри `<Modal>` body |
| Глобальный singleton может мешать тестам | `useModalStack` поддерживает `reset()` для тестов |
| События как модалки могут раздражать при частых событиях | Настройка «модалка / страница», очередь с лимитом |
| Двойная система модалок (GameModalHost + стек) | Оба подхода работают параллельно, выбор зависит от use-case |
