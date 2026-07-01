# Адаптация правил проекта под Nuxt архитектуру

## Обзор

Этот документ описывает адаптацию правил проекта под текущую архитектуру на Nuxt 4.4.2 + Vue 3 + Pinia.

> **Статус:** ✅ Актуально. Миграция на Nuxt 4 завершена 24 апреля 2026. Все правила в `.cursor/rules/` адаптированы под текущую архитектуру.

## Исходная архитектура vs Текущая архитектура

### React/Next.js (оригинальные правила)
- React + Next.js App Router
- React hooks (`useState`, `useEffect`, `useCallback`, `useMemo`)
- Zustand для state management
- FSD-lite: `shared -> entities -> features -> widgets -> pages -> app`
- Компоненты: `.tsx`
- Директивы: `'use client'`

### Nuxt 4 / Vue 3 (текущий проект)
- Nuxt 4.4.2 + Vue 3.5.32 + Composition API
- Vue composables и hooks (`computed`, `ref`, `onMounted`, `watch`)
- Pinia 3.0.4 для state management
- Архитектура: `domain -> application -> stores -> composables -> components -> pages`
- Компоненты: `.vue` с `<script setup lang="ts">`
- SPA режим (`ssr: false` в nuxt.config.ts)
- TypeScript strict mode включён
- Автоимпорты компонентов, stores, composables

## Структура проекта

```
src/
├── pages/               # Nuxt pages (файловый роутинг)
│   ├── index.vue
│   └── game/
│       └── [section].vue
├── components/
│   ├── layout/          # Layout компоненты
│   ├── ui/              # UI компоненты
│   ├── game/            # Game-специфичные компоненты
│   └── pages/           # Page-специфичные компоненты
├── stores/              # Pinia stores
├── composables/         # Vue composables
├── domain/              # Domain layer
│   ├── engine/          # ECS engine
│   ├── balance/         # Game balance constants
│   └── game-facade/     # Game facade
├── application/         # Application layer (commands/queries)
├── infrastructure/      # Адаптеры, persistence
├── middleware/          # Nuxt route middleware
├── plugins/             # Nuxt/Vue plugins
├── utils/               # Утилиты
├── constants/           # Константы
├── config/              # Конфигурация
├── types/               # Типы
└── assets/              # Assets (CSS, images)

shared/                  # Общие типы и утилиты (автоимпорт)
├── types/
└── utils/
```

## Адаптация правил по секциям

### 1. Типизация (10-typing.mdc)

**Что остается без изменений:**
- Типы в отдельных файлах (`*.types.ts`)
- Явная типизация границ модуля
- Запрет `any`
- Запрет inline object-типов
- Использование `import type`

**Что нужно адаптировать:**

| Оригинальное правило (React) | Адаптированное правило (Vue/Nuxt) |
|------------------------------|-----------------------------------|
| `ReturnType<typeof ...>` в аннотациях переменных. Для React hooks используй доменные/библиотечные типы напрямую (например, `MutableRefObject<T>`, `RefObject<T>`) | `ReturnType<typeof ...>` в аннотациях переменных. Для Vue composables и Pinia stores используй доменные типы напрямую. Для refs используй `Ref<T>` из `vue` |
| Для hook-вызовов с типизированной переменной слева не дублируй generic справа (`const x: T = useHook<T>(...)`) | Для composable-вызовов и Pinia store-селекторов не дублируй generic справа, если тип уже указан слева |
| Для `useSessionStore`-селекторов не дублируй return-тип callback | Для Pinia store-селекторов (`const store = useGameStore()`) типизация происходит автоматически через generic |
| Исключение для переменных, инициализированных вызовом фабрики/хука | Исключение для переменных, инициализированных вызовом composable или Pinia store (`const store = useGameStore()`) |

**Дополнительные правила для Vue:**
- Для `ref<T>()` используй явный generic: `const count: Ref<number> = ref(0)` или `const count = ref<number>(0)`
- Для `computed<T>()` вывод типа работает автоматически, но можно указать явно: `const doubled: ComputedRef<number> = computed(() => count.value * 2)`

### 2. Code Style (20-code-style.mdc)

**Что остается без изменений:**
- Именование переменных и функций
- Boolean-префиксы (`is/has/can/should/was/are`)
- Имена функций с глаголов действия
- Колбэки массивов
- Формат параметров функций
- Публичные экспорты с TSDoc
- Общее форматирование кода

