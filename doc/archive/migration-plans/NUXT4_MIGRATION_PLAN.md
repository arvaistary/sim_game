# План миграции Game Life: Vue 3 + Vite → Nuxt 4

**Дата создания:** 10 апреля 2026  
**Дата завершения:** 24 апреля 2026  
**Статус:** ✅ Завершено  
**Приоритет:** Высокий (стратегическая миграция)

> **Примечание:** Этот документ описывает процесс миграции, который был успешно завершён. Проект сейчас использует Nuxt 4.4.2 в SPA режиме. Текущее состояние соответствует Nuxt 4 стандартам (см. `plans/nuxt4-compliance-plan.md` для актуального отчёта о соответствии).

---

## Содержание

1. [Исполнительная сводка](#1-исполнительная-сводка)
2. [Анализ текущей архитектуры](#2-анализ-текущей-архитектуры)
3. [Варианты архитектуры Nuxt 4](#3-варианты-архитектуры-nuxt-4)
4. [Рекомендуемая архитектура](#4-рекомендуемая-архитектура)
5. [Пошаговый план миграции](#5-пошаговый-план-миграции)
6. [Карта соответствия: Vue 3 → Nuxt 4](#6-карта-соответствия-vue-3--nuxt-4)
7. [Детальная миграция по модулям](#7-детальная-миграция-по-модулям)
8. [Конфигурация Nuxt 4](#8-конфигурация-nuxt-4)
9. [Риски и митигация](#9-риски-и-митигация)
10. [Оценка трудозатрат](#10-оценка-трудозатрат)
11. [Критерии приёмки](#11-критерии-приёмки)
12. [Чек-лист миграции](#12-чек-лист-миграции)

---

## 1. Исполнительная сводка

### Цель

Миграция проекта Game Life с Vue 3 + Vite на Nuxt 4 с сохранением всей игровой логики, ECS-архитектуры и визуального стиля «Warm Cozy Minimalism».

### Обоснование

| Проблема Vue 3 + Vite | Решение Nuxt 4 |
|----------------------|----------------|
| Ручная настройка роутинга через `vue-router` | Автоматическая генерация роутинга на основе файловой структуры |
| Отсутствие встроенной оптимизации изображений | Модуль `@nuxt/image` с автоматической оптимизацией |
| Ручная настройка SEO и мета-тегов | Встроенный модуль `@nuxtjs/seo` и `useHead()` |
| Отсутствие серверного рендеринга | Полная поддержка SSR/SSG при необходимости |
| Ручная настройка TypeScript | Нативная поддержка TypeScript в Nuxt 4 |
| Отсутствие встроенного состояния для сервера | `useState()` для SSR-совместимого состояния |
| Ручная настройка компонентов | Автоимпорты компонентов и composables |
| Отсутствие встроенной системы плагинов | `plugins/` директория для расширения функционала |
| Отсутствие middleware для роутинга | `middleware/` директория для защиты роутов |
| Ручная настройка окружений | Встроенная поддержка `.env` файлов |

### Что сохраняется

- ✅ **ECS-ядро** — [`ECSWorld`](src/ecs/world.ts), все 15+ систем, компоненты
- ✅ **Баланс** — все файлы [`src/balance/`](src/balance/)
- ✅ **Shared-утилиты** — [`src/shared/`](src/shared/)
- ✅ **PersistenceSystem** — localStorage-сохранения
- ✅ **Визуальный стиль** — палитра `COLORS`, шрифты, скруглённые панели
- ✅ **Pinia Store** — [`useGameStore`](src/stores/game.store.ts)
- ✅ **Composables** — [`useActions`](src/composables/useActions.ts), [`useActivityLog`](src/composables/useActivityLog.ts), [`useEvents`](src/composables/useEvents.ts), [`useFinance`](src/composables/useFinance.ts), [`useToast`](src/composables/useToast.ts)
- ✅ **UI-компоненты** — [`GameButton`](src/components/ui/GameButton.vue), [`Modal`](src/components/ui/Modal.vue), [`RoundedPanel`](src/components/ui/RoundedPanel.vue), [`Toast`](src/components/ui/Toast.vue), [`StatBar`](src/components/game/StatBar.vue)
- ✅ **Layout-компоненты** — [`GameLayout`](src/components/layout/GameLayout.vue), [`BottomNav`](src/components/layout/BottomNav.vue)
- ✅ **Типы TypeScript** — [`domain/ecs/types/index.ts`](src/domain/ecs/types/index.ts), [`domain/balance/types/index.ts`](src/domain/balance/types/index.ts)
- ✅ **Тесты** — все тесты в [`test/`](test/)

### Что меняется

- 🔄 **Роутинг** — ручная конфигурация → файловая структура `pages/`
- 🔄 **Конфигурация** — `vite.config.ts` → `nuxt.config.ts`
- 🔄 **Точка входа** — `src/main.ts` → `app.vue`
- 🔄 **Плагины** — ручная регистрация → `plugins/` директория
- 🔄 **Middleware** — ручная реализация → `middleware/` директория
- 🔄 **Оптимизация** — ручная настройка → встроенные модули Nuxt
- 🔄 **Импорты** — явные импорты → автоимпорты компонентов, composables, stores
- 🔄 **CSS** — `src/style.css` → `assets/css/main.css`
- 🔄 **HTML** — `index.html` → `app.vue` + `nuxt.config.ts`
- 🔄 **TypeScript** — `tsconfig.json` → интеграция с Nuxt

---

## 2. Анализ текущей архитектуры

### 2.1. Инвентаризация файлов

| Категория | Файлов | LOC (оценка) | Что делать |
|-----------|--------|-------------|------------|
| ECS-ядро (`src/ecs/`) | 20 | ~2500 | Переместить в `utils/ecs/` |
| Vue-страницы (`src/pages/`) | 15 | ~4000 | Переместить в `pages/` (Nuxt) |
| Vue-компоненты (`src/components/`) | 10 | ~800 | Переместить в `components/` (Nuxt) |
| Composables (`src/composables/`) | 5 | ~400 | Переместить в `composables/` (Nuxt) |
| Stores (`src/stores/`) | 1 | ~476 | Переместить в `stores/` (Nuxt) |
| Router (`src/router/`) | 1 | ~80 | Удалить (автоматическая генерация) |
| Balance (`src/balance/`) | 20 | ~1500 | Переместить в `utils/balance/` |
| Shared (`src/shared/`) | 4 | ~300 | Переместить в `utils/shared/` |
| Types (`src/domain/*/types/`) | 2 | ~268 | Использовать доменные типы на месте |
| Стили (`src/style.css`) | 1 | ~117 | Переместить в `assets/css/main.css` |
| Точка входа (`src/main.ts`) | 1 | ~23 | Удалить (заменить на `app.vue`) |
| Корневой компонент (`src/App.vue`) | 1 | ~37 | Переместить в `app.vue` |
| HTML (`index.html`) | 1 | ~12 | Удалить (заменить на `app.vue`) |
| Конфигурация (`vite.config.ts`) | 1 | ~26 | Заменить на `nuxt.config.ts` |
| Конфигурация (`tsconfig.json`) | 1 | ~25 | Обновить для Nuxt |
| Тесты (`test/`) | 7 | ~800 | Переместить в `test/` (Nuxt) |
| **Итого** | **91** | **~11344** | |

### 2.2. Текущая архитектура

```
src/
├── main.ts                    # Точка входа Vue приложения
├── App.vue                    # Корневой компонент
├── router/
│   └── index.ts               # Ручная конфигурация роутинга (15 маршрутов)
├── stores/
│   └── game.store.ts          # Pinia store с ECS интеграцией (~476 LOC)
├── composables/
│   ├── useActions.ts          # Логика действий (~59 LOC)
│   ├── useActivityLog.ts      # Логика журнала событий
│   ├── useEvents.ts           # Логика событий
│   ├── useFinance.ts          # Логика финансов
│   └── useToast.ts           # Логика уведомлений (~59 LOC)
├── pages/
│   ├── StartPage.vue          # Стартовая страница
│   ├── MainPage.vue           # Главная страница игры (~551 LOC)
│   ├── RecoveryPage.vue       # Страница восстановления
│   ├── CareerPage.vue         # Страница карьеры
│   ├── FinancePage.vue        # Страница финансов
│   ├── EducationPage.vue      # Страница образования
│   ├── EventQueuePage.vue     # Страница очереди событий
│   ├── SkillsPage.vue         # Страница навыков
│   ├── HobbyPage.vue          # Страница хобби
│   ├── HealthPage.vue         # Страница здоровья
│   ├── SelfdevPage.vue        # Страница саморазвития
│   ├── ShopPage.vue           # Страница магазина
│   ├── SocialPage.vue         # Страница социальных связей
│   ├── ActivityLogPage.vue    # Страница журнала событий
│   └── HomePage.vue           # Страница дома
├── components/
│   ├── game/
│   │   └── StatBar.vue        # Компонент шкалы статов
│   ├── layout/
│   │   ├── GameLayout.vue     # Компонент макета игры (~80 LOC)
│   │   └── BottomNav.vue      # Нижняя навигация
│   └── ui/
│       ├── GameButton.vue     # Кнопка игры
│       ├── Modal.vue          # Модальное окно (~117 LOC)
│       ├── ProgressBar.vue    # Прогресс-бар
│       ├── RoundedPanel.vue   # Скруглённая панель
│       ├── Toast.vue          # Уведомление
│       └── Tooltip.vue        # Всплывающая подсказка
├── ecs/
│   ├── world.ts               # ECS World (~210 LOC)
│   ├── components/
│   │   └── index.ts           # Компоненты ECS
│   └── systems/
│       ├── ActionSystem.ts    # Система действий
│       ├── ActivityLogSystem.ts
│       ├── CareerProgressSystem.ts
│       ├── EducationSystem.ts
│       ├── EventChoiceSystem.ts
│       ├── EventHistorySystem.ts
│       ├── EventQueueSystem.ts
│       ├── FinanceActionSystem.ts
│       ├── InvestmentSystem.ts
│       ├── MigrationSystem.ts
│       ├── MonthlySettlementSystem.ts
│       ├── PersistenceSystem.ts
│       ├── RecoverySystem.ts
│       ├── SkillsSystem.ts
│       ├── StatsSystem.ts
│       ├── TimeSystem.ts
│       └── WorkPeriodSystem.ts
├── balance/
│   ├── actions/               # Действия по категориям (~222 действия)
│   │   ├── index.ts          # Экспорт всех действий (~83 LOC)
│   │   ├── shop-actions.ts
│   │   ├── fun-actions.ts
│   │   ├── home-actions.ts
│   │   ├── social-actions.ts
│   │   ├── education-actions.ts
│   │   ├── finance-actions.ts
│   │   ├── career-actions.ts
│   │   ├── hobby-actions.ts
│   │   ├── health-actions.ts
│   │   └── selfdev-actions.ts
│   ├── career-jobs.ts         # Работа и карьера
│   ├── default-save.ts        # Сохранение по умолчанию
│   ├── education-paths.ts     # Пути образования
│   ├── education-programs.ts  # Программы образования
│   ├── education-ranks.ts     # Ранги образования
│   ├── game-events.ts         # Игровые события
│   ├── hourly-rates.ts        # Почасовые ставки
│   ├── housing-levels.ts       # Уровни жилья
│   ├── index.ts               # Экспорт баланса
│   ├── initial-save.ts        # Начальное сохранение
│   ├── monthly-expenses-defaults.ts
│   ├── recovery-tabs.ts       # Вкладки восстановления
│   ├── skill-modifiers.ts     # Модификаторы навыков
│   ├── skills-constants.ts    # Константы навыков
│   ├── work-economy.ts        # Экономика работы
│   └── work-result-tiers.ts   # Уровни результатов работы
├── shared/
│   ├── activity-log-formatters.ts
│   ├── constants.ts           # Константы
│   ├── skill-tooltip-content.ts
│   └── stat-changes-format.ts
└── types/
    ├── balance.ts             # Типы баланса
    └── ecs.ts                 # Типы ECS (~268 LOC)
```

### 2.3. Зависимости

```json
{
  "dependencies": {
    "pinia": "^3.0.4",
    "vue": "^3.5.32",
    "vue-router": "^4.6.4"
  },
  "devDependencies": {
    "@types/node": "^25.5.2",
    "@vitejs/plugin-vue": "^6.0.5",
    "typescript": "^6.0.2",
    "vite": "^5.4.10",
    "vitest": "^4.1.4",
    "vue-tsc": "^3.2.6"
  }
}
```

### 2.4. Конфигурация Vite

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
  test: {
    globals: true,
    environment: 'node',
  },
})
```

### 2.5. Конфигурация TypeScript

```json
{
  "compilerOptions": {
    "ignoreDeprecations": "6.0",
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "noEmit": true,
    "allowJs": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "types": ["vite/client", "vitest/globals"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "exclude": ["node_modules", "dist"]
}
```

### 2.6. Стили (CSS Design System)

```css
/* src/style.css */
:root {
  /* Colors — Warm Cozy Minimalism palette */
  --color-bg: #f8f4ed;
  --color-bg-light: #fffaf3;
  --color-accent: #e8b4a0;
  --color-accent-soft: #f3d3c6;
  --color-sage: #a8caba;
  --color-blue: #6d9dc5;
  --color-neutral: #d9d0c3;
  --color-text: #3c2f2f;
  --color-white: #ffffff;
  --color-panel: #fffcf7;
  --color-line: #e6ddd2;
  --color-shadow: #d9cfc2;
  --color-success: #4ebf7a;
  --color-danger: #d14d4d;

  /* Typography */
  --font-main: 'Inter', 'Poppins', Arial, sans-serif;

  /* Spacing */
  --radius-panel: 22px;
  --radius-button: 14px;
  --radius-small: 10px;

  /* Shadows */
  --shadow-panel: 8px 10px 0 rgba(217, 207, 194, 0.22);
  --shadow-button: 0 2px 8px rgba(60, 47, 47, 0.08);

  /* Transitions */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.25s ease;
}
```

### 2.7. Роутинг (Vue Router)

```typescript
// src/router/index.ts
export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'start', component: () => import('@/pages/StartPage.vue') },
  { path: '/game', name: 'main', component: () => import('@/pages/MainPage.vue') },
  { path: '/recovery', name: 'recovery', component: () => import('@/pages/RecoveryPage.vue') },
  { path: '/career', name: 'career', component: () => import('@/pages/CareerPage.vue') },
  { path: '/finance', name: 'finance', component: () => import('@/pages/FinancePage.vue') },
  { path: '/education', name: 'education', component: () => import('@/pages/EducationPage.vue') },
  { path: '/events', name: 'events', component: () => import('@/pages/EventQueuePage.vue') },
  { path: '/skills', name: 'skills', component: () => import('@/pages/SkillsPage.vue') },
  { path: '/hobby', name: 'hobby', component: () => import('@/pages/HobbyPage.vue') },
  { path: '/health', name: 'health', component: () => import('@/pages/HealthPage.vue') },
  { path: '/selfdev', name: 'selfdev', component: () => import('@/pages/SelfdevPage.vue') },
  { path: '/shop', name: 'shop', component: () => import('@/pages/ShopPage.vue') },
  { path: '/social', name: 'social', component: () => import('@/pages/SocialPage.vue') },
  { path: '/home', name: 'home', component: () => import('@/pages/HomePage.vue') },
  { path: '/activity', name: 'activity', component: () => import('@/pages/ActivityLogPage.vue') },
]
```

---

## 3. Варианты архитектуры Nuxt 4

### Вариант 1: SPA Mode (Single Page Application)

**Описание:**
- Nuxt 4 в режиме SPA (без SSR)
- Все рендеринг происходит на клиенте
- Минимальные изменения в логике приложения

**Преимущества:**
- ✅ Минимальные изменения в коде
- ✅ ECS World остаётся на клиенте
- ✅ Простая миграция
- ✅ Быстрый старт разработки
- ✅ localStorage работает как раньше
- ✅ Нет необходимости адаптировать ECS для SSR

**Недостатки:**
- ❌ Нет преимуществ SSR
- ❌ Нет SEO оптимизации
- ❌ Медленная загрузка на слабых устройствах
- ❌ Нет предварительного рендеринга

**Подходит для:**
- Игр, где не нужен SSR
- Приложений с сложной клиентской логикой
- Быстрой миграции без переписывания архитектуры
- Проектов с localStorage

---

### Вариант 2: Hybrid Mode (SPA + Server API)

**Описание:**
- Nuxt 4 в режиме SPA
- ECS World и бизнес-логика на сервере через Nitro
- API endpoints для игровых операций

**Преимущества:**
- ✅ Чистое разделение клиент/сервер
- ✅ Безопасность игровой логики
- ✅ Возможность мультиплеера в будущем
- ✅ Оптимизация загрузки
- ✅ Защита от читерства

**Недостатки:**
- ❌ Сложная миграция ECS
- ❌ Требует переписывания store
- ❌ Дополнительная сложность
- ❌ localStorage не подходит для серверного состояния
- ❌ Требует серверной инфраструктуры

**Подходит для:**
- Игр с мультиплеером
- Приложений с важной безопасностью
- Будущего масштабирования
- Проектов с серверной валидацией

---

### Вариант 3: SSR Mode (Server-Side Rendering)

**Описание:**
- Полный SSR режим Nuxt 4
- Гидратация на клиенте
- `useState()` для SSR-совместимого состояния

**Преимущества:**
- ✅ Быстрая загрузка
- ✅ SEO оптимизация
- ✅ Лучший UX на медленных устройствах
- ✅ Современный подход
- ✅ Предварительный рендеринг

**Недостатки:**
- ❌ Сложная миграция ECS
- ❌ Требует адаптации localStorage
- ❌ Дополнительная сложность
- ❌ ECS World должен быть SSR-совместимым
- ❌ localStorage не работает на сервере

**Подходит для:**
- Приложений с важным SEO
- Игр с социальными функциями
- Современных веб-приложений
- Проектов с высокой нагрузкой

---

### Вариант 4: SSG Mode (Static Site Generation)

**Описание:**
- Статическая генерация страниц
- Пререндеринг основных страниц
- Динамический контент через API

**Преимущества:**
- ✅ Максимальная производительность
- ✅ Простое хостинг (CDN)
- ✅ SEO оптимизация
- ✅ Низкая стоимость хостинга
- ✅ Быстрая загрузка

**Недостатки:**
- ❌ Не подходит для динамических игр
- ❌ Сложная миграция ECS
- ❌ Ограничения для динамического контента
- ❌ Требует адаптации localStorage
- ❌ Не подходит для игр с состоянием

**Подходит для:**
- Статических сайтов
- Документации
- Маркетинговых страниц
- Лендингов

---

## 4. Рекомендуемая архитектура

### Выбор: Вариант 1 — SPA Mode

**Обоснование:**

1. **Тип приложения:** Game Life — это клиентская игра с локальным сохранением состояния
2. **ECS архитектура:** Вся игровая логика уже реализована на клиенте через ECS World
3. **Сохранения:** Используется localStorage, который работает только на клиенте
4. **Минимальные изменения:** SPA режим требует минимальных изменений в коде
5. **Быстрая миграция:** Можно мигрировать поэтапно без остановки разработки
6. **Будущая гибкость:** SPA режим можно легко расширить до Hybrid или SSR в будущем
7. **Отсутствие требований SEO:** Игра не требует SEO оптимизации
8. **Отсутствие требований SSR:** Игра не требует серверного рендеринга

### Архитектурная схема

```
nuxt-project/
├── app.vue                    # Корневой компонент Nuxt
├── nuxt.config.ts             # Конфигурация Nuxt
├── pages/                     # Страницы (автоматический роутинг)
│   ├── index.vue              # Стартовая страница (/)
│   ├── game/
│   │   ├── index.vue          # Главная страница игры (/game)
│   │   ├── recovery.vue      # Страница восстановления (/game/recovery)
│   │   ├── career.vue        # Страница карьеры (/game/career)
│   │   ├── finance.vue       # Страница финансов (/game/finance)
│   │   ├── education.vue     # Страница образования (/game/education)
│   │   ├── events.vue        # Страница очереди событий (/game/events)
│   │   ├── skills.vue        # Страница навыков (/game/skills)
│   │   ├── hobby.vue         # Страница хобби (/game/hobby)
│   │   ├── health.vue        # Страница здоровья (/game/health)
│   │   ├── selfdev.vue       # Страница саморазвития (/game/selfdev)
│   │   ├── shop.vue          # Страница магазина (/game/shop)
│   │   ├── social.vue        # Страница социальных связей (/game/social)
│   │   ├── activity.vue      # Страница журнала событий (/game/activity)
│   │   └── home.vue          # Страница дома (/game/home)
├── components/                # Компоненты (автоимпорт)
│   ├── game/
│   │   └── StatBar.vue
│   ├── layout/
│   │   ├── GameLayout.vue
│   │   └── BottomNav.vue
│   └── ui/
│       ├── GameButton.vue
│       ├── Modal.vue
│       ├── ProgressBar.vue
│       ├── RoundedPanel.vue
│       ├── Toast.vue
│       └── Tooltip.vue
├── composables/               # Composables (автоимпорт)
│   ├── useActions.ts
│   ├── useActivityLog.ts
│   ├── useEvents.ts
│   ├── useFinance.ts
│   └── useToast.ts
├── stores/                    # Pinia stores (автоимпорт)
│   └── game.ts                # useGameStore
├── utils/                     # Утилиты
│   ├── ecs/                   # ECS ядро
│   │   ├── world.ts
│   │   ├── components/
│   │   │   └── index.ts
│   │   └── systems/
│   │       ├── ActionSystem.ts
│   │       ├── ActivityLogSystem.ts
│   │       ├── CareerProgressSystem.ts
│   │       ├── EducationSystem.ts
│   │       ├── EventChoiceSystem.ts
│   │       ├── EventHistorySystem.ts
│   │       ├── EventQueueSystem.ts
│   │       ├── FinanceActionSystem.ts
│   │       ├── InvestmentSystem.ts
│   │       ├── MigrationSystem.ts
│   │       ├── MonthlySettlementSystem.ts
│   │       ├── PersistenceSystem.ts
│   │       ├── RecoverySystem.ts
│   │       ├── SkillsSystem.ts
│   │       ├── StatsSystem.ts
│   │       ├── TimeSystem.ts
│   │       └── WorkPeriodSystem.ts
│   ├── balance/               # Баланс игры
│   │   ├── actions/
│   │   │   ├── index.ts
│   │   │   ├── shop-actions.ts
│   │   │   ├── fun-actions.ts
│   │   │   ├── home-actions.ts
│   │   │   ├── social-actions.ts
│   │   │   ├── education-actions.ts
│   │   │   ├── finance-actions.ts
│   │   │   ├── career-actions.ts
│   │   │   ├── hobby-actions.ts
│   │   │   ├── health-actions.ts
│   │   │   └── selfdev-actions.ts
│   │   ├── career-jobs.ts
│   │   ├── default-save.ts
│   │   ├── education-paths.ts
│   │   ├── education-programs.ts
│   │   ├── education-ranks.ts
│   │   ├── game-events.ts
│   │   ├── hourly-rates.ts
│   │   ├── housing-levels.ts
│   │   ├── index.ts
│   │   ├── initial-save.ts
│   │   ├── monthly-expenses-defaults.ts
│   │   ├── recovery-tabs.ts
│   │   ├── skill-modifiers.ts
│   │   ├── skills-constants.ts
│   │   ├── work-economy.ts
│   │   └── work-result-tiers.ts
│   └── shared/                # Общие утилиты
│       ├── activity-log-formatters.ts
│       ├── constants.ts
│       ├── skill-tooltip-content.ts
│       └── stat-changes-format.ts
├── types/                     # TypeScript типы
│   ├── balance.ts
│   └── ecs.ts
├── plugins/                   # Nuxt плагины
│   └── pinia.ts               # Инициализация Pinia
├── middleware/                # Nuxt middleware
│   └── game-init.ts           # Инициализация игры
├── assets/                    # Статические ресурсы
│   ├── css/
│   │   └── main.css           # Глобальные стили
│   └── images/
├── public/                    # Публичные файлы
│   └── image/
└── test/                      # Тесты
    ├── ecs/
    │   ├── ActionSystem.test.ts
    │   ├── ActivityLogSystem.test.ts
    │   ├── EducationSystem.test.ts
    │   ├── hourly-rates.test.ts
    │   ├── MonthlySettlementSystem.test.ts
    │   ├── smoke-tests.test.ts
    │   ├── StatsSystem.test.ts
    │   └── WorkPeriodSystem.test.ts
    └── ...
```

---

## 5. Пошаговый план миграции

### Этап 1: Подготовка (1-2 дня)

**Задачи:**
1. Создать новую ветку `feature/nuxt4-migration`
2. Установить Nuxt 4: `npx nuxi@latest init game-life-nuxt4`
3. Настроить TypeScript в `nuxt.config.ts`
4. Создать базовую структуру директорий
5. Скопировать `public/` директорию
6. Настроить `.env` файлы
7. Настроить `.gitignore` для Nuxt

**Проверка:**
- [ ] Nuxt проект запускается (`npm run dev`)
- [ ] TypeScript работает без ошибок
- [ ] Структура директорий создана
- [ ] `.env` файлы настроены
- [ ] `.gitignore` обновлён

---

### Этап 2: Миграция утилит и ECS (2-3 дня)

**Задачи:**
1. Переместить `src/ecs/` → `utils/ecs/`
2. Переместить `src/balance/` → `utils/balance/`
3. Переместить `src/shared/` → `utils/shared/`
4. Использовать доменные типы: `src/domain/balance/types` и `src/domain/ecs/types`
5. Обновить импорты во всех файлах
6. Обновить пути в `tsconfig.json`
7. Запустить тесты ECS
8. Проверить работу ECS World

**Проверка:**
- [ ] Все импорты обновлены
- [ ] Тесты ECS проходят
- [ ] TypeScript не выдаёт ошибок
- [ ] ECS World работает корректно

---

### Этап 3: Миграция composables (1 день)

**Задачи:**
1. Переместить `src/composables/` → `composables/`
2. Убрать явные импорты (автоимпорт Nuxt)
3. Проверить работу composables
4. Проверить работу `useToast` (глобальное состояние)

**Проверка:**
- [ ] Composables работают
- [ ] Автоимпорт работает
- [ ] TypeScript не выдаёт ошибок
- [ ] `useToast` работает корректно

---

### Этап 4: Миграция компонентов (1-2 дня)

**Задачи:**
1. Переместить `src/components/` → `components/`
2. Обновить импорты в компонентах
3. Проверить работу компонентов
4. Проверить работу `Teleport` в `Modal.vue`
5. Проверить работу `Transition` в компонентах

**Проверка:**
- [ ] Все компоненты работают
- [ ] Автоимпорт компонентов работает
- [ ] TypeScript не выдаёт ошибок
- [ ] `Teleport` работает корректно
- [ ] `Transition` работает корректно

---

### Этап 5: Миграция store (1 день)

**Задачи:**
1. Переместить `src/stores/game.store.ts` → `stores/game.ts`
2. Создать плагин `plugins/pinia.ts` для инициализации Pinia
3. Обновить импорты в store
4. Проверить работу store
5. Проверить работу `shallowRef` для ECS World

**Проверка:**
- [ ] Store работает
- [ ] Pinia инициализируется корректно
- [ ] TypeScript не выдаёт ошибок
- [ ] `shallowRef` работает корректно

---

### Этап 6: Миграция страниц (2-3 дня)

**Задачи:**
1. Переместить `src/pages/StartPage.vue` → `pages/index.vue`
2. Переместить остальные страницы в `pages/game/`
3. Обновить роутинг в компонентах
4. Создать middleware для инициализации игры
5. Обновить навигацию в `BottomNav.vue`
6. Обновить навигацию в `GameLayout.vue`
7. Проверить работу всех переходов

**Проверка:**
- [ ] Все страницы работают
- [ ] Роутинг работает корректно
- [ ] Навигация работает
- [ ] TypeScript не выдаёт ошибок
- [ ] Middleware работает корректно

---

### Этап 7: Миграция стилей (1 день)

**Задачи:**
1. Переместить `src/style.css` → `assets/css/main.css`
2. Обновить импорт стилей в `nuxt.config.ts`
3. Проверить отображение стилей
4. Проверить работу CSS переменных
5. Проверить работу utility classes

**Проверка:**
- [ ] Стили применяются корректно
- [ ] Визуальный стиль сохранён
- [ ] CSS переменные работают
- [ ] Utility classes работают

---

### Этап 8: Миграция тестов (1-2 дня)

**Задачи:**
1. Переместить `test/` → `test/`
2. Обновить конфигурацию Vitest
3. Обновить импорты в тестах
4. Обновить пути в тестах
5. Запустить все тесты
6. Проверить покрытие кода

**Проверка:**
- [ ] Все тесты проходят
- [ ] Покрытие кода сохранено
- [ ] TypeScript не выдаёт ошибок в тестах

---

### Этап 9: Оптимизация и рефакторинг (2-3 дня)

**Задачи:**
1. Настроить оптимизацию изображений (`@nuxt/image`)
2. Настроить PWA (опционально)
3. Оптимизировать бандл
4. Добавить аналитику (опционально)
5. Обновить документацию
6. Настроить CI/CD
7. Настроить линтеры и форматтеры

**Проверка:**
- [ ] Бандл оптимизирован
- [ ] Производительность улучшена
- [ ] Документация обновлена
- [ ] CI/CD настроен
- [ ] Линтеры и форматтеры настроены

---

### Этап 10: Тестирование и деплой (1-2 дня)

**Задачи:**
1. Полное тестирование приложения
2. Фикс багов
3. Подготовка к продакшену
4. Деплой на хостинг
5. Мониторинг
6. Настройка логирования

**Проверка:**
- [ ] Все функции работают
- [ ] Нет критических багов
- [ ] Приложение задеплоено
- [ ] Мониторинг настроен
- [ ] Логирование настроено

---

## 6. Карта соответствия: Vue 3 → Nuxt 4

| Vue 3 + Vite | Nuxt 4 | Примечания |
|--------------|--------|------------|
| `src/main.ts` | `app.vue` | Точка входа приложения |
| `src/App.vue` | `app.vue` | Корневой компонент |
| `src/router/index.ts` | `pages/` | Автоматическая генерация роутинга |
| `src/stores/` | `stores/` | Автоимпорт Pinia stores |
| `src/composables/` | `composables/` | Автоимпорт composables |
| `src/components/` | `components/` | Автоимпорт компонентов |
| `src/pages/` | `pages/` | Структура страниц |
| `vite.config.ts` | `nuxt.config.ts` | Конфигурация |
| `src/style.css` | `assets/css/main.css` | Глобальные стили |
| `public/` | `public/` | Публичные файлы |
| `index.html` | `app.vue` | HTML шаблон |
| `vue-router` | Встроенный роутинг | Файловая структура |
| Ручные импорты | Автоимпорты | Компоненты, composables, stores |
| `useRouter()` | `useRouter()` | Nuxt Router |
| `useRoute()` | `useRoute()` | Nuxt Route |
| `defineComponent()` | Не требуется | Автоимпорт |
| `ref()`, `computed()` | Автоимпорт | Vue Composition API |
| `onMounted()` | Автоимпорт | Vue Lifecycle Hooks |
| `watch()` | Автоимпорт | Vue Watchers |
| `Teleport` | Автоимпорт | Vue Teleport |
| `Transition` | Автоимпорт | Vue Transition |
| `tsconfig.json` | `nuxt.config.ts` + `tsconfig.json` | Конфигурация TypeScript |
| `.env` | `.env` | Переменные окружения |
| `vitest.config.ts` | `nuxt.config.ts` | Конфигурация тестов |

---

## 7. Детальная миграция по модулям

### 7.1. Миграция ECS World

**Текущее расположение:** `src/ecs/world.ts`

**Новое расположение:** `utils/ecs/world.ts`

**Изменения:**
- Обновить импорты в файлах, которые используют ECS World
- Обновить пути в `tsconfig.json`
- Проверить работу `EventTarget` в Nuxt

**Пример обновления импортов:**

```typescript
// До
import { ECSWorld } from '@/ecs/world'

// После
import { ECSWorld } from '~/utils/ecs/world'
```

---

### 7.2. Миграция ECS Systems

**Текущее расположение:** `src/ecs/systems/`

**Новое расположение:** `utils/ecs/systems/`

**Изменения:**
- Обновить импорты в файлах, которые используют ECS Systems
- Обновить импорты в `stores/game.ts`
- Проверить работу всех систем

**Пример обновления импортов:**

```typescript
// До
import { StatsSystem } from '@/ecs/systems/StatsSystem'

// После
import { StatsSystem } from '~/utils/ecs/systems/StatsSystem'
```

---

### 7.3. Миграция ECS Components

**Текущее расположение:** `src/ecs/components/index.ts`

**Новое расположение:** `utils/ecs/components/index.ts`

**Изменения:**
- Обновить импорты в файлах, которые используют ECS Components
- Проверить работу всех компонентов

**Пример обновления импортов:**

```typescript
// До
import { PLAYER_ENTITY, STATS_COMPONENT } from '@/ecs/components/index'

// После
import { PLAYER_ENTITY, STATS_COMPONENT } from '~/utils/ecs/components/index'
```

---

### 7.4. Миграция Balance Actions

**Текущее расположение:** `src/balance/actions/`

**Новое расположение:** `utils/balance/actions/`

**Изменения:**
- Обновить импорты в `composables/useActions.ts`
- Обновить импорты в `stores/game.ts`
- Проверить работу всех действий

**Пример обновления импортов:**

```typescript
// До
import { getActionById, getActionsByCategory } from '@/balance/actions'

// После
import { getActionById, getActionsByCategory } from '~/utils/balance/actions'
```

---

### 7.5. Миграция Balance Data

**Текущее расположение:** `src/balance/`

**Новое расположение:** `utils/balance/`

**Изменения:**
- Обновить импорты в `stores/game.ts`
- Обновить импорты в `composables/useActions.ts`
- Проверить работу всех данных баланса

**Пример обновления импортов:**

```typescript
// До
import { DEFAULT_SAVE } from '@/balance/default-save'

// После
import { DEFAULT_SAVE } from '~/utils/balance/default-save'
```

---

### 7.6. Миграция Shared Utils

**Текущее расположение:** `src/shared/`

**Новое расположение:** `utils/shared/`

**Изменения:**
- Обновить импорты во всех файлах, которые используют shared utils
- Проверить работу всех утилит

**Пример обновления импортов:**

```typescript
// До
import { formatMoney } from '@/shared/constants'

// После
import { formatMoney } from '~/utils/shared/constants'
```

---

### 7.7. Миграция Types

**Текущее расположение:** `src/domain/*/types/`

**Новое расположение:** без переноса (типы уже находятся в доменных модулях)

**Изменения:**
- Обновить импорты во всех файлах, которые используют типы
- Проверить работу всех типов

**Пример обновления импортов:**

```typescript
// Было (legacy)
import type { StatsComponent } from '../types/ecs'

// После
import type { StatsComponent } from '@/domain/ecs/types'
```

---

### 7.8. Миграция Composables

**Текущее расположение:** `src/composables/`

**Новое расположение:** `composables/`

**Изменения:**
- Убрать явные импорты (автоимпорт Nuxt)
- Проверить работу всех composables
- Проверить работу `useToast` (глобальное состояние)

**Пример до и после:**

```typescript
// До
import { useActions } from '@/composables/useActions'

export default {
  setup() {
    const { canExecute, executeAction } = useActions()
    return { canExecute, executeAction }
  }
}

// После (автоимпорт)
export default {
  setup() {
    const { canExecute, executeAction } = useActions()
    return { canExecute, executeAction }
  }
}
```

---

### 7.9. Миграция Store

**Текущее расположение:** `src/stores/game.store.ts`

**Новое расположение:** `stores/game.ts`

**Изменения:**
- Обновить импорты в store
- Создать плагин `plugins/pinia.ts` для инициализации Pinia
- Проверить работу store
- Проверить работу `shallowRef` для ECS World

**Пример плагина Pinia:**

```typescript
// plugins/pinia.ts
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  // Pinia автоматически инициализируется Nuxt
  // Дополнительная логика при необходимости
})
```

---

### 7.10. Миграция Pages

**Текущее расположение:** `src/pages/`

**Новое расположение:** `pages/`

**Изменения:**
- Переместить `StartPage.vue` → `pages/index.vue`
- Переместить остальные страницы в `pages/game/`
- Обновить роутинг в компонентах
- Обновить навигацию в `BottomNav.vue`
- Обновить навигацию в `GameLayout.vue`

**Пример обновления роутинга:**

```typescript
// До
import { useRouter } from 'vue-router'

export default {
  setup() {
    const router = useRouter()
    function navigateTo(route: string) {
      router.push(`/${route}`)
    }
    return { navigateTo }
  }
}

// После (использование navigateTo из Nuxt)
export default {
  setup() {
    function navigateTo(route: string) {
      navigateTo(`/${route}`)
    }
    return { navigateTo }
  }
}
```

---

### 7.11. Миграция Components

**Текущее расположение:** `src/components/`

**Новое расположение:** `components/`

**Изменения:**
- Убрать явные импорты (автоимпорт Nuxt)
- Проверить работу всех компонентов
- Проверить работу `Teleport` в `Modal.vue`
- Проверить работу `Transition` в компонентах

**Пример до и после:**

```vue
<!-- До -->
<script setup lang="ts">
import Modal from '@/components/ui/Modal.vue'
import GameButton from '@/components/ui/GameButton.vue'
</script>

<template>
  <Modal :is-open="isOpen" @close="close">
    <GameButton label="OK" @click="close" />
  </Modal>
</template>

<!-- После (автоимпорт) -->
<script setup lang="ts">
// Импорты не требуются
</script>

<template>
  <Modal :is-open="isOpen" @close="close">
    <GameButton label="OK" @click="close" />
  </Modal>
</template>
```

---

### 7.12. Миграция Styles

**Текущее расположение:** `src/style.css`

**Новое расположение:** `assets/css/main.css`

**Изменения:**
- Обновить импорт стилей в `nuxt.config.ts`
- Проверить отображение стилей
- Проверить работу CSS переменных
- Проверить работу utility classes

**Пример конфигурации:**

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['~/assets/css/main.css'],
})
```

---

### 7.13. Миграция Tests

**Текущее расположение:** `test/`

**Новое расположение:** `test/`

**Изменения:**
- Обновить конфигурацию Vitest
- Обновить импорты в тестах
- Обновить пути в тестах
- Запустить все тесты

**Пример обновления импортов:**

```typescript
// До
import { ECSWorld } from '@/ecs/world'
import { DEFAULT_SAVE } from '@/balance/default-save'

// После
import { ECSWorld } from '~/utils/ecs/world'
import { DEFAULT_SAVE } from '~/utils/balance/default-save'
```

---

## 8. Конфигурация Nuxt 4

### 8.1. Основная конфигурация

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // Режим SPA
  ssr: false,
  
  // TypeScript
  typescript: {
    strict: true,
    typeCheck: true,
  },

  // Автоимпорты
  imports: {
    dirs: ['composables', 'utils'],
  },

  // CSS
  css: ['~/assets/css/main.css'],

  // Модули
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/color-mode',
  ],

  // Vite
  vite: {
    resolve: {
      alias: {
        '@': '<rootDir>',
      },
    },
  },

  // DevTools
  devtools: { enabled: true },

  // App config
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

  // Runtime config
  runtimeConfig: {
    public: {
      appName: 'Game Life',
    },
  },

  // Nitro (для будущей гибкости)
  nitro: {
    experimental: {
      // Опции для будущего расширения
    },
  },
})
```

### 8.2. Конфигурация TypeScript

```json
{
  "extends": "./.nuxt/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "types": ["vitest/globals"]
  }
}
```

### 8.3. Конфигурация Vitest

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // ... другая конфигурация
  
  vitest: {
    globals: true,
    environment: 'node',
  },
})
```

### 8.4. Конфигурация .env

```bash
# .env
NUXT_PUBLIC_APP_NAME=Game Life
NUXT_PUBLIC_API_URL=https://api.example.com
```

### 8.5. Конфигурация .gitignore

```gitignore
# Nuxt
.nuxt
.output
.data

# Node
node_modules

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode
.idea
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
```

---

## 9. Риски и митигация

### Риск 1: Потеря данных при миграции

**Описание:** При миграции может быть потеряна часть данных или логики.

**Митигация:**
- Создать полную резервную копию проекта
- Использовать git для контроля версий
- Тщательно тестировать каждый этап миграции
- Сохранять работающую версию до полной проверки
- Создать feature branch для миграции

---

### Риск 2: Проблемы с TypeScript

**Описание:** Nuxt 4 может иметь другие требования к TypeScript.

**Митигация:**
- Настроить строгий режим TypeScript
- Использовать `vue-tsc` для проверки типов
- Постепенно исправлять ошибки типов
- Обратиться к документации Nuxt 4
- Использовать `@ts-ignore` только в крайних случаях

---

### Риск 3: Проблемы с ECS

**Описание:** ECS World может не работать корректно в Nuxt.

**Митигация:**
- Тестировать ECS на каждом этапе
- Использовать `onMounted()` для инициализации ECS
- Проверить работу localStorage
- Создать fallback для инициализации
- Изолировать ECS от SSR (если потребуется в будущем)

---

### Риск 4: Проблемы с роутингом

**Описание:** Автоматическая генерация роутинга может отличаться от ручной.

**Митигация:**
- Внимательно спланировать структуру `pages/`
- Использовать middleware для защиты роутов
- Тестировать все переходы
- Документировать структуру роутинга
- Использовать `definePageMeta` для мета-информации

---

### Риск 5: Проблемы с производительностью

**Описание:** Nuxt 4 может работать медленнее на некоторых устройствах.

**Митигация:**
- Оптимизировать бандл
- Использовать lazy loading для компонентов
- Настроить кэширование
- Профилировать производительность
- Использовать `@nuxt/image` для оптимизации изображений

---

### Риск 6: Проблемы с автоимпортами

**Описание:** Автоимпорты могут конфликтовать с существующими импортами.

**Митигация:**
- Постепенно убирать явные импорты
- Тестировать автоимпорты на каждом этапе
- Использовать `#imports` для отладки
- Документировать список автоимпортируемых функций

---

### Риск 7: Проблемы с localStorage

**Описание:** localStorage может не работать корректно в Nuxt.

**Митигация:**
- Использовать `onMounted()` для доступа к localStorage
- Создать composable для работы с localStorage
- Проверить работу localStorage в разных браузерах
- Создать fallback для случаев, когда localStorage недоступен

---

### Риск 8: Проблемы с Teleport и Transition

**Описание:** Teleport и Transition могут работать иначе в Nuxt.

**Митигация:**
- Тестировать Teleport в Modal.vue
- Тестировать Transition в компонентах
- Использовать `<ClientOnly>` для компонентов, которые требуют клиентского рендеринга
- Проверить работу анимаций

---

## 10. Оценка трудозатрат

| Этап | Дней | Человеко-часов | Описание |
|------|------|----------------|----------|
| Подготовка | 1-2 | 8-16 | Создание Nuxt проекта, настройка TypeScript |
| Миграция утилит и ECS | 2-3 | 16-24 | Перемещение и обновление импортов |
| Миграция composables | 1 | 8 | Перемещение и автоимпорт |
| Миграция компонентов | 1-2 | 8-16 | Перемещение и автоимпорт |
| Миграция store | 1 | 8 | Перемещение и создание плагина |
| Миграция страниц | 2-3 | 16-24 | Перемещение и обновление роутинга |
| Миграция стилей | 1 | 8 | Перемещение и обновление импортов |
| Миграция тестов | 1-2 | 8-16 | Обновление конфигурации и импортов |
| Оптимизация и рефакторинг | 2-3 | 16-24 | Оптимизация бандла, настройка PWA |
| Тестирование и деплой | 1-2 | 8-16 | Полное тестирование и деплой |
| **Итого** | **13-20** | **96-168** | |

### Детальная разбивка по задачам

| Задача | Оценка (часы) | Приоритет |
|--------|---------------|-----------|
| Создание Nuxt проекта | 2 | Высокий |
| Настройка TypeScript | 2 | Высокий |
| Перемещение ECS | 4 | Высокий |
| Обновление импортов ECS | 4 | Высокий |
| Перемещение Balance | 3 | Высокий |
| Обновление импортов Balance | 3 | Высокий |
| Перемещение Shared | 1 | Средний |
| Обновление импортов Shared | 1 | Средний |
| Перемещение Types | 1 | Средний |
| Обновление импортов Types | 1 | Средний |
| Перемещение Composables | 2 | Высокий |
| Убрать явные импорты Composables | 2 | Высокий |
| Перемещение Components | 2 | Высокий |
| Убрать явные импорты Components | 2 | Высокий |
| Перемещение Store | 2 | Высокий |
| Создание плагина Pinia | 1 | Высокий |
| Перемещение Pages | 4 | Высокий |
| Обновление роутинга | 4 | Высокий |
| Перемещение Styles | 1 | Средний |
| Обновление импортов Styles | 1 | Средний |
| Обновление конфигурации Vitest | 2 | Средний |
| Обновление импортов в тестах | 2 | Средний |
| Оптимизация бандла | 4 | Низкий |
| Настройка PWA | 4 | Низкий |
| Полное тестирование | 8 | Высокий |
| Деплой | 4 | Высокий |
| **Итого** | **64** | |

---

## 11. Критерии приёмки

### Функциональные требования

- [ ] Все игровые механики работают корректно
- [ ] ECS World функционирует как раньше
- [ ] Сохранения и загрузки работают
- [ ] Все страницы доступны и работают
- [ ] Навигация работает корректно
- [ ] Все тесты проходят
- [ ] Все действия (222+) работают корректно
- [ ] Все события работают корректно
- [ ] Все системы ECS работают корректно

### Технические требования

- [ ] TypeScript не выдаёт ошибок
- [ ] Бандл оптимизирован
- [ ] Производительность не хуже, чем на Vue 3 + Vite
- [ ] Приложение работает в современных браузерах
- [ ] Логи не содержат ошибок
- [ ] Автоимпорты работают корректно
- [ ] Роутинг работает корректно
- [ ] Middleware работает корректно

### UX требования

- [ ] Визуальный стиль сохранён
- [ ] Анимации работают корректно
- [ ] Отзывчивость на мобильных устройствах
- [ ] Доступность (a11y) сохранена
- [ ] Время загрузки не увеличилось
- [ ] Плавность анимаций сохранена

### Производительность

- [ ] Время первой загрузки < 2 секунды
- [ ] Время интерактивности < 3 секунды
- [ ] Размер бандла не увеличился более чем на 20%
- [ ] Lighthouse score > 90
- [ ] Нет утечек памяти

### Документация

- [ ] README обновлён
- [ ] Документация по миграции создана
- [ ] Код документирован
- [ ] Конфигурация задокументирована
- [ ] Чек-лист миграции создан

### Тестирование

- [ ] Все существующие тесты проходят
- [ ] Покрытие кода не снизилось
- [ ] Добавлены тесты для новых функций
- [ ] E2E тесты работают (если есть)

---

## 12. Чек-лист миграции

### Подготовка

- [ ] Создана ветка `feature/nuxt4-migration`
- [ ] Создана резервная копия проекта
- [ ] Установлен Nuxt 4
- [ ] Настроен TypeScript
- [ ] Создана структура директорий
- [ ] Скопирована `public/` директория
- [ ] Настроены `.env` файлы
- [ ] Обновлён `.gitignore`

### Миграция утилит и ECS

- [ ] Перемещён `src/ecs/` → `utils/ecs/`
- [ ] Перемещён `src/balance/` → `utils/balance/`
- [ ] Перемещён `src/shared/` → `utils/shared/`
- [ ] Переведены импорты типов на `src/domain/balance/types` и `src/domain/ecs/types`
- [ ] Обновлены импорты во всех файлах
- [ ] Обновлены пути в `tsconfig.json`
- [ ] Тесты ECS проходят
- [ ] ECS World работает корректно

### Миграция Composables

- [ ] Перемещён `src/composables/` → `composables/`
- [ ] Убраны явные импорты
- [ ] Проверена работа `useActions`
- [ ] Проверена работа `useActivityLog`
- [ ] Проверена работа `useEvents`
- [ ] Проверена работа `useFinance`
- [ ] Проверена работа `useToast`
- [ ] Автоимпорт работает

### Миграция Components

- [ ] Перемещён `src/components/` → `components/`
- [ ] Обновлены импорты в компонентах
- [ ] Проверена работа `GameButton`
- [ ] Проверена работа `Modal`
- [ ] Проверена работа `ProgressBar`
- [ ] Проверена работа `RoundedPanel`
- [ ] Проверена работа `Toast`
- [ ] Проверена работа `Tooltip`
- [ ] Проверена работа `StatBar`
- [ ] Проверена работа `GameLayout`
- [ ] Проверена работа `BottomNav`
- [ ] Проверена работа `Teleport`
- [ ] Проверена работа `Transition`
- [ ] Автоимпорт работает

### Миграция Store

- [ ] Перемещён `src/stores/game.store.ts` → `stores/game.ts`
- [ ] Создан плагин `plugins/pinia.ts`
- [ ] Обновлены импорты в store
- [ ] Проверена работа store
- [ ] Проверена работа `shallowRef`
- [ ] Pinia инициализируется корректно

### Миграция Pages

- [ ] Перемещён `src/pages/StartPage.vue` → `pages/index.vue`
- [ ] Перемещены остальные страницы в `pages/game/`
- [ ] Обновлён роутинг в компонентах
- [ ] Создан middleware для инициализации игры
- [ ] Обновлена навигация в `BottomNav.vue`
- [ ] Обновлена навигация в `GameLayout.vue`
- [ ] Проверены все переходы
- [ ] Роутинг работает корректно

### Миграция Styles

- [ ] Перемещён `src/style.css` → `assets/css/main.css`
- [ ] Обновлён импорт стилей в `nuxt.config.ts`
- [ ] Проверено отображение стилей
- [ ] Проверена работа CSS переменных
- [ ] Проверена работа utility classes
- [ ] Визуальный стиль сохранён

### Миграция Tests

- [ ] Перемещён `test/` → `test/`
- [ ] Обновлена конфигурация Vitest
- [ ] Обновлены импорты в тестах
- [ ] Обновлены пути в тестах
- [ ] Запущены все тесты
- [ ] Проверено покрытие кода

### Оптимизация и рефакторинг

- [ ] Настроена оптимизация изображений
- [ ] Настроен PWA (опционально)
- [ ] Оптимизирован бандл
- [ ] Добавлена аналитика (опционально)
- [ ] Обновлена документация
- [ ] Настроен CI/CD
- [ ] Настроены линтеры и форматтеры

### Тестирование и деплой

- [ ] Проведено полное тестирование
- [ ] Исправлены все найденные баги
- [ ] Подготовлен продакшен
- [ ] Задеплоено приложение
- [ ] Настроен мониторинг
- [ ] Настроено логирование

### Финальная проверка

- [ ] Все функции работают
- [ ] Нет критических багов
- [ ] TypeScript не выдаёт ошибок
- [ ] Все тесты проходят
- [ ] Производительность не ухудшилась
- [ ] Визуальный стиль сохранён
- [ ] Документация обновлена
- [ ] Приложение готово к продакшену

---

## Заключение

Миграция на Nuxt 4 в SPA режиме — это оптимальный выбор для проекта Game Life. Она позволит:

1. **Сохранить всю игровую логику** — ECS World и бизнес-логика останутся на клиенте
2. **Упростить разработку** — автоимпорты, файловый роутинг, встроенная оптимизация
3. **Улучшить DX** — лучшие инструменты, современная экосистема
4. **Подготовиться к будущему** — возможность расширения до Hybrid или SSR
5. **Сохранить производительность** — минимальные изменения в коде
6. **Улучшить поддержку** — активная разработка Nuxt 4

Рекомендуемая архитектура — SPA Mode с сохранением ECS на клиенте. Это обеспечит минимальные изменения и максимальную совместимость с текущим кодом.

---

**Документ создан:** 10 апреля 2026  
**Автор:** AI Assistant  
**Версия:** 2.0 (расширенная)

## Статус миграции: ✅ Завершено

Миграция на Nuxt 4 была успешно завершена 24 апреля 2026. Все этапы плана были выполнены:

- ✅ Nuxt 4.4.2 установлен и настроен
- ✅ SPA режим (`ssr: false`) работает корректно
- ✅ Автоимпорты компонентов, stores и composables настроены
- ✅ TypeScript strict mode включён
- ✅ ECS-архитектура сохранена и работает корректно
- ✅ Файловый роутинг в `src/pages/` функционирует
- ✅ Pinia интеграция через `@pinia/nuxt` настроена
- ✅ Все тесты проходят
- ✅ Избыточные зависимости удалены (autoprefixer, cssnano, @vueuse/core, unplugin-auto-import)

Текущая архитектура соответствует рекомендациям Nuxt 4. Подробный отчёт о соответствии см. в `plans/nuxt4-compliance-plan.md`.
