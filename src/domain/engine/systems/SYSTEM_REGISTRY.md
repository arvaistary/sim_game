# Runtime System Registry

> Статус зафиксирован: 2026-04-18  
> Источник: `plans/current-systems-optimization-plan.md`, `plans/work-career-system-refresh-plan.md`

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
| `CareerProgressSystem` | `CareerProgressSystem/index.ts` | Карьерный прогресс: `wireFromContext` → canonical `SkillsSystem`; публичный `syncCurrentJob()` — единственный владелец синхронизации `currentJob`; telemetry `career_promotion`, `career_demotion`, `career_change` |
| `EducationSystem` | `EducationSystem/index.ts` | Программы обучения |
| `EventChoiceSystem` | `EventChoiceSystem/index.ts` | Резолв событий |
| `EventHistorySystem` | `EventHistorySystem/index.ts` | История событий, дедуп по `instanceId` |
| `EventQueueSystem` | `EventQueueSystem/index.ts` | Очередь событий |
| `FinanceActionSystem` | `FinanceActionSystem/index.ts` | Финансовые действия |
| `InvestmentSystem` | `InvestmentSystem/index.ts` | Инвестиции |
| `MonthlySettlementSystem` | `MonthlySettlementSystem/index.ts` | Ежемесячные расчеты |
| `PersonalitySystem` | `PersonalitySystem/index.ts` | Черты и оси Big Five: `resolvePersonalitySystem` до `DelayedEffectSystem`, `StatsSystem._clamp` для осей −100…100; query API; `activity:event` + доменное `personality:trait_unlocked` при unlock; telemetry `personality_*` |
| `RecoverySystem` | `RecoverySystem/index.ts` | Recovery-tabs поток, canonical wiring (SkillsSystem/TimeSystem/StatsSystem/InvestmentSystem через world.getSystem), shared helpers (career-helpers), telemetry |
| `SchoolSystem` | `SchoolSystem/index.ts` | Школа: lifecycle, Stats/Skills, ActivityLog, телеметрия; хуки TimeSystem `onGameDayOpened` / `onAgeEvent` |
| `StatsSystem` | `StatsSystem/index.ts` | Каноническая система статов, все мутации через applyStatChanges() |
| `TimeSystem` | `TimeSystem/index.ts` | Каноническое игровое время |
| `WorkPeriodSystem` | `WorkPeriodSystem/index.ts` | Работа и weekly flow: `wireFromContext` → `ctx.time`, `ctx.stats`, `ctx.skills`, `ctx.careerProgress`, `ctx.eventQueue`; stat merge через `StatsSystem.mergeStatChanges`; `careerProgress.syncCurrentJob()` вместо локального дубля; telemetry `work_shift`, `work_salary_payout`, `work_pending_salary`, `work_dismissal_underwork`, `work_week_rollover` |
| `MigrationSystem` | `MigrationSystem/index.ts` | Единственный владелец semver-миграций плоского save + миграции событий; `applyMigrations`, `validateSave`, `migrateEngineSnapshot` для ECS snapshot |
| `PersistenceSystem` | `PersistenceSystem/index.ts` | Save/load pipeline плоского формата, делегирование миграций в `MigrationSystem`, registry-based `syncFromWorld`; runtime store использует `MigrationSystem` + `hydrateFromRecord` / `migrateEngineSnapshot` |
| `LifeMemorySystem` | `LifeMemorySystem/index.ts` | Воспоминания персонажа: `system-context` → `ctx.lifeMemory`, trim `MAX_MEMORIES`, `getMemoryStats` / `getTopMemories`, `activity:event` при `recordMemory`, telemetry `life_memory_*` |
| `TagsSystem` | `TagsSystem/index.ts` | Временные теги: `ctx.tags` / `resolveTagsSystem`, модификаторы суммируются в `SkillsSystem.getModifiers()`, `cleanExpiredTags` после `TimeSystem.advanceHours`, telemetry `tag_*`, `activity:stat` при add/remove/expire тегов с `modifiers` |

## Partial системы (код есть, wiring ограничен)

| Система | Файл | Статус | План интеграции |
|---------|------|--------|-----------------|
| `ChainResolverSystem` | `ChainResolverSystem/index.ts` | Active | Childhood chains: `ctx.chainResolver`, `AGE_GROUP_RANGES` вынесены в constants, telemetry |
| `DelayedEffectSystem` | `DelayedEffectSystem/index.ts` | Active | Отложенные эффекты: `ctx.delayedEffect`, `cancelEffect()`, delegate в StatsSystem/SkillsSystem/PersonalitySystem, telemetry |
| `SkillsSystem` | `SkillsSystem/index.ts` | Active (embedded) | Резолвится в `SystemContext.skills` (`resolveSkillsSystem`), используется через контекст и `world.getSystem` |
## Известные проблемы (P0)

1. **Skills shape**: `getSkills()` возвращает `Record<string, number>`, но данные хранятся как `{ level, xp }`
2. **Event dedup**: `MonthlySettlementSystem` дублирует логику `EventQueueSystem._queuePendingEvent()`
3. **FinanceActionSystem time**: ищет TimeSystem через duck-typing вместо прямой ссылки
4. **ActionSystem minSkills**: читает skills как number вместо извлечения level из { level, xp }
