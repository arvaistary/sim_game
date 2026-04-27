# Game Life

Cozy turn-based life simulator на Nuxt 4 / Vue 3 с тёплым минималистичным UI и послойной архитектурой (Domain → Application → Stores → Components → Pages).

## Tech Stack

- **Nuxt 4.4** (SPA, `ssr: false`)
- **Vue 3.5** + `<script setup lang="ts">`
- **Pinia 3** — state management (13 специализированных stores)
- **TypeScript** (strict mode)
- **SCSS** — дизайн-система (переменные, миксины, глобальные стили)
- **Vitest** — unit-тесты
- **localStorage** — persistence через репозиторий

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
| `npm run test` | Запуск тестов (Vitest) |
| `npm run test:watch` | Тесты в watch-режиме |
| `npm run test:coverage` | Тесты с покрытием |
| `npm run rules:audit` | Аудит типизационных антипаттернов |
| `npm run rules:fix` | Автоисправление типизации |

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
│   ├── ui/                   # Общие UI-компоненты (GameButton, Modal, Toast, ProgressBar, …)
│   ├── game/                 # Игровые компоненты (ActionCard, StatBar, WorkTabs, …)
│   ├── layout/               # Layout (GameLayout)
│   ├── global/               # Глобальные (GameNav)
│   └── pages/                # Page-специфичные (dashboard, career, education, …)
├── stores/                   # Pinia stores
│   ├── game.store.ts         # Фасад: агрегирует все stores, save/load
│   ├── player-store/         # Игрок (имя, возраст, режим старта)
│   ├── time-store/           # Игровое время (дни, недели, месяцы)
│   ├── stats-store/          # Характеристики (энергия, голод, стресс, …)
│   ├── wallet-store/         # Кошелёк (деньги, доходы)
│   ├── career-store/         # Карьера (работа, смены, зарплата)
│   ├── education-store/      # Обучение (программы, курсы)
│   ├── skills-store/         # Навыки (прогрессия, модификаторы)
│   ├── housing-store/        # Жильё (уровни)
│   ├── finance-store/        # Финансы (инвестиции, расходы)
│   ├── events-store/         # Случайные события
│   ├── actions-store/        # Действия по категориям
│   └── activity-store/       # Журнал активности
├── composables/              # Vue composables
│   ├── useActions/           # Логика действий
│   ├── useActivityLog/       # Форматирование журнала
│   ├── useAgeRestrictions/   # Ограничения по возрасту
│   ├── useEvents/            # Логика событий
│   ├── useGameModal/         # Модальные окна
│   ├── useModalStack/        # Стек модалов
│   └── useToast/             # Уведомления
├── domain/                   # Domain layer
│   ├── balance/              # Баланс: действия, константы, навыки, экономика
│   │   ├── actions/          # Каталог действий по категориям
│   │   ├── constants/        # Балансовые таблицы (работы, жильё, навыки, …)
│   │   ├── types/            # Доменные типы
│   │   └── utils/            # Утилиты (hourly-rates, skill-system, …)
│   └── education/            # Логика образования
├── application/              # Application layer
│   └── game/                 # Команды (executeAction, simulateWorkShift, …)
│                            # Запросы (getCareerTrack, getFinanceOverview, …)
├── infrastructure/           # Адаптеры
│   └── persistence/          # LocalStorageSaveRepository
├── plugins/                  # Nuxt plugins
│   └── auto-save.client.ts   # Автосохранение (debounced + visibility + periodic)
├── constants/                # Навигация, категории, метки
├── utils/                    # Утилиты (clamp, format)
├── assets/scss/              # SCSS дизайн-система
└── types/                    # Глобальные type-декларации
```

## Игровые системы

| Система | Описание |
|---|---|
| **Создание персонажа** | Выбор имени, режим старта (младенчество / взрослая жизнь) |
| **Время** | Дни, недели, месяцы; еженедельный сброс рабочих часов |
| **Характеристики** | Энергия, голод, стресс и др.; clamp 0–100 |
| **Кошелёк** | Доходы, расходы, баланс |
| **Карьера** | Трудоустройство, рабочие смены, зарплата по часам |
| **Образование** | Программы, курсы, требования, прогресс |
| **Навыки** | Прогрессия, модификаторы, эффекты на действия |
| **Жильё** | Уровни жилья, расходы |
| **Финансы** | Инвестиции (депозит, акции, бизнес), ежемесячные расходы |
| **Действия** | Lifestyle-действия по категориям (отдых, развлечения, здоровье, …) |
| **События** | Случайные события с выбором и последствиями |
| **Журнал активности** | Лог всех действий с фильтрацией |
| **Автосохранение** | Debounced (300ms) + visibilitychange + periodic (30 сек) |

## Тесты

```
test/
├── unit/
│   ├── architecture/         # Границы слоёв, store-boundaries
│   ├── domain/balance/       # Схема действий, каталог, hourly-rates
│   └── stores/               # career, skills, stats, time, wallet
└── e2e/
    └── routes/               # Smoke-тесты маршрутов
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
- UI-кит: `GameButton`, `Modal`, `Toast`, `ProgressBar`, `RoundedPanel`, `StatChange`, `Tooltip`.
- Навигация через `GameNav` с 8 разделами.

## Заметки для разработки

- Новую стейтфул-логику добавляй через **Pinia stores** и **application commands/queries**.
- Балансовые таблицы и статичные данные — в `src/domain/balance/`.
- Новые UI-компоненты — в `src/components/ui/` (общие) или `src/components/pages/` (page-специфичные).
- Правила типизации и code style — см. `.roo/rules/`.
- Аудит типизации: `npm run rules:audit -- src/`.
- Автоисправление: `npm run rules:fix -- src/`.
