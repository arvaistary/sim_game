# Game Life - Документация для разработчиков

Добро пожаловать в проект Game Life! Это симулятор жизни с пошаговым геймплеем, реализованный на Nuxt 4 + Vue 3 + TypeScript.

## 📚 Быстрый старт

Для новых разработчиков рекомендуем следующий порядок чтения:

1. **🏗️ Обзор архитектуры** - 4 архитектурных слоя проекта
2. **🎯 Обзор проекта** - эта страница
3. **📊 Статус реализации** - что готово, что в работе
4. **🧩 Справочник страниц** - Vue страницы и Nuxt роутинг
5. **🛣️ Roadmap разработки** - план развития
6. **🎮 GDD (Game Design Document)** - полное описание механик игры
7. **📄 Документация старта игры** - StartPage и инициализация
8. **⚙️ Архитектура ECS** - техническая архитектура доменного слоя

## 📁 Структура документации

### 📖 Основная документация (эта папка)

В этой папке собрана основная документация для входа в проект:

- **README.md** - этот файл, обзор и навигация
- **IMPLEMENTATION_STATUS.md** - текущий статус реализации всех модулей
- **PAGES_REFERENCE.md** - таблица Vue страниц и Nuxt роутинга
- **START_GAME_DOCUMENTATION.md** - документация старта игры
- **ARCHITECTURE_OVERVIEW.md** - обзор 4 архитектурных слоёв
- **MEMPALACE_SETUP.md** - настройка и workflow MemPalace
- **ROADMAP.md** - план разработки и приоритеты
- **NUXT4_MIGRATION_PLAN.md** - план миграции на Nuxt 4

### 🎮 Game Design Document (`../GDD/`)

Полное описание игровой механики и дизайна:

- **GDD.md** - основной документ со всеми механиками игры
- **modules/** - модульные документы по темам:
  - `01_general.md` - общая информация
  - `02_implementation.md` - рекомендации по реализации в Nuxt 4 + Vue 3
  - `03_core_mechanics.md` - основные механики
  - `04_balance.md` - баланс и экономика
  - `05_save_system.md` - система сохранений
  - `06_death_system.md` - система смерти и концовок
  - `07_random_events.md` - случайные события
  - `08_family.md` - семья и дети
  - `09_hobbies.md` - хобби и побочный заработок
  - `10_achievements.md` - достижения и трофеи
  - `11_seasonal.md` - сезонные и праздничные события
  - `12_technical.md` - технические требования
  - `13_roadmap.md` - roadmap разработки (дублирует ../ROADMAP.md)
  - `14_conclusion.md` - заключение

### ⚙️ Техническая архитектура (`../ecs/`)

В коде данные баланса (работы, жильё, демо-сейв, навыки UI, образование, базовые расходы) собраны в **`src/domain/balance/`**.

Документация о технической реализации:

- **ecs/ECS_ARCHITECTURE.md** — описание ECS архитектуры доменного слоя
- **ecs/ECS_DOMAIN_MAP.md** — карта соответствия домена
- **ecs/ECS_MIGRATION_FINAL_REPORT.md** — финальный отчёт о миграции
- **ecs/Nuxt4_INTEGRATION.md** — интеграция ECS с Pinia store
- **ecs/README.md** — обзор ECS и статус миграции

### 🌐 Фреймворк и инструменты (`../`)

- **NUXT4_ARCHITECTURE.md** — архитектура и конфигурация Nuxt 4
- **COMPOSABLES_REFERENCE.md** — справочник Vue composables

## 🚀 Начало работы

### Требования

- Node.js (версия 18+)
- Современный браузер (Chrome, Firefox, Safari, Edge)
- npm или yarn

### Установка

```bash
# Клонирование репозитория
git clone <repository-url>
cd game_life

# Установка зависимостей
npm install
```

### Запуск проекта

```bash
npm run dev
```

Nuxt выведет адрес (часто `http://localhost:3000/`). Откройте его в браузере.

## 📦 Структура проекта

```text
game_life/
├── src/                         # Исходный код
│   ├── domain/                   # Доменный слой (бизнес-логика)
│   │   ├── ecs/                 # ECS архитектура
│   │   │   ├── components/       # Компоненты (данные)
│   │   │   ├── systems/          # Системы (логика)
│   │   │   ├── types/            # TypeScript типы
│   │   │   ├── constants/        # Константы компонентов
│   │   │   ├── policies/         # Политики форматирования
│   │   │   └── utils/           # Утилиты ECS
│   │   ├── balance/              # Баланс и статический контент
│   │   │   ├── actions/          # Каталог действий (~222 действия)
│   │   │   ├── career-jobs.ts    # Должности
│   │   │   ├── education-programs.ts # Программы обучения
│   │   │   ├── housing-levels.ts  # Уровни жилья
│   │   │   └── ...              # Другие файлы баланса
│   │   └── game-facade/          # Фасад доменного слоя
│   │       ├── system-context.ts  # Контекст систем
│   │       ├── commands.ts       # Команды домена
│   │       ├── queries.ts        # Запросы домена
│   │       └── index.ts         # createWorldFromSave, gameDomainFacade
│   │
│   ├── application/              # Прикладной слой (Use Cases)
│   │   └── game/
│   │       ├── commands.ts       # Команды прикладного слоя
│   │       ├── queries.ts        # Запросы прикладного слоя
│   │       ├── types.ts         # Типы прикладного слоя
│   │       └── ports/
│   │           └── SaveRepository.ts # Интерфейс репозитория
│   │
│   ├── infrastructure/           # Инфраструктурный слой
│   │   └── persistence/
│   │       └── LocalStorageSaveRepository.ts
│   │
│   ├── components/               # Vue компоненты
│   │   ├── layout/              # Layout компоненты
│   │   ├── ui/                  # UI компоненты
│   │   └── game/                # Игровые компоненты
│   │
│   ├── pages/                   # Vue страницы (15 шт.)
│   │   ├── StartPage.vue
│   │   ├── MainPage.vue
│   │   ├── RecoveryPage.vue
│   │   └── ...                 # 12 других страниц
│   │
│   ├── nuxt-pages/              # Nuxt страницы (роутинг)
│   │   ├── index.vue
│   │   └── game/[section].vue   # Динамические страницы
│   │
│   ├── middleware/               # Nuxt middleware
│   │   └── game-init.ts        # Инициализация игры
│   │
│   ├── composables/              # Vue composables
│   │   ├── useActions.ts
│   │   ├── useFinance.ts
│   │   └── ...                 # 3 других composables
│   │
│   ├── stores/                  # Pinia stores
│   │   └── game.store.ts       # Главный хранилище игры
│   │
│   └── assets/                  # Статические ресурсы
│       └── css/main.css        # Глобальные стили
│
├── doc/                        # Документация
│   ├── core/                   # Основная документация (эта папка)
│   ├── GDD/                    # Game Design Document
│   ├── ecs/                    # Техническая документация ECS
│   ├── archive/                # Архив устаревших документов
│   ├── NUXT4_ARCHITECTURE.md   # Nuxt 4 архитектура
│   └── COMPOSABLES_REFERENCE.md # Справочник composables
│
├── test/                       # Тесты
│   ├── unit/                   # Unit тесты
│   ├── integration/             # Интеграционные тесты
│   └── e2e/                   # E2E тесты
│
├── nuxt.config.ts              # Конфигурация Nuxt 4
├── tsconfig.json              # Конфигурация TypeScript
├── vite.config.ts             # Конфигурация Vite
├── package.json               # Зависимости и скрипты
└── README.md                 # Документация проекта
```

## 🎯 Ключевые механики игры

### Core Loop

1. **Создание персонажа** - игрок вводит имя, выбирает возраст и путь образования (StartPage.vue)
   - 3 варианта образования: без образования, школа, школа+институт
   - Инициализация ECS World через Pinia store
2. **Работа** - игрок выбирает длительность рабочего периода
3. **Восстановление** - игрок тратит деньги на восстановление шкал
4. **Повтор** - цикл повторяется

### Шкалы персонажа

- Голод (Hunger)
- Энергия (Energy)
- Стресс (Stress)
- Настроение (Mood)
- Здоровье (Health)
- Физическая форма (Physical)

### Основные системы

1. **ECS (Entity-Component-System)** - архитектура доменного слоя
   - 18 систем (TimeSystem, StatsSystem, ActionSystem и др.)
   - 19+ компонентов
   - Интеграция с Pinia store через shallowRef
2. **Pinia Store** - централизованное состояние игры
   - ECS World в shallowRef для оптимизации
   - Computed свойства для компонентов ECS
   - Методы для команд и запросов
3. **Composables** - переиспользуемая логика для Vue компонентов
   - useActions - работа с действиями
   - useFinance - финансы
   - useEvents - события
   - useToast - уведомления
   - useActivityLog - журнал активности
4. **Nuxt Routing** - файловый роутинг
   - index.vue - стартовая страница
   - game/[section].vue - динамические страницы
   - middleware game-init.ts - инициализация игры

### Дополнительные системы

- Карьера - progression через уровни работ
- Образование - книги, курсы, вузы
- Дом - жильё и мебель
- Отношения - семья и друзья (частично реализовано)
- Инвестиции - пассивный доход
- Хобби - побочный заработок

## 🔧 Технологический стек

- **Nuxt 4** - веб-фреймворк на базе Vue 3
- **Vue 3** - UI фреймворк для интерфейса
- **TypeScript** - язык разработки
- **Pinia** - state management для Vue 3
- **ECS Pattern** - архитектура доменного слоя (Entity-Component-System)
- **Vite** - сборщик и dev-сервер
- **LocalStorage** - сохранение прогресса

## 🏗️ Архитектурные слои

Проект разделён на 4 архитектурных слоя:

### 1. Domain Layer (Доменный слой)
- ECS - Entity-Component-System (логика игры)
- Balance - баланс и статический контент
- Game Facade - фасад доменного слоя

### 2. Application Layer (Прикладной слой)
- Commands - команды приложения
- Queries - запросы приложения
- Ports - интерфейсы для инфраструктуры

### 3. Infrastructure Layer (Инфраструктурный слой)
- Repositories - реализация персистентности
- LocalStorageSaveRepository - сохранение в localStorage

### 4. Presentation Layer (Презентационный слой)
- Pinia Store - централизованное состояние
- Composables - переиспользуемая логика
- Vue Components - UI компоненты
- Vue Pages - страницы игры

**Подробнее:** см. [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md)

## 🤝 Вклад в проект

### Для разработки новых функций

1. Изучите соответствующий модуль в GDD
2. Проверьте IMPLEMENTATION_STATUS.md для понимания контекста
3. Следуйте архитектуре (4 слоя) для новой логики
4. Добавьте тесты при необходимости

### Для исправления багов

1. Воспроизведите проблему
2. Найдите соответствующий код в `src/`
3. Проверьте ECS системы, которые могут влиять на проблему
4. Создайте фикс с тестом

### Добавление новой Vue страницы

1. Создайте компонент страницы в `src/pages/`
2. Добавьте маппинг в `src/nuxt-pages/game/[section].vue`
3. Добавьте ссылку в навигацию MainPage
4. Обновите документацию в PAGES_REFERENCE.md

### Добавление новой ECS системы

1. Создайте файл системы в `src/domain/ecs/systems/`
2. Добавьте систему в SystemContext
3. Реализуйте логику в доменном слое
4. Обновите ECS_DOMAIN_MAP.md

## 📞 Контакты и поддержка

- По вопросам по дизайну: смотрите GDD
- По вопросам по архитектуре: смотрите ARCHITECTURE_OVERVIEW.md и ECS документацию
- По вопросам по реализации: смотрите исходный код в `src/`
- По вопросам по Nuxt: смотрите NUXT4_ARCHITECTURE.md

## 📝 Полезные ссылки

- [Nuxt 4 Documentation](https://nuxt.com/docs)
- [Vue 3 Documentation](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [ECS Pattern Guide](https://github.com/SanderMertens/ecs-faq)
- GDD модули в `doc/GDD/modules/`

---

**Последнее обновление:** 10 апреля 2026
**Версия документа:** 3.0
**Миграция:** Проект полностью мигрировал на Nuxt 4 + Vue 3 + TypeScript
