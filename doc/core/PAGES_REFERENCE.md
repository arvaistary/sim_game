# Справочник Vue страниц (актуально)

**Последнее обновление:** 10 апреля 2026

## Точка входа

- **`nuxt.config.ts`** - конфигурация Nuxt 4
- **`src/nuxt-pages/index.vue`** - стартовая страница (рендерит StartPage)
- Nuxt автоматически генерирует роутинг из файлов в `src/nuxt-pages/`

## Структура страниц

### Nuxt Pages (`src/nuxt-pages/`)

| Файл | Путь | Назначение |
|------|------|-----------|
| `index.vue` | `/` | Главная страница рендерит StartPage.vue |
| `game/[section].vue` | `/game/:section` | Динамические страницы игры с маппингом на Vue компоненты |

### Маппинг динамических страниц

**Файл:** `src/nuxt-pages/game/[section].vue`

**Маппинг секции на компонент:**

| Секция URL | Vue Компонент | Описание |
|-----------|---------------|-----------|
| recovery | RecoveryPage.vue | Восстановление: дом, магазин, развлечения, соц. жизнь |
| career | CareerPage.vue | Карьера: должности, доход, требования |
| finance | FinancePage.vue | Финансы: обзор, расходы, действия, инвестиции |
| education | EducationPage.vue | Образование: программы обучения и активные курсы |
| events | EventQueuePage.vue | Очередь событий и выбор решений |
| skills | SkillsPage.vue | Экран навыков персонажа |
| hobby | HobbyPage.vue | Хобби и увлечения |
| health | HealthPage.vue | Здоровье и фитнес |
| selfdev | SelfdevPage.vue | Саморазвитие |
| shop | ShopPage.vue | Магазин: еда и покупки |
| social | SocialPage.vue | Социальная жизнь |
| home | HomePage.vue | Дом: мебель, комфорт, переезд |
| activity | ActivityLogPage.vue | Журнал активности |

**Примечание:** MainPage.vue является корнем всех игровых экранов и включает встроенную навигацию, а не отдельный маршрут.

### Vue Pages (`src/pages/`)

| Файл | Назначение |
|------|-----------|
| `StartPage.vue` | Создание персонажа, форма старта |
| `MainPage.vue` | Главный HUD, навигация, центральная точка игры |
| `RecoveryPage.vue` | Восстановление через магазин, развлечения, дом |
| `CareerPage.vue` | Доступные работы, карьерный прогресс |
| `FinancePage.vue` | Управление финансами и инвестициями |
| `EducationPage.vue` | Программы обучения и активные курсы |
| `EventQueuePage.vue` | Очередь событий и выбор решений |
| `SkillsPage.vue` | Отображение навыков персонажа |
| `HobbyPage.vue` | Хобби и побочный заработок |
| `HealthPage.vue` | Здоровье и фитнес |
| `SelfdevPage.vue` | Саморазвитие |
| `ShopPage.vue` | Магазин: еда и покупки |
| `SocialPage.vue` | Социальная жизнь |
| `HomePage.vue` | Дом: мебель, комфорт, переезд |
| `ActivityLogPage.vue` | Журнал активности игрока |

## Nuxt Middleware

| Файл | Описание |
|------|-----------|
| `src/middleware/game-init.ts` | Автоматическая инициализация ECS World при входе в `/game/*` |

**Что делает middleware:**
- Проверяет, инициирован ли GameStore
- Вызывает `gameStore.initWorld()` если нет
- Загружает сохранение из localStorage
- Убеждается, что ECS World готов к работе

## Интеграция с ECS

Все Vue компоненты страниц интегрированы с ECS через:

1. **Pinia Store** (`src/stores/game.store.ts`)
   - ECS World в `shallowRef` для оптимизации производительности
   - Computed свойства для доступа к компонентам ECS
   - Методы для команд и запросов
   - `triggerRef(world)` для обновления реактивности

2. **Composables** (`src/composables/`)
   - `useActions.ts` - работа с действиями
   - `useFinance.ts` - финансы
   - `useEvents.ts` - события
   - `useToast.ts` - уведомления
   - `useActivityLog.ts` - журнал активности

3. **Application Layer** (`src/application/game/`)
   - `commands.ts` - команды приложения (прокси к domain commands)
   - `queries.ts` - запросы приложения (прокси к domain queries)

4. **Domain Layer** (`src/domain/`)
   - `ecs/systems/` - 18 ECS систем
   - `ecs/world.ts` - ECS World контейнер
   - `game-facade/` - фасад доменного слоя

## Поток данных

```
User Action (клик)
  ↓
Vue Component (страница)
  ↓
Composable (useActions/useFinance/useEvents)
  ↓
Pinia Store (useGameStore)
  ↓
Application Layer (commands.ts)
  ↓
Domain Layer (gameDomainFacade)
  ↓
ECS System (TimeSystem/StatsSystem/etc)
  ↓
ECS World (обновление компонентов)
  ↓
triggerRef(world) - обновление реактивности
  ↓
Vue Components (переотрисовка)
```

## Nuxt Routing

### Файловый роутинг

Nuxt автоматически генерирует роуты на основе структуры файлов:

```
src/nuxt-pages/
├── index.vue           → /
└── game/
    └── [section].vue   → /game/:section
```

### Динамический компонент

`game/[section].vue` использует динамический импорт для загрузки нужного компонента страницы:

```typescript
const componentMap = {
  recovery: RecoveryPage,
  career: CareerPage,
  finance: FinancePage,
  // ... и так далее
}

const component = computed(() => componentMap[section.value])
```

## UI Компоненты

### Layout Components (`src/components/layout/`)

| Файл | Назначение |
|------|-----------|
| `GameLayout.vue` | Основной layout игры |
| `BottomNav.vue` | Нижняя навигация |

### UI Components (`src/components/ui/`)

| Файл | Назначение |
|------|-----------|
| `GameButton.vue` | Кнопки игры |
| `ProgressBar.vue` | Прогресс-бары |
| `StatBar.vue` | Шкалы статов |
| `Modal.vue` | Модальные окна |
| `Toast.vue` | Уведомления |
| `Tooltip.vue` | Всплывающие подсказки |
| `RoundedPanel.vue` | Округлённые панели |

## Конфигурация

### nuxt.config.ts

```typescript
export default defineNuxtConfig({
  compatibilityDate: '2026-04-10',
  ssr: false,                    // SPA режим
  srcDir: 'src/',
  dir: {
    pages: 'nuxt-pages',         // Кастомная папка для страниц
  },
  css: ['~/assets/css/main.css'],
  modules: ['@pinia/nuxt', '@nuxtjs/color-mode'],
  typescript: {
    strict: false,
    typeCheck: true,
  },
  devtools: { enabled: true },
})
```

### Основные настройки

- **SPA Mode:** `ssr: false` - только клиентский рендеринг
- **Pages Dir:** `dir.pages: 'nuxt-pages'` - кастомная папка для страниц
- **TypeScript:** строгая проверка отключена для совместимости
- **Modules:** Pinia (state management), Color Mode (dark mode)

## Дополнительные замечания

### Auto-import

Nuxt автоматически импортирует:
- Vue компоненты из `src/components/`
- Composables из `src/composables/`
- Stores из `src/stores/`

Это позволяет использовать компоненты, composables и stores без явных импортов.

### Middleware Execution

Middleware `game-init.ts` выполняется:
- При навигации на любой маршрут, начинающийся с `/game`
- До рендеринга компонента страницы
- Только на клиенте (client-side)

### Reactive Integration

ECS World хранится в `shallowRef` для оптимизации производительности:
- Только сам World объект реактивен (не его свойства)
- Components ECS не реактивны напрямую
- Computed свойства в store создают реактивный доступ
- После каждого изменения вызывается `triggerRef(world)` для обновления

---

*Документ создан для архитектуры Nuxt 4 + Vue 3 + TypeScript*
