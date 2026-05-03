# Game Life

Cozy turn-based life simulator на Nuxt 4 / Vue 3 с тёплым минималистичным UI и послойной архитектурой (Domain → Application → Stores → Components → Pages).

## Tech Stack

- **Nuxt 4.4** (SPA, `ssr: false`)
- **Vue 3.5** + `<script setup lang="ts">`
- **Pinia 3** — state management (13 stores: 12 специализированных + 1 фасад)
- **TypeScript** (strict mode)
- **SCSS** — дизайн-система (переменные, миксины, глобальные стили)
- **Vitest** — unit- и e2e-тесты
- **localStorage** — persistence через репозиторий
- **@vueuse/nuxt** — утилиты Vue
- **@tanstack/vue-virtual** — виртуализация списков
- **Swiper** — карусели и слайдеры
- **@nuxtjs/color-mode** — переключение темы (light/dark)
- **lodash.debounce / lodash.throttle** — debounce/throttle утилиты

## Запуск

```bash
npm install
npm run dev        # http://localhost:3000
```

## Скрипты

| Команда | Описание |
|---|---|
| `npm run dev` | Dev-сервер Nuxt |
| `npm run build` | Production-сборка |
| `npm run typecheck` | Проверка типов TypeScript |
| `npm run typecheck:watch` | Проверка типов в watch-режиме |
| `npm run test` | Запуск тестов (Vitest) |
| `npm run test:watch` | Тесты в watch-режиме |
| `npm run test:coverage` | Тесты с покрытием |
| `npm run rules:audit` | Аудит типизационных антипаттернов |
| `npm run rules:fix` | Автоисправление типизации |
| `npm run audit:action-age-groups` | Аудит действий по возрастным группам |
| `npm run mem` | MemPalace CLI |
| `npm run mem:init` | Инициализация MemPalace |
| `npm run mem:mine` | MemPalace: извлечение знаний |
| `npm run mem:status` | MemPalace: статус |
| `npm run mem:wakeup` | MemPalace: пробуждение |
| `npm run mem:search` | MemPalace: поиск |

## Архитектура

Направление зависимостей:

```
utils/constants → domain → application → infrastructure → stores/composables → components → pages
```

