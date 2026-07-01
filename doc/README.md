# Документация проекта Game Life

Добро пожаловать в документацию проекта Game Life! Здесь вы найдёте всю информацию о разработке, дизайне и архитектуре игры.

## Быстрый старт

Для новых разработчиков рекомендуем следующий порядок чтения:

1. Архитектура проекта и слоистая структура
2. Статус реализации модулей
3. Справочник страниц и роутинга
4. Game Design Document (GDD)
5. Nuxt 4 архитектура и конфигурация
6. Composables для работы с состоянием

## Структура документации

```
doc/
├── README.md                          # Этот файл - главная навигация
├── core/                              # Основная документация
│   ├── README.md                      # Обзор проекта и быстрый старт
│   ├── IMPLEMENTATION_STATUS.md       # Статус реализации всех модулей
│   ├── START_GAME_DOCUMENTATION.md    # Документация старта игры
│   ├── PAGES_REFERENCE.md             # Справочник Vue страниц и роутинга
│   ├── ARCHITECTURE_OVERVIEW.md       # Обзор 4 архитектурных слоёв
│   ├── ARCHITECTURE_CONTRACT.md       # Архитектурный контракт
│   └── ROADMAP.md                     # План разработки
│
├── gdd/                               # Game Design Document
│   ├── README.md                      # Обзор GDD и навигация
│   ├── GDD.md                         # Полный GDD (все в одном файле)
│   └── modules/                       # Модульные документы по темам
│       ├── 01_general.md
│       ├── 02_implementation.md
│       ├── 03_core_mechanics.md
│       ├── 04_balance.md
│       ├── 05_save_system.md
│       ├── 06_death_system.md
│       ├── 07_random_events.md
│       ├── 08_family.md
│       ├── 09_hobbies.md
│       ├── 10_achievements.md
│       ├── 11_seasonal.md
│       ├── 12_technical.md
│       ├── 13_roadmap.md
│       └── 14_conclusion.md
│
├── adr/                               # Architecture Decision Records
│   ├── decision-guide.md              # Руководство по ADR
│   ├── architecture-research-report.md
│   └── nuxt4-architecture-analysis.md
│
├── guides/                            # Практические руководства
│   ├── DESIGN_SYSTEM.md               # Design system проекта
│   ├── MODAL_SYSTEM_GUIDE.md          # Руководство по модальной системе
│   └── RULES_NUXT_ADAPTATION.md       # Правила адаптации под Nuxt
│
├── reference/                         # API Reference
│   ├── COMPOSABLES_REFERENCE.md       # Справочник Vue composables
│   └── STORES_REFERENCE.md            # Справочник Pinia stores
│
├── plans/                             # Активные планы
│   └── active/                        # Планы в работе
│       ├── documentation-cleanup-plan.md
│       └── rules-fix-plan.md
│
├── spec-kit/                          # Spec-kit workflow и шаблоны
│   ├── README.md                      # Описание процесса
│   ├── templates/                     # Шаблоны spec/plan/tasks
│   └── specs/                         # Активные спецификации
│
└── archive/                           # Архив устаревших документов
    ├── ecs/                           # ECS-архитектура (удалена)
    ├── phaser-architecture/           # Phaser.js архитектура (legacy)
    ├── migration-plans/               # Выполненные планы миграций
    ├── refresh-plans/                 # Выполненные refresh-планы
    └── ...                            # Другие архивные документы
```

## Что где искать

### Хочу узнать о проекте в целом
Обзор проекта и архитектуры → `core/ARCHITECTURE_OVERVIEW.md`

### Хочу узнать, что уже готово
Статус реализации → `core/IMPLEMENTATION_STATUS.md`

### Хочу узнать план разработки
План разработки → `core/ROADMAP.md`

### Хочу понять механики игры
Полный GDD → `gdd/GDD.md`

### Хочу понять механики старта игры
Документация старта игры → `core/START_GAME_DOCUMENTATION.md`

### Хочу понять, какие страницы есть в коде
Справочник Vue страниц → `core/PAGES_REFERENCE.md`

### Хочу найти API composable или store
Composables → `reference/COMPOSABLES_REFERENCE.md`
Stores → `reference/STORES_REFERENCE.md`

### Хочу понять архитектурные решения
ADR → `adr/` (Architecture Decision Records)

### Хочу добавить новую функцию
1. Проверьте `gdd/GDD.md` - возможно, это уже описано
2. Изучите `core/IMPLEMENTATION_STATUS.md`
3. Создайте Spec-kit артефакты в `spec-kit/specs/` по шаблонам `spec-kit/templates/`
4. Следуйте архитектуре проекта (domain → application → stores/composables → components → pages)

## Роли и документация

### Разработчик

Что читать:
- Архитектура проекта
- Статус реализации модулей
- GDD (Game Design Document) - разделы реализуемых функций
- Nuxt 4 архитектура
- Rules и code style (`.cursor/rules/`)