**Что нужно адаптировать:**

| Оригинальное правило (React) | Адаптированное правило (Vue/Nuxt) |
|------------------------------|-----------------------------------|
| ## React хуки<br>- Для колбэков React хуков (`useEffect`, `useCallback`, `useMemo` и т.п.) предпочитай стрелочные функции вместо именованных функций.<br>- Пример: `useEffect(() => { ... }, []);` вместо `useEffect(function effect(): void { ... }, []);` | ## Vue Composables и Lifecycle Hooks<br>- Для колбэков Vue lifecycle hooks (`onMounted`, `onUnmounted`, `watch`, `watchEffect`) предпочитай стрелочные функции.<br>- Пример: `onMounted(() => { ... });` вместо `onMounted(function mounted(): void { ... });`.<br>- Для watch используй отдельные функции-обработчики для улучшения читаемости: `watch(source, (newVal, oldVal) => { ... });` |
| ## Импорты<br>- Соблюдай алиасы проекта: `@entities/*`, `@features/*`, `@widgets/*`, `@shared/*`, `@app/*`, `@pages/*` | ## Импорты<br>- Соблюдай алиасы проекта: `@/` (root), `@/components/*`, `@/stores/*`, `@/composables/*`, `@/domain/*`, `@/application/*`, `@/shared/*`.<br>- Для Nuxt-специфичных импортов используйте `#imports` (автоимпорты): `navigateTo`, `useRouter`, `useRoute` |
| ## JSX и читаемость блоков<br>- Внутри React-компонента соблюдай последовательность блоков: <br>  - `props` деструктуризация;<br>  - роутинг/hooks навигации (`useRouter`, `usePathname`, `useSearchParams`);<br>  - store-селекторы (`useSessionStore`, `useDocumentBuilderStore`);<br>  - производные константы/флаги;<br>  - локальный state (`useState`);<br>  - memo/callback (`useMemo`, `useCallback`);<br>  - handlers/functions;<br>  - эффекты (`useEffect`);<br>  - guard-возвраты;<br>  - основной `return` с JSX. | ## Vue SFC и читаемость блоков<br>- Внутри `<script setup lang="ts">` соблюдай последовательность блоков:<br>  1. Импорты (сгруппированные и разделенные пустыми строками);<br>  2. Props definition (`defineProps<...>` или `withDefaults(defineProps<...>(), {...})`);<br>  3. Emits definition (`defineEmits<...>()`);<br>  4. Роутинг (`const router = useRouter(); const route = useRoute();`);<br>  5. Pinia stores (`const store = useGameStore();`);<br>  6. Компоненты (если нужно: `const Component = defineAsyncComponent(...)`);<br>  7. Производные константы/флаги;<br>  8. Локальный state (`ref`, `reactive`);<br>  9. Computed свойства (`computed`);<br> 10. Handlers/functions;<br> 11. Lifecycle hooks (`onMounted`, `watch`, и т.д.);<br> 12. Guard-условия (если есть);<br>- В `<template>` используйте читаемую структуру с комментариями для разделов |
| - JSX-теги с закрывающей парой (`<Tag>...</Tag>`) раскрывай "лесенкой" | - Vue-компоненты в template также раскрывай "лесенкой" для многострочных блоков<br>- Используй короткий синтаксис для компонентов без слотов: `<ComponentName />`<br>- Для компонентов со слотами используй полный синтаксис: `<ComponentName><slot /></ComponentName>` |
| - После `const { ... } = props;` оставляй ровно одну пустую строку перед следующим логическим блоком | - После `defineProps`, `defineEmits` и т.д. оставляй одну пустую строку<br>- После объявления stores оставляй одну пустую строку |
| - Для простых вызовов Zustand `set` используй однострочный формат: `set({ key: value }, false, 'scope/action');` | - Для простых вызовов Pinia store actions используй однострочный формат: `store.someAction(payload)`<br>- Для мутаций состояния в Pinia используйте actions, а не прямую мутацию (в Setup API это контролируется автоматически) |

**Дополнительные правила для Vue:**
- Используйте `v-if` вместо `&&` для условного рендеринга
- Используйте `v-for` с обязательным `:key`
- Предпочитайте `computed` вместо методов для производных значений
- Используйте `<script setup lang="ts">` для всех компонентов
- Для динамических компонентов используйте `<component :is="..." />`
- Используйте `v-model` для двустороннего связывания вместо ручных обработчиков

### 3. Архитектура (30-architecture.mdc)

**Что остается без изменений:**
- Общая концепция слоев и направлений зависимостей
- Идея открытия публичного API через `index.ts`

**Что нужно полностью заменить:**

| Оригинальное правило (React/Next.js) | Адаптированное правило (Vue/Nuxt) |
|--------------------------------------|-----------------------------------|
| Направление зависимостей:<br>`shared -> entities -> features -> widgets -> pages -> app` | Направление зависимостей:<br>`shared -> domain -> application -> stores/composables -> components -> pages`<br><br>**Детализация:**<br>- `shared` - утилиты, константы, типы<br>- `domain` - бизнес-логика (engine, balance, game-facade)<br>- `application` - команды/запросы к domain<br>- `stores` - Pinia stores (state management)<br>- `composables` - Vue composables (reusable logic)<br>- `components` - UI и presentation<br>- `pages` - Nuxt pages (маршрутизация) |
| ## Соглашения по компонентам<br>- Префикс `Ui*` зарезервирован только для `src/shared/ui`.<br>- Компоненты вне `shared/ui` называй по смыслу, без `Ui`.<br>- Структура папки компонента:<br>  - `ComponentName.tsx`<br>  - `ComponentName.types.ts`<br>  - `index.ts` | ## Соглашения по компонентам<br>- Префикс `Ui*` зарезервирован только для `src/components/ui`.<br>- Layout компоненты в `src/components/layout/`.<br>- Game-специфичные компоненты в `src/components/game/`.<br>- Структура компонента:<br>  - `ComponentName.vue` (SFC с template, script, style)<br>  - Типы обычно в том же файле или импортируются<br>  - Если компонент сложный, типы можно вынести в `ComponentName.types.ts` рядом |
| ## Next.js client-компоненты<br>- Если файл использует hooks/state/events браузера, ставь `'use client';` первой инструкцией в файле. | ## Nuxt components<br>- Nuxt 4 по умолчанию использует client-side rendering (SSR отключен в конфиге)<br>- Все компоненты могут использовать browser APIs без специальных директив<br>- Для server-side логики используйте Nitro plugins/server routes (не применимо при SSR: false) |
| ## Каркас `app/layout.tsx`<br>- Базовый каркас: `<html><body><main>{children}</main></body></html>`.<br>- Не добавляй лишнюю обертку вокруг `{children}` внутри `<main>` без необходимости. | ## Nuxt App Layout<br>- Используйте `src/nuxt-pages/app.vue` как корневой layout (если нужно)<br>- Или создайте layout components в `src/components/layout/` и подключайте через Nuxt layouts<br>- Пример layout:<br>```vue<template>
  <div class="app">
    <slot />
  </div>
</template>``` |

**Дополнительные архитектурные правила для Nuxt:**

### Структура слоев:

1. **Domain Layer** (`src/domain/`):
   - `engine/` - ECS engine implementation
   - `balance/` - game balance data (constants, actions)
   - `game-facade/` - facade for game operations

2. **Application Layer** (`src/application/`):
   - `game/` - commands and queries for game operations
   - `ports/` - interfaces for external dependencies (SaveRepository)

3. **State Management** (`src/stores/`):
   - Pinia stores wrapping domain/application logic
   - Используют `shallowRef` для оптимизации (game.store.ts)
   - Provide computed properties for derived state

4. **Composables** (`src/composables/`):
   - Reusable logic with Vue Composition API
   - Инкапсулируют сложные операции (например, `useEvents`)
   - Работают с Pinia stores и domain layer

5. **Components** (`src/components/`):
   - `layout/` - layout components
   - `ui/` - reusable UI components
   - `game/` - game-specific presentation components

6. **Pages** (`src/nuxt-pages/`, `src/pages/`):
   - Nuxt pages с маршрутами
   - Используют stores, composables и components
   - Не содержат бизнес-логику

### Зависимости между слоями:

```
pages → components → composables → stores → application → domain → shared
                                                           ↑
                                                        shared
```

### Правила импортов:

- Pages могут импортировать: components, composables, stores
- Components могут импортировать: composables, stores, shared, другие components
- Composables могут импортировать: stores, application, domain, shared
- Stores могут импортировать: application, domain, shared
- Application может импортировать: domain, shared
- Domain может импортировать только shared
- Shared не должен импортировать ничего из других слоев

## Практические примеры адаптации

### Пример 1: Компонент

**React (оригинальный стиль):**
```tsx
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export function UserProfile() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    setLoading(true)
    const data = await fetchUser()
    setUser(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const handleEdit = useCallback(() => {
    router.push('/edit')
  }, [router])

  return (
    <div className="user-profile">
      {loading ? <LoadingSpinner /> : <UserInfo user={user} onEdit={handleEdit} />}
    </div>
  )
}
```

**Vue/Nuxt (адаптированный стиль):**
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { navigateTo } from '#imports'
import { useGameStore } from '@/stores/game.store'

interface User {
  id: string
  name: string
}

const router = useRouter()
const route = useRoute()
const store = useGameStore()

const user = ref<User | null>(null)
const loading = ref(true)

async function loadUser() {
  loading.value = true
  const data = await fetchUser()
  user.value = data
  loading.value = false
}

function handleEdit() {
  navigateTo('/edit')
}

onMounted(() => {
  loadUser()
})
</script>

<template>
  <div class="user-profile">
    <LoadingSpinner v-if="loading" />
    <UserInfo v-else :user="user" @edit="handleEdit" />
  </div>
</template>
```

### Пример 2: Store

**Zustand (оригинальный стиль):**
```ts
import { create } from 'zustand'

interface UserStore {
  user: User | null
  setUser: (user: User) => void
  logout: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }, false, 'setUser'),
  logout: () => set({ user: null }, false, 'logout'),
}))
```

**Pinia (адаптированный стиль):**
```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGameStore = defineStore('game', () => {
  const playerName = ref('Алексей')
  const money = ref(0)

  const isInitialized = computed(() => money.value > 0)

  function setPlayerName(name: string): void {
    playerName.value = name
  }

  function addMoney(amount: number): void {
    money.value += amount
  }

  return {
    playerName,
    money,
    isInitialized,
    setPlayerName,
    addMoney,
  }
})
```

### Пример 3: Типизация

**React (оригинальный стиль):**
```ts
import type { RefObject } from 'react'

interface Props {
  onRef: RefObject<HTMLDivElement>
}

export function MyComponent({ onRef }: Props) {
  const handleClick = useCallback(() => {
    onRef.current?.focus()
  }, [onRef])

  return <div ref={onRef} onClick={handleClick}>Click me</div>
}
```

**Vue/Nuxt (адаптированный стиль):**
```vue
<script setup lang="ts">
import type { Ref } from 'vue'

interface Props {
  modelValue: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)

function handleClick() {
  inputRef.value?.focus()
}
</script>

<template>
  <div>
    <input
      ref="inputRef"
      :value="props.modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @click="handleClick"
    />
  </div>
</template>
```

## Чек-лист миграции

При работе с кодом проверяйте:

- [ ] Используете `<script setup lang="ts">` вместо стандартного script
- [ ] Импорты из `#imports` для Nuxt-функций (navigateTo, useRouter, useRoute)
- [ ] Pinia stores вместо Zustand
- [ ] `ref<T>()` и `computed<T>()` вместо useState/useMemo
- [ ] `onMounted`/`watch` вместо useEffect
- [ ] `v-if`/`v-for` вместо условного рендеринга в JSX
- [ ] Соблюдаете последовательность блоков в `<script setup>`
- [ ] Типы в `*.types.ts` рядом с модулем
- [ ] Явная типизация границ модуля
- [ ] Нет inline object-типов
- [ ] Нет `any`, только `unknown` или конкретные типы
- [ ] Правильные алиасы импортов (`@/` вместо `@entities/*` и т.д.)

## Заключение

Эта адаптация сохраняет суть оригинальных правил (строгая типизация, чистый код, хорошая архитектура), но адаптирует их под экосистему Nuxt/Vue. Ключевые изменения:

1. React hooks → Vue Composition API
2. Zustand → Pinia
3. JSX → Vue SFC template
4. FSD-lite слои → Архитектура domain/application/stores/composables
5. `'use client'` → Не нужно (SSR: false)

Все принципы чистоты кода, типизации и архитектурных границ сохраняются.
