# Руководство по системе модальных окон

## Обзор

Система модальных окон в проекте унифицирована и использует стековый подход для управления модальными окнами. Все модальные окна используют единую функцию `openModal()` для открытия и проп `onClose` для закрытия.

## Архитектура

### Основные компоненты

1. **`Modal`** (`src/components/ui/Modal/index.vue`) - базовый компонент модального окна
2. **`ModalStackHost`** (`src/components/ui/ModalStackHost/ModalStackHost.vue`) - рендерер стека модальных окон
3. **`useModalStack`** (`src/composables/useModalStack/index.ts`) - композабл для управления стеком
4. **`useGameModal`** (`src/composables/useGameModal/index.ts`) - основной композабл для работы с модалками

### Типы

```ts
// src/composables/useGameModal/modal.types.ts

interface BaseModalProps {
  onClose?: () => void
}

interface OpenModalOptions {
  props?: Record<string, any>
  onClose?: () => void
}
```

## Использование

### Открытие модального окна

#### Простой способ

```ts
import { openModal } from '@/composables/useGameModal'
import MyModal from '@/components/MyModal.vue'

openModal(MyModal, {
  title: 'Привет',
  message: 'Это модальное окно'
})
```

#### С callback закрытия

```ts
openModal(MyModal, {
  title: 'Привет',
  onClose: () => {
    console.log('Модальное окно закрыто')
  }
})
```

#### С отдельными props и onClose

```ts
openModal(MyModal, {
  props: {
    title: 'Привет',
    message: 'Это модальное окно'
  },
  onClose: () => {
    console.log('Модальное окно закрыто')
  }
})
```

### Создание компонента модального окна

Все модальные окна должны:

1. Наследовать от `BaseModalProps`
2. Использовать компонент `Modal` как обёртку
3. Вызывать `props.onClose()` при закрытии

#### Пример компонента

```vue
<template>
  <Modal
    title="Моё модальное окно"
    @close="handleClose"
  >
    <p>Содержимое модального окна</p>
  </Modal>
</template>

<script setup lang="ts">
import type { BaseModalProps } from '@/composables/useGameModal/modal.types'

interface Props extends BaseModalProps {
  title?: string
  message?: string
}

const props = defineProps<Props>()

function handleClose() {
  props.onClose?.()
}
</script>
```

### Закрытие модального окна

Модальное окно закрывается автоматически при:
- Клике на кнопку закрытия (x)
- Клике на оверлей (если `closeOnOverlay: true`)
- Нажатии Escape (если `closeOnEscape: true`)
- Программном вызове `props.onClose()`

### Ручное закрытие по ID

```ts
import { closeModal } from '@/composables/useGameModal'

const modalId = openModal(MyModal, { title: 'Hello' })
// ...
closeModal(modalId)
```

### Закрытие всех модальных окон

```ts
import { closeAllModals } from '@/composables/useGameModal'

closeAllModals()
```

## Специализированные композаблы

### useEventModal

Для открытия модального окна с событиями:

```ts
import { useEventModal } from '@/composables/useEventModal'

const { openEventModal, closeEventModal } = useEventModal()
openEventModal()
```

### useGameModal (legacy)

Для старого state-based подхода (используется для результатов действий):

```ts
import { useGameModal } from '@/composables/useGameModal'

const { show, close } = useGameModal()

show({
  title: 'Заголовок',
  lines: ['Строка 1', 'Строка 2'],
  buttons: [
    { label: 'OK', accent: true }
  ]
})
```

## Примеры из проекта

### WorkChoiceModal

```ts
// src/components/pages/dashboard/WorkButton.vue

workChoiceModalId = openModal(WorkChoiceModal, {
  workOptions: workOptions.value,
  isWorkInProgress: isWorkInProgress.value,
  canStartOneDayShift: canStartOneDayShift.value,
  canStartFullShift: canStartFullShift.value,
  onClose: () => {
    workChoiceModalId = null
  },
  onRunShift: (hours: number) => {
    runShift(hours)
  },
})
```

### SkillsModal

```ts
// src/components/pages/dashboard/ProfileCard/ProfileCard.vue

function openSkillsModal() {
  openModal(SkillsModal, {
    onClose: () => {
      // Modal will be closed by the stack
    },
  })
}
```

## Поток закрытия модального окна

1. Пользователь кликает на кнопку закрытия или оверлей
2. Компонент `Modal` эмитит событие `close`
3. Родительский компонент (например, `WorkResultModal`) вызывает `props.onClose()`
4. `ModalStackHost` перехватывает событие `close`
5. `ModalStackHost` вызывает `onClose` из пропсов (если есть)
6. `ModalStackHost` удаляет модалку из стека через `close(id)`

## Troubleshooting

### Модальное окно не закрывается

Убедитесь, что:
1. Компонент модального окна наследует от `BaseModalProps`
2. Компонент вызывает `props.onClose()` в методе `handleClose`
3. Компонент `Modal` имеет `@close="handleClose"`

### Пропсы не передаются

Убедитесь, что:
1. Пропсы передаются в `openModal()` правильно
2. Компонент определяет интерфейс `Props` с нужными полями

### onClose не вызывается

Убедитесь, что:
1. `onClose` передаётся как функция
2. В `ModalStackHost` нет ошибок в консоли

## Легаси система

Для модальных окон со сложным состоянием (например, `StudyModal`) используется подход с `props.isOpen`:

```vue
<template>
  <Modal
    :is-open="isOpen"
    @close="close"
  >
    <!-- Сложное состояние -->
  </Modal>
</template>

<script setup lang="ts">
const isOpen = ref(false)

function open() {
  isOpen.value = true
}

function close() {
  isOpen.value = false
}
</script>
```

Такие модальные окна не используют стек и управляются локально.