Где искать:
- Механики игры → `gdd/modules/`
- Архитектура кода → `core/ARCHITECTURE_OVERVIEW.md`
- Nuxt фреймворк → `nuxt.config.ts`
- API composables/stores → `reference/`
- Текущий статус → `core/IMPLEMENTATION_STATUS.md`

### Дизайнер/Геймдизайнер

Что читать:
- Полный GDD (Game Design Document)
- Статус реализации модулей
- Roadmap разработки

Где искать:
- Все механики и баланс → `gdd/modules/`
- Планы на будущее → `core/ROADMAP.md`

### Архитектор/Техлид

Что читать:
- Архитектура проекта
- Nuxt 4 архитектура
- ADR (Architecture Decision Records)

Где искать:
- Технические решения → `adr/`
- Конфигурация → `nuxt.config.ts`
- Правила проекта → `.cursor/rules/`

## Глоссарий терминов

- GDD - Game Design Document (документ геймдизайна)
- Core Loop - основной игровой цикл
- Nuxt 4 - веб-фреймворк на базе Vue 3
- Vue 3 - UI фреймворк для интерфейса
- TypeScript - язык программирования с типами
- Pinia - state management библиотека для Vue 3
- Domain layer - доменный слой (бизнес-логика)
- Application layer - прикладной слой (команды и запросы)
- Infrastructure layer - инфраструктурный слой (persistence)
- ADR - Architecture Decision Record (архитектурные решения)
- MVP - Minimum Viable Product (минимально жизнеспособный продукт)
- Legacy - устаревший код, который был заменён (архив Phaser.js)

## Быстрые ссылки

### Начало работы
- Установка и запуск → корневой README.md
- Структура проекта → корневой README.md
- Быстрый старт → `core/README.md`

### Текущее состояние
- Статус реализации → `core/IMPLEMENTATION_STATUS.md`
- Roadmap → `core/ROADMAP.md`

### Игровые механики
- Полный GDD → `gdd/GDD.md`
- Основные механики → `gdd/modules/03_core_mechanics.md`
- Баланс и экономика → `gdd/modules/04_balance.md`
- Случайные события → `gdd/modules/07_random_events.md`

### Техническая документация
- Обзор архитектуры проекта → `core/ARCHITECTURE_OVERVIEW.md`
- Архитектурные решения → `adr/`
- Nuxt 4 архитектура → `adr/nuxt4-architecture-analysis.md`
- Composables Reference → `reference/COMPOSABLES_REFERENCE.md`
- Stores Reference → `reference/STORES_REFERENCE.md`

### Активные планы
- Документация cleanup → `plans/active/documentation-cleanup-plan.md`
- Rules fix → `plans/active/rules-fix-plan.md`

### Spec-kit
- Процесс и правила → `spec-kit/README.md`
- Чеклист внедрения → `spec-kit/ADOPTION_CHECKLIST.md`
- Маппинг project rules -> Spec-kit → `spec-kit/CURSOR_RULES_BRIDGE.md`
- Шаблоны артефактов → `spec-kit/templates/`
- Активные спецификации → `spec-kit/specs/`

## Обновление документации

### Основные правила

1. Держите в актуальном состоянии
   - Обновляйте `IMPLEMENTATION_STATUS.md` при завершении модуля
   - Обновляйте `ROADMAP.md` при изменении планов
   - Создавайте ADR при принятии архитектурных решений

2. Соблюдайте структуру
   - Используйте существующие папки и файлы
   - Архивные документы → `archive/`
   - Новые ADR → `adr/`
   - Новые планы → `plans/active/`

3. Кросс-ссылки
   - Обновляйте ссылки в других файлах при переименовании
   - Проверяйте актуальность ссылок периодически

### Процесс добавления новой документации

1. Определите категорию (core/gdd/adr/guides/reference)
2. Создайте файл с понятным именем
3. Добавьте описание в соответствующий README.md
4. Обновите перекрёстные ссылки
5. Уведомите команду

## Архитектурные решения (ADR)

Для всех ключевых архитектурных решений создаются ADR-файлы в папке `adr/`:
- Описание контекста и проблемы
- Рассмотренные альтернативы
- Принятое решение
- Последствия решения

См. `adr/decision-guide.md` для формата ADR.

## Участие

### Нашли ошибку в документации?
1. Исправьте ошибку
2. Обновите связанные файлы
3. Создайте PR с описанием изменений

### Хотите улучшить документацию?
1. Создайте issue с предложением
2. Обсудите с командой
3. Внесите изменения

### Нужно добавить новый раздел?
1. Определите категорию и название
2. Создайте файл
3. Обновите README соответствующей папки
4. Добавьте ссылку в этот README

## Поддержка

По вопросам о документации:

- Посмотрите этот README
- Посмотрите README в нужной папке (core/gdd/adr/guides/reference)
- Свяжитесь с ответственным за документацию

---

**Последнее обновление:** 2 июня 2026
**Версия документации:** 4.0
**Статус:** Активная
**Технологический стек:** Nuxt 4 + Vue 3 + TypeScript + Pinia