```
src/
├── pages/                    # Nuxt pages (маршруты)
│   ├── index.vue             # Стартовая: создание персонажа
│   └── game/                 # Игровые экраны
│       ├── index.vue         # Dashboard (профиль, статы, журнал)
│       ├── home/             # Недвижимость
│       ├── shop/             # Магазин
│       ├── actions/          # Действия (lifestyle)
│       ├── work/             # Работа / карьера
│       ├── education/        # Обучение
│       ├── skills/           # Навыки
│       ├── finance/          # Финансы
│       ├── activity/         # Журнал активности
│       ├── events/           # События
│       └── selfdev/          # Саморазвитие
├── components/
│   ├── ui/                   # Общие UI-компоненты
│   │   ├── GameButton/       # Кнопка
│   │   ├── Modal/            # Модальное окно
│   │   ├── ModalStackHost/   # Хост стека модалов
│   │   ├── GameModalHost/    # Хост игровых модалов
│   │   ├── ProgressBar/      # Прогресс-бар
│   │   ├── RoundedPanel/     # Скруглённая панель
│   │   ├── StatChange/       # Отображение изменения характеристики
│   │   ├── Toast/            # Уведомления (toast)
│   │   └── Tooltip/          # Тултип
│   ├── game/                 # Игровые компоненты
│   │   ├── ActionCard/       # Карточка действия
│   │   ├── ActionCardList/   # Список карточек действий
│   │   ├── ActionTabs/       # Табы категорий действий
│   │   ├── EmptyState/       # Пустое состояние
│   │   ├── IndustryFilter/   # Фильтр по индустрии
│   │   ├── NewbornWelcomeScreen/ # Экран приветствия новорождённого
│   │   ├── SectionHeader/    # Заголовок секции
│   │   ├── StatBar/          # Полоска характеристики
│   │   └── WorkTabs/         # Табы работы
│   ├── layout/               # Layout
│   │   └── GameLayout/       # Игровой layout
│   ├── global/               # Глобальные компоненты
│   │   └── GameNav/          # Навигация
│   └── pages/                # Page-специфичные компоненты
│       ├── dashboard/        # Dashboard (ProfileCard, StatsCard, ActivityLogCard, …)
│       ├── career/           # Карьера (CareerTrack, CurrentJobPanel, WorkShiftPanel)
│       ├── education/        # Обучение (EducationLevel, ProgramList, StudyModal)
│       ├── events/           # События (EventCard, EventChoices, EventModal, EventResult)
│       ├── finance/          # Финансы (BalancePanel, ExpenseList, FinanceActionList)
│       ├── skills/           # Навыки (SkillCard, SkillList)
│       └── activity/         # Активность (ActivityFilter, ActivityLogList)
├── stores/                   # Pinia stores (каждый в своей директории)
│   ├── game-store/           # Фасад: агрегирует все stores, save/load
│   ├── player-store/         # Игрок (имя, возраст, режим старта)
│   ├── time-store/           # Игровое время (дни, недели, месяцы)
│   ├── stats-store/          # Характеристики (энергия, голод, стресс, …)
│   ├── wallet-store/         # Кошелёк (деньги, доходы)
│   ├── career-store/         # Карьера (работа, смены, зарплата)
│   ├── education-store/      # Обучение (программы, курсы)
│   ├── skills-store/         # Навыки (прогрессия, модификаторы)
│   ├── housing-store/        # Жильё (уровни, мебель)
│   ├── finance-store/        # Финансы (инвестиции, расходы)
│   ├── events-store/         # Случайные события
│   ├── actions-store/        # Действия по категориям
│   └── activity-store/       # Журнал активности
├── composables/              # Vue composables
│   ├── useActions/           # Логика действий
│   ├── useActivityLog/       # Форматирование журнала
│   ├── useAgeRestrictions/   # Ограничения по возрасту (детство, доступность действий)
│   ├── useEvents/            # Логика событий
│   ├── useGameModal/         # Модальные окна
│   ├── useModalStack/        # Стек модалов
│   └── useToast/             # Уведомления
├── domain/                   # Domain layer
│   ├── balance/              # Баланс: действия, константы, навыки, экономика
│   │   ├── actions/          # Каталог действий по категориям (12 категорий + детские)
│   │   ├── constants/        # Балансовые таблицы
│   │   │   ├── career-jobs, education-programs, housing-levels, work-economy
│   │   │   ├── game-events, childhood-events/ (по возрастным группам)
│   │   │   ├── personality-traits, skill-modifiers, skill-effects-generator
│   │   │   ├── childhood-balance, childhood-skills
│   │   │   ├── default-save, initial-save, monthly-expenses-defaults
│   │   │   └── stat-defs, recovery-tabs, work-result-tiers
│   │   ├── types/            # Доменные типы (StatKey, StatChanges, ChildhoodEvent, Personality, …)
│   │   └── utils/            # Утилиты (hourly-rates, skill-system, build-*-game-save, …)
│   └── education/            # Логика образования
├── application/              # Application layer
│   └── game/                 # Команды (executeAction, simulateWorkShift, …)
│                             # Запросы (canExecuteAction, getCareerTrack, getFinanceOverview, …)
│                             # Порты (SaveRepository)
├── infrastructure/           # Адаптеры
│   └── persistence/          # LocalStorageSaveRepository
├── plugins/                  # Nuxt plugins
│   └── auto-save.client.ts   # Автосохранение (debounced + visibility + periodic)
├── middleware/                # Nuxt middleware
│   └── game-init.ts          # Инициализация игры
├── constants/                # Навигация, категории, метки
├── utils/                    # Утилиты (clamp, format, stat-breakdown-format)
├── assets/scss/              # SCSS дизайн-система
│   ├── variables.scss        # Переменные
│   ├── mixins.scss           # Миксины
│   ├── reset.scss            # CSS reset
│   ├── global.scss           # Глобальные стили
│   └── transitions.scss      # Переходы
├── types/                    # Глобальные type-декларации
└── app.vue                   # Корневой компонент
shared/                       # Общие типы (клиент/сервер)
└── types/                    # AppMenuActionId, AppMenuActionItem
```

