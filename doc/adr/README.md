# Architecture Decision Records (ADR)

**Последнее обновление:** 2 июня 2026

## Обзор

ADR (Architecture Decision Records) — это записи о ключевых архитектурных решениях проекта. Каждый ADR описывает:
- Контекст и проблему
- Рассмотренные альтернативы
- Принятое решение
- Последствия решения

## Список ADR

| ID | Название | Дата | Статус |
|----|----------|------|--------|
| [ADR-0001](0001-phaser-to-nuxt-migration.md) | Миграция с Phaser на Nuxt 4 | апрель 2026 | Принято |
| [ADR-0002](0002-ecs-removal.md) | Удаление ECS-архитектуры | апрель 2026 | Принято |
| [ADR-0003](0003-layered-architecture.md) | Слоистая архитектура (Domain/Application/Infrastructure) | апрель 2026 | Принято |
| [ADR-0004](ARCHITECTURE_DECISION_HENDERSON_ADAPTATION.md) | Адаптация архитектуры Henderson | 2025 | Принято |

## Формат ADR

Каждый ADR должен соответствовать формату:

```markdown
# ADR-NNNN: [Название решения]

**Дата:** YYYY-MM-DD
**Статус:** Принято / Заменено ADR-XXXX

## Контекст
[Описание проблемы или ситуации]

## Решение
[Принятое решение]

## Последствия
[Положительные и отрицательные последствия]

## Альтернативы
[Рассмотренные альтернативы и почему не выбраны]
```

## Руководство по созданию ADR

См. [decision-guide.md](decision-guide.md) для подробного руководства по созданию ADR.

## Архивные решения

Архивные ADR и исторические решения:
- [architecture-research-report.md](architecture-research-report.md) — исследование архитектуры
- [nuxt4-architecture-analysis.md](nuxt4-architecture-analysis.md) — анализ архитектуры Nuxt 4