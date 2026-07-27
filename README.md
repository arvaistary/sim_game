# Game Life

Уютный пошаговый симулятор жизни на Nuxt 4, Vue 3, Pinia и TypeScript.

## 📚 Документация

Полная документация находится в папке [`doc/`](doc/):

- **📖 Быстрый старт** → [`doc/README.md`](doc/README.md)
- **🧠 Обзор архитектуры** → [`doc/core/ARCHITECTURE_OVERVIEW.md`](doc/core/ARCHITECTURE_OVERVIEW.md)
- **📊 Статус реализации** → [`doc/core/IMPLEMENTATION_STATUS.md`](doc/core/IMPLEMENTATION_STATUS.md)
- **🛣️ План разработки** → [`doc/core/ROADMAP.md`](doc/core/ROADMAP.md)
- **🎮 Геймдизайн** → [`doc/GDD/GDD.md`](doc/GDD/GDD.md)
- **⚙️ Архитектурные решения** → [`doc/adr/`](doc/adr/)
- **🧩 Spec-kit workflow** → [`doc/spec-kit/README.md`](doc/spec-kit/README.md)

## Технологический стек

- `Nuxt 4` с Vue 3
- `Pinia` для управления состоянием
- `TypeScript` (строгий режим)
- `Vitest` для тестирования
- `SCSS` для стилизации
- `LocalStorage` для сохранения прогресса

## Запуск

```bash
npm install
npm run dev
```

## Текущая структура проекта

```
src/
├── domain/              # Бизнес-логика и баланс игры
│   └── balance/         # Действия, константы, типы, утилиты
├── application/         # Команды и запросы (порты)
├── stores/              # Pinia stores (управление состоянием)
├── composables/         # Vue composables (переиспользуемая логика)
├── components/          # UI-компоненты
│   ├── global/          # Глобальные компоненты (GameNav, Toast)
│   ├── game/            # Игровые компоненты
│   ├── ui/              # Переиспользуемые UI-компоненты
│   ├── layout/          # Layout-компоненты
│   └── pages/           # Странице-специфичные компоненты
├── pages/               # Nuxt pages (маршрутизация)
├── infrastructure/      # Адаптеры, persistence
├── utils/               # Утилиты (форматтеры, хелперы)
├── constants/           # Константы, метки, навигация
└── assets/              # SCSS, изображения
```

## Реализованные страницы (см. `src/pages/game/`)

- **Dashboard** — обзор персонажа, статы, журнал активности, выбор работы
- **Дом** — действия восстановления (здоровье, развлечения, соц. жизнь, саморазвитие, хобби)
- **Действия** — интегрированная система восстановления с табами
- **Работа** — вакансии, карьера, доход, рабочие смены
- **Финансы** — обзор баланса, расходы, финансовые действия
- **Образование** — программы, курсы, образовательные пути
- **Навыки** — обзор и прогрессия навыков
- **События** — случайные события и выбор
- **Магазин** — покупки и улучшения жилья

## Текущие игровые системы

- Доменный слой с данными баланса и бизнес-логикой
- Прикладной слой с командами и запросами
- Управление состоянием через Pinia stores
- Реактивные composables для логики UI
- Автосохранение после значимых изменений состояния (LocalStorage)

## Архитектура

Проект следует слоистой архитектуре:

```
utils/constants → domain → application → infrastructure → stores/composables → components → pages
```

Направление импортов следует цепочке зависимостей — верхние слои могут импортировать из нижних, но не наоборот.

См. [`doc/core/ARCHITECTURE_OVERVIEW.md`](doc/core/ARCHITECTURE_OVERVIEW.md) для подробной документации по архитектуре.

## Руководства по разработке

- Игровые числа и статические таблицы размещайте в **`src/domain/balance/`**
- Используйте **Pinia stores** для управления состоянием (см. `src/stores/`)
- Создавайте **Vue composables** для переиспользуемой логики UI (см. `src/composables/`)
- Следуйте конвенциям компонентов: префикс `Ui*` для `src/components/ui/`
- Используйте комментарии **TSDoc** для экспортируемых функций
- См. [`.cursor/rules/`](.cursor/rules/) для стандартов кода

## Ссылки на документацию

- Архитектура: [`doc/core/ARCHITECTURE_OVERVIEW.md`](doc/core/ARCHITECTURE_OVERVIEW.md)
- Статус реализации: [`doc/core/IMPLEMENTATION_STATUS.md`](doc/core/IMPLEMENTATION_STATUS.md)
- Справочник страниц: [`doc/core/PAGES_REFERENCE.md`](doc/core/PAGES_REFERENCE.md)
- Справочник composables: [`doc/reference/COMPOSABLES_REFERENCE.md`](doc/reference/COMPOSABLES_REFERENCE.md)
- Справочник stores: [`doc/reference/STORES_REFERENCE.md`](doc/reference/STORES_REFERENCE.md)