## Игровые системы

| Система | Описание |
|---|---|
| **Создание персонажа** | Выбор имени, режим старта (младенчество / взрослая жизнь) |
| **Детство** | Возрастные группы (INFANT 0–3, TODDLER 4–7, CHILD 8–12, TEEN 13–15, YOUNG 16–18, ADULT 19+); детские события, навыки и баланс |
| **Черты характера** | 41 черта по 5 осям (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism); формируются через события и выборы в детстве |
| **Время** | Дни, недели, месяцы; еженедельный сброс рабочих часов |
| **Характеристики** | Энергия, голод, стресс, настроение, здоровье, физическая форма; clamp 0–100 |
| **Кошелёк** | Доходы, расходы, баланс |
| **Карьера** | Трудоустройство, рабочие смены, зарплата по часам, карьерный трек |
| **Образование** | Программы, курсы, требования, прогресс, ранги |
| **Навыки** | Прогрессия, модификаторы, эффекты на действия, тултипы |
| **Жильё** | Уровни жилья, мебель, комфорт |
| **Финансы** | Инвестиции (депозит, акции, бизнес), ежемесячные расходы, settlement |
| **Действия** | 12 категорий (shop, fun, home, social, education, finance, career, hobby, health, selfdev, child, recovery); возрастные ограничения |
| **События** | Случайные события с выбором и последствиями; детские события по возрастным группам |
| **Журнал активности** | Лог всех действий с фильтрацией |
| **Автосохранение** | Debounced (300ms) + visibilitychange + periodic (30 сек) |

## Тесты

```
test/
├── unit/
│   ├── architecture/         # Границы слоёв, store-boundaries, canonical-ecs-keys
│   ├── application/game/     # Команды (actions-command), запросы (actions-query), save-session
│   ├── domain/balance/       # Схема действий, каталог, hourly-rates
│   └── stores/               # career, skills, stats, time, wallet
├── e2e/
│   └── routes/               # Smoke-тесты маршрутов
├── migration/                # Миграционные тесты
├── setup/                    # Моки (localStorage)
└── minimal.test.ts           # Минимальный smoke-тест
```

```bash
npm run test            # Все тесты
npm run test:watch      # Watch-режим
npm run test:coverage   # С покрытием
```

## UI-принципы

- SPA без SSR — все браузерные API доступны без guard-условий.
- SCSS дизайн-система: переменные (`variables.scss`), миксины (`mixins.scss`), глобальные стили.
- Стили компонентов вынесены в отдельные `.scss` файлы; секция `<style>` в `.vue` запрещена.
- UI-кит: `GameButton`, `Modal`, `ModalStackHost`, `GameModalHost`, `Toast`, `ProgressBar`, `RoundedPanel`, `StatChange`, `Tooltip`.
- Навигация через `GameNav` с 8 разделами.
- Виртуализация списков через `@tanstack/vue-virtual`.
- Карусели через `Swiper`.

## Заметки для разработки

- Новую стейтфул-логику добавляй через **Pinia stores** и **application commands/queries**.
- Балансовые таблицы и статичные данные — в `src/domain/balance/`.
- Новые UI-компоненты — в `src/components/ui/` (общие) или `src/components/pages/` (page-специфичные).
- Правила типизации и code style — см. `.roo/rules/`.
- Аудит типизации: `npm run rules:audit -- src/`.
- Автоисправление: `npm run rules:fix -- src/`.
- Аудит действий по возрастным группам: `npm run audit:action-age-groups`.
