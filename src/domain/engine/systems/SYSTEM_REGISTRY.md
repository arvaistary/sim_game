# Runtime System Registry

> Статус зафиксирован: 2026-04-16  
> Источник: `plans/current-systems-optimization-plan.md`

## Статусы

| Статус | Описание |
|--------|----------|
| **Active** | Система в основном контуре, инициализируется через `system-context.ts` |
| **Partial** | Система существует, но не в основном wiring или с ограниченной интеграцией |
| **Dormant** | Код присутствует, но не используется в runtime |

## Active системы (wired через `system-context.ts`)

| Система | Файл | Комментарий |
|---------|------|-------------|
| `ActionSystem` | `ActionSystem/index.ts` | Основной контур карточек действий |
| `ActivityLogSystem` | `ActivityLogSystem/index.ts` | Логи активности, подключена через resolve |
| `CareerProgressSystem` | `CareerProgressSystem/index.ts` | Карьерный прогресс |
| `EducationSystem` | `EducationSystem/index.ts` | Программы обучения |
| `EventChoiceSystem` | `EventChoiceSystem/index.ts` | Резолв событий |
| `EventQueueSystem` | `EventQueueSystem/index.ts` | Очередь событий |
| `FinanceActionSystem` | `FinanceActionSystem/index.ts` | Финансовые действия |
| `InvestmentSystem` | `InvestmentSystem/index.ts` | Инвестиции |
| `MonthlySettlementSystem` | `MonthlySettlementSystem/index.ts` | Ежемесячные расчеты |
| `RecoverySystem` | `RecoverySystem/index.ts` | Recovery-tabs поток |
| `TimeSystem` | `TimeSystem/index.ts` | Каноническое игровое время |
| `WorkPeriodSystem` | `WorkPeriodSystem/index.ts` | Работа и weekly flow |

## Partial системы (код есть, wiring ограничен)

| Система | Файл | Статус | План интеграции |
|---------|------|--------|-----------------|
| `ChainResolverSystem` | `ChainResolverSystem/index.ts` | planned integration | Для childhood chains |
| `DelayedEffectSystem` | `DelayedEffectSystem/index.ts` | planned integration | Для отложенных эффектов |
| `EventHistorySystem` | `EventHistorySystem/index.ts` | planned integration | Используется локально, не в system-context |
| `LifeMemorySystem` | `LifeMemorySystem/index.ts` | planned integration | Для воспоминаний |
| `MigrationSystem` | `MigrationSystem/index.ts` | planned integration | Миграция сохранений |
| `PersonalitySystem` | `PersonalitySystem/index.ts` | experimental | Локальное использование |
| `SchoolSystem` | `SchoolSystem/index.ts` | planned integration | Детский сад/школа |
| `TagsSystem` | `TagsSystem/index.ts` | planned integration | Слабая интеграция |
| `SkillsSystem` | `SkillsSystem/index.ts` | Active (embedded) | Встроен в другие системы, не в system-context |
| `StatsSystem` | `StatsSystem/index.ts` | Active (embedded) | Встроен в Action/другие |
| `PersistenceSystem` | `PersistenceSystem/index.ts` | Active (через world/store) | Работает через store |

## Известные проблемы (P0)

1. **Skills shape**: `getSkills()` возвращает `Record<string, number>`, но данные хранятся как `{ level, xp }`
2. **Event dedup**: `MonthlySettlementSystem` дублирует логику `EventQueueSystem._queuePendingEvent()`
3. **FinanceActionSystem time**: ищет TimeSystem через duck-typing вместо прямой ссылки
4. **ActionSystem minSkills**: читает skills как number вместо извлечения level из { level, xp }
