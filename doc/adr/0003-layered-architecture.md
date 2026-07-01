# ADR-0003: Слоистая архитектура (Domain/Application/Infrastructure)

**Дата:** апрель 2026
**Статус:** Принято

## Контекст

После удаления ECS, проект нуждался в чёткой архитектуре для отделения бизнес-логики от UI. Задача:
- Хранить бизнес-логику отдельно от Vue/Nuxt
- Иметь чистый доменный слой (actions, constants, utils)
- Использовать application layer для commands/queries
- Реализовать infrastructure для persistence

## Решение

Внедрить слоистую архитектуру с чётким разделением ответственности:

```
utils/constants → domain → application → infrastructure → stores/composables → components → pages
```

**Domain Layer:** (`src/domain/balance/`)
- Игровые действия (~222)
- Константы баланса
- Типы домена
- Утилиты домена
- Не зависит от Vue/Nuxt

**Application Layer:** (`src/application/game/`)
- Commands (executeLifestyleAction, simulateWorkShift, ...)
- Queries (getCareerTrack, getFinanceOverview, ...)
- Ports (SaveRepository)
- Зависит только от domain

**Infrastructure Layer:** (`src/infrastructure/persistence/`)
- LocalStorageSaveRepository
- Миграции данных

**Stores/Composables:** (`src/stores/`, `src/composables/`)
- Pinia stores для state management
- Composables для логики UI
- Зависят от application и domain

## Последствия

### Положительные

- Чистое разделение ответственности
- Domain легко тестируется без Vue/Nuxt
- Stores не содержат бизнес-логику (только state)
- Composables организуют логику UI

### Отрицательные

- Больше слоёв = больше boilerplate
- Нужно дисциплинированно следовать правилам импортов
- Complexity для новых разработчиков

## Альтернативы

### Альтернатива 1: Вся логика в stores
- **Минусы:** Stores становятся bloated, сложно тестировать
- **Почему нет:** Нет разделения бизнес-логики и UI

### Альтернатива 2: Только Vue composables
- **Минусы:** Нет изоляции domain от Vue
- **Почему нет:** Domain не должен зависеть от фреймворка

---

**Связанные документы:**
- [doc/core/ARCHITECTURE_OVERVIEW.md](../core/ARCHITECTURE_OVERVIEW.md)
- [doc/core/ARCHITECTURE_CONTRACT.md](../core/ARCHITECTURE_CONTRACT.md)
- [.cursor/rules/30-architecture.mdc](../../.cursor/rules/30-architecture.mdc) — правила архитектуры