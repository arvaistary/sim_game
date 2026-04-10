# Nuxt 4 Архитектура

**Последнее обновление:** 10 апреля 2026
**Технологический стек:** Nuxt 4 + Vue 3 + TypeScript + Pinia

---

## Обзор

Проект Game Life использует Nuxt 4 - современный веб-фреймворк на базе Vue 3. Nuxt предоставляет:

- Автоматический файловый роутинг
- Auto-import компонентов, composables, stores
- Мощную систему middleware
- Интеграцию с Pinia для state management
- TypeScript поддержку
- SPA режим для оптимальной производительности

---

## Конфигурация

### nuxt.config.ts

```typescript
export default defineNuxtConfig({
  compatibilityDate: '2026-04-10',
  ssr: false,                    // SPA режим - только клиентский рендеринг
  srcDir: 'src/',                 // Папка с исходным кодом
  dir: {
    pages: 'nuxt-pages',          // Кастомная папка для страниц
  },
  css: ['~/assets/css/main.css'],  // Глобальные стили

  modules: [
    '@pinia/nuxt',                // Pinia интеграция
    '@nuxtjs/color-mode'           // Dark mode поддержка
  ],

  typescript: {
    strict: false,                 // Отключена строгая проверка
    typeCheck: true,               // Проверка типов при сборке
  },

  app: {
    head: {
      title: 'Game Life',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Cozy turn-based life simulator' },
      ],
    },
  },

  devtools: { enabled: true },     // Vue DevTools для отладки
})
```

### Основные настройки

| Настройка | Значение | Описание |
|-----------|-----------|-----------|
| `compatibilityDate` | `'2026-04-10'` | Дата совместимости для автоматических миграций |
| `ssr` | `false` | SPA режим - только клиентский рендеринг |
| `srcDir` | `'src/'` | Папка с исходным кодом |
| `dir.pages` | `'nuxt-pages'` | Кастомная папка для страниц |
| `typescript.strict` | `false` | Строгая проверка отключена |
| `devtools.enabled` | `true` | Vue DevTools включены |

---

## Файловый роутинг

### Структура папки

```
src/nuxt-pages/
├── index.vue           → /
└── game/
    └── [section].vue   → /game/:section
```

### Генерируемые маршруты

| Файл | Путь | Описание |
|------|------|-----------|
| `index.vue` | `/` | Главная страница (рендерит StartPage) |
| `game/[section].vue` | `/game/:section` | Динамические страницы игры |

### Динамический компонент

`game/[section].vue` использует динамический импорт для загрузки нужного компонента:

```vue
<script setup lang="ts">
const route = useRoute()
const section = computed(() => String(route.params.section ?? ''))

const componentMap = {
  recovery: RecoveryPage,
  career: CareerPage,
  finance: FinancePage,
  education: EducationPage,
  events: EventQueuePage,
  skills: SkillsPage,
  hobby: HobbyPage,
  health: HealthPage,
  selfdev: SelfdevPage,
  shop: ShopPage,
  social: SocialPage,
  home: HomePage,
  activity: ActivityLogPage,
}

const component = computed(() => componentMap[section.value])
</script>

<template>
  <component :is="component" />
</template>
```

### Маппинг секций

| Секция URL | Vue Компонент | Описание |
|------------|---------------|-----------|
| recovery | RecoveryPage | Восстановление: дом, магазин, развлечения, соц. жизнь |
| career | CareerPage | Карьера: должности, доход, требования |
| finance | FinancePage | Финансы: обзор, расходы, действия, инвестиции |
| education | EducationPage | Образование: программы обучения и активные курсы |
| events | EventQueuePage | Очередь событий и выбор решений |
| skills | SkillsPage | Экран навыков персонажа |
| hobby | HobbyPage | Хобби и увлечения |
| health | HealthPage | Здоровье и фитнес |
| selfdev | SelfdevPage | Саморазвитие |
| shop | ShopPage | Магазины: еда и покупки |
| social | SocialPage | Социальная жизнь |
| home | HomePage | Дом: мебель, комфорт, переезд |
| activity | ActivityLogPage | Журнал активности |

---

## Middleware

### game-init.ts

**Путь:** `src/middleware/game-init.ts`

**Назначение:** Автоматическая инициализация ECS World и загрузка сохранения при входе в игровые страницы.

### Логика работы

```typescript
export default defineNuxtRouteMiddleware((to) => {
  // Пропускаем не игровые маршруты
  if (!to.path.startsWith('/game')) {
    return
  }

  // Получаем Game Store
  const gameStore = useGameStore()

  // Инициализируем если нужно
  if (!gameStore.isInitialized) {
    gameStore.initWorld()
    gameStore.load()
  }
})
```

### Характеристики

- **Выполняется:** При навигации на любой маршрут, начинающийся с `/game`
- **Момент:** До рендеринга компонента страницы
- **Среда:** Только на клиенте (client-side)
- **Действия:**
  1. Проверяет инициализацию Game Store
  2. Вызывает `initWorld()` если не инициализирован
  3. Вызывает `load()` для загрузки сохранения

---

## Pinia Integration

### game.store.ts

**Путь:** `src/stores/game.store.ts`

**Назначение:** Централизованное хранилище состояния игры с интеграцией ECS World.

### Основные методы

```typescript
// Инициализация ECS World
function initWorld(saveData?: Record<string, unknown>)

// Сохранение в localStorage
function save(): void

// Загрузка из localStorage
function load(): boolean

// Обновление реактивности
function refresh(): void

// Выполнение действия
function executeAction(actionId: string): void

// Продвижение времени
function advanceTime(hours: number): void

// Применение действия восстановления
function applyRecoveryAction(cardData: Record<string, unknown>): string

// Применение рабочего периода
function applyWorkShift(hours: number): string

// Получение карьерного трека
function getCareerTrack(): Array<Record<string, unknown>>

// Получение записей журнала
function getActivityLogEntries(count?: number): Array<Record<string, unknown>>

// И многие другие методы...
```

### Computed свойства

```typescript
// Доступ к компонентам ECS через computed
const stats = computed(() => world.value?.getComponent<StatsComponent>(PLAYER_ENTITY, 'stats'))
const time = computed(() => world.value?.getComponent<TimeComponent>(PLAYER_ENTITY, 'time'))
const wallet = computed(() => world.value?.getComponent<WalletComponent>(PLAYER_ENTITY, 'wallet'))
const skills = computed(() => world.value?.getComponent<SkillsComponent>(PLAYER_ENTITY, 'skills'))
const career = computed(() => world.value?.getComponent<CareerComponent>(PLAYER_ENTITY, 'career'))
const housing = computed(() => world.value?.getComponent<HousingComponent>(PLAYER_ENTITY, 'housing'))
const education = computed(() => world.value?.getComponent<EducationComponent>(PLAYER_ENTITY, 'education'))
// ... и другие компоненты
```

### Reactivity Strategy

```typescript
// ECS World в shallowRef для оптимизации
const world = shallowRef<ECSWorld | null>(null)

// Флаг инициализации
const isInitialized = ref(false)

// Имя игрока
const playerName = ref<string>('')

// Обновление реактивности
function refresh() {
  if (world.value) {
    triggerRef(world)
  }
}
```

**Почему shallowRef:**
- World объект реактивен, но не его свойства
- Избегает глубокой реактивности (deep reactivity)
- Оптимизирует производительность

**Почему triggerRef:**
- Явное обновление реактивности при необходимости
- Избегает ненужных перерисовок
- Даёт контроль над обновлением UI

---

## Auto-import

### Компоненты

Nuxt автоматически импортирует Vue компоненты из `src/components/`:

```vue
<template>
  <!-- Автоматически доступен без импорта -->
  <GameButton @click="handleClick">Click me</GameButton>
  <ProgressBar :progress="50" />
  <StatBar :value="80" :max="100" />
  <Modal v-model:open="showModal">
    <!-- Контент модалки -->
  </Modal>
</template>
```

### Composables

Nuxt автоматически импортирует composables из `src/composables/`:

```vue
<script setup lang="ts">
// Автоматически доступны без импорта
const store = useGameStore()
const actions = useActions()
const finance = useFinance()
const events = useEvents()
const toast = useToast()
const activityLog = useActivityLog()
</script>
```

### Stores

Nuxt автоматически импортирует Pinia stores из `src/stores/`:

```vue
<script setup lang="ts">
// Автоматически доступен без импорта
const gameStore = useGameStore()
</script>
```

---

## CSS и стилизация

### Глобальные стили

```typescript
css: ['~/assets/css/main.css']
```

### Color Mode

```typescript
modules: ['@nuxtjs/color-mode']
```

Использует `@nuxtjs/color-mode` для поддержки тёмной/светлой темы.

### Scoped стили

Vue компоненты поддерживают scoped стили:

```vue
<template>
  <div class="game-button">Click me</div>
</template>

<style scoped>
.game-button {
  background: #3b82f6;
  color: white;
  padding: 10px 20px;
}
</style>
```

---

## TypeScript Конфигурация

### tsconfig.json

```json
{
  "extends": "./.nuxt/tsconfig.json",
  "compilerOptions": {
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### Типизация

- **Strict mode:** Отключена (`strict: false`)
- **Type checking:** Включена (`typeCheck: true`)
- **Nuxt types:** Автоматически генерируются в `.nuxt/`
- **Component props:** Типизируются через интерфейсы

---

## Modules

### Pinia Module

```typescript
modules: ['@pinia/nuxt']
```

**Назначение:** Интеграция Pinia state management.

**Функции:**
- Автоматическое создание Pinia instance
- Auto-import stores (`useGameStore`)
- SSR hydration (если SSR включён)

### Color Mode Module

```typescript
modules: ['@nuxtjs/color-mode']
```

**Назначение:** Поддержка тёмной/светлой темы.

**Использование:**
```vue
<script setup lang="ts">
const colorMode = useColorMode()
</script>

<template>
  <div :class="colorMode.value">
    <!-- Контент -->
  </div>
