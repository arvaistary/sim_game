# Дорожная карта: планы для оставшихся систем

## Статус: Draft (после завершения pre-flight)

## Цель

Сформировать очередь новых рабочих планов для систем, у которых пока нет отдельного документа в `plans`, и синхронизировать их с уже существующими master-планами:

- `plans/system-sync-plan.md`
- `plans/time-system-refresh.plan.md`
- `plans/event-system-sync.plan.md`
- `plans/actions-system-refresh-plan.md`
- `plans/skills-system-refresh-plan.md`
- `plans/education-age-context-plan.md`

---

## Системы без dedicated-планов (срез)

### Active

- `ActivityLogSystem`
- `CareerProgressSystem`
- `FinanceActionSystem`
- `InvestmentSystem`
- `MonthlySettlementSystem`
- `RecoverySystem`
- `WorkPeriodSystem`
- `StatsSystem` (embedded)
- `PersistenceSystem` (через store/world)

### Partial / experimental

- `ChainResolverSystem`
- `DelayedEffectSystem`
- `EventHistorySystem`
- `LifeMemorySystem`
- `MigrationSystem`
- `PersonalitySystem`
- `SchoolSystem`
- `TagsSystem`

---

## Приоритизация планирования (P0/P1/P2)

## P0 — планировать в первую очередь

1. `PersistenceSystem` + `MigrationSystem`  
   **Почему:** без устойчивого save/load и миграций все следующие refactor-wave рискованны.
2. `WorkPeriodSystem` + `CareerProgressSystem`  
   **Почему:** критично для базового gameplay-loop (работа/доход/прогресс) и синхронизации с `time`/`skills`.
3. `FinanceActionSystem` + `MonthlySettlementSystem` + `InvestmentSystem`  
   **Почему:** единый финансовый контур уже частично стабилизирован, нужен полноценный целевой план.
4. `StatsSystem`  
   **Почему:** embedded ядро для большинства action/recovery/education эффектов.

## P1 — после закрытия P0

1. `ActivityLogSystem` + `EventHistorySystem`  
   **Почему:** explainability, трассировка решений игрока и диагностика баланса.
2. `RecoverySystem`  
   **Почему:** связан с needs-реализмом и прогрессией, нужен отдельный продуктово-технический контур.
3. `SchoolSystem`  
   **Почему:** важен для early-age прогрессии и моста в `education`.

## P2 — отложенные/экспериментальные

1. `ChainResolverSystem` + `DelayedEffectSystem`
2. `LifeMemorySystem`
3. `PersonalitySystem`
4. `TagsSystem`

**Почему:** ценны для глубины симуляции, но не блокируют стабильный rollout core-контуров.

---

## Рекомендуемая последовательность создания документов

### Wave 1 (P0, core stability)

1. `plans/persistence-migration-refresh-plan.md`
2. `plans/work-career-system-refresh-plan.md`
3. `plans/finance-economy-system-refresh-plan.md`
4. `plans/stats-system-refresh-plan.md`

### Wave 2 (P1, explainability + player loop quality)

1. `plans/activity-history-system-refresh-plan.md`
2. `plans/recovery-system-refresh-plan.md`
3. `plans/school-system-refresh-plan.md`

### Wave 3 (P2, depth systems)

1. `plans/chain-delayed-effects-plan.md`
2. `plans/life-memory-system-plan.md`
3. `plans/personality-system-plan.md`
4. `plans/tags-system-plan.md`

---

## Шаблон для каждого нового плана

Для консистентности каждый новый документ должен содержать:

1. `Текущий срез` (as-is, источники данных, wiring).
2. `Проблемы` (P0/P1/P2).
3. `Целевая архитектура` (contracts + boundaries).
4. `Синхронизация с другими системами` (time/events/actions/skills/save-load).
5. `Execution plan` по этапам + оценки.
6. `Telemetry + tests` (unit/integration/contract/regression).
7. `Definition of Done`.

---

## Зависимости и gates

- Любой план, меняющий состояние игрока, обязан иметь явную связку с:
  - `TimeSystem.advanceHours(...)`,
  - `EventQueueSystem` / event ingress policy,
  - save/load совместимость.
- Любой план, меняющий прогрессию, обязан явно описать влияние на:
  - `skills`,
  - `stats`,
  - экономику.
- Rollout каждого плана — через обновление `plans/system-sync-plan.md` (wave gate).

---

## Definition of Done для этой дорожной карты

- [x] Список систем без dedicated-планов зафиксирован.
- [x] Для всех систем назначен приоритет планирования (P0/P1/P2).
- [x] Предложена последовательность создания план-документов (Wave 1/2/3).
- [x] Определены минимальные требования к структуре каждого нового плана.
- [x] Учтены межсистемные зависимости и rollout-gates.