</template>
```

---

## DevTools

### Vue DevTools

```typescript
devtools: { enabled: true }
```

**Назначение:** Отладка Vue компонентов и Pinia stores.

**Функции:**
- Инспекция компонентов
- Инспекция Pinia stores
- Time travel debugging
- Отслеживание событий

### Nuxt DevTools

```bash
npm run dev
```

**URL:** http://localhost:3000/_nuxt

**Функции:**
- Просмотр роутов
- Просмотр компонентов
- Просмотр конфигурации
- Performance profiling

---

## Производительность

### Оптимизации

1. **SPA Mode (`ssr: false`)**
   - Только клиентский рендеринг
   - Уменьшает bundle size
   - Улучшает время загрузки

2. **shallowRef для ECS World**
   - World объект реактивен, но не его свойства
   - Избегает глубокой реактивности
   - Оптимизирует производительность

3. **Computed свойства для компонентов ECS**
   - Ленивая загрузка компонентов ECS
   - Кэширование результатов

4. **triggerRef для явного обновления**
   - Явное обновление реактивности
   - Избегает ненужных перерисовок

5. **Auto-import Nuxt**
   - Компоненты и composables импортируются автоматически
   - Оптимизация bundle size

6. **Tree-shaking**
   - Unused code исключается из бандла
   - Уменьшает bundle size

### Мониторинг

- **Lighthouse:** Интеграция для измерения производительности
- **Vue DevTools:** Отладка производительности
- **Nuxt DevTools:** Профилирование

---

## Разработка

### Команды

```bash
# Установка зависимостей
npm install

# Режим разработки
npm run dev

# Сборка для продакшена
npm run build

# Предпросмотр продакшен-сборки
npm run preview

# Линтинг
npm run lint

# Типизация
npm run typecheck

# Тесты
npm run test
npm run test:unit
npm run test:e2e
npm run test:coverage
```

### Горячая замена (Hot Module Replacement)

- **Dev server:** `npm run dev` запускает dev server
- **HMR:** Изменения файлов автоматически применяются
- **URL:** http://localhost:3000
- **Port:** Автоматически выбирается доступный порт

### Environment Variables

```bash
# .env
NUXT_PUBLIC_API_URL=https://api.example.com
```

**Использование:**

```vue
<script setup lang="ts">
const apiUrl = useRuntimeConfig().public.apiUrl
</script>
```

---

## Deployment

### Сборка

```bash
npm run build
```

**Результат:**
- `.output/` - папка с собранным приложением
- Статические файлы готовы для деплоя

### Деплой

#### Static Hosting (Vercel, Netlify, GitHub Pages)

```bash
npm run build
# Деплой папки .output/
```

#### Node.js Server

```bash
npm run build
npm run preview
# Запуск Node.js сервера
```

---

## Best Practices

### Компоненты

1. **Используйте Composition API**
   ```vue
   <script setup lang="ts">
   const props = defineProps<{ count: number }>()
   const emit = defineEmits<{ click: [] }>()
   </script>
   ```

2. **Используйте типизацию props**
   ```typescript
   interface Props {
     count: number
     onIncrement: () => void
   }

   const props = defineProps<Props>()
   ```

3. **Используйте scoped стили**
   ```vue
   <style scoped>
   .component {
     /* Стили */
   }
   </style>
   ```

### Composables

1. **Извлекайте переиспользуемую логику**
   ```typescript
   // src/composables/useActions.ts
   export function useActions() {
     const store = useGameStore()
     return { executeAction, canExecute }
   }
   ```

2. **Используйте типизацию**
   ```typescript
   interface UseActionsReturn {
     executeAction: (id: string) => void
     canExecute: (id: string) => boolean
   }

   export function useActions(): UseActionsReturn
   ```

### Stores

1. **Используйте shallowRef для больших объектов**
   ```typescript
   const world = shallowRef<ECSWorld | null>(null)
   ```

2. **Используйте computed для производных данных**
   ```typescript
   const stats = computed(() => world.value?.getComponent<StatsComponent>(...))
   ```

3. **Используйте triggerRef для обновления**
   ```typescript
   function refresh() {
     if (world.value) {
       triggerRef(world)
     }
   }
   ```

---

## Дополнительные ресурсы

- **[Nuxt 4 Documentation](https://nuxt.com/docs)**
- **[Vue 3 Documentation](https://vuejs.org/)**
- **[Pinia Documentation](https://pinia.vuejs.org/)**
- **[TypeScript Documentation](https://www.typescriptlang.org/)**
- **[ARCHITECTURE_OVERVIEW.md](core/ARCHITECTURE_OVERVIEW.md)** - Обзор 4 архитектурных слоёв
- **[PAGES_REFERENCE.md](core/PAGES_REFERENCE.md)** - Справочник Vue страниц
- **[COMPOSABLES_REFERENCE.md](COMPOSABLES_REFERENCE.md)** - Справочник composables

---

*Документ создан для Nuxt 4 + Vue 3 + TypeScript + Pinia*
