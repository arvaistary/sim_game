# План: Синхронизация всех обновлённых систем

## Статус: В процессе обновления (2026-04-16)

## Цель

Свести в единый оркестр обновления следующих подсистем:

- учет времени (`time`);
- события (`events`);
- обучение (`education`);
- действия (`actions`);
- навыки (`skills`);
- knowledge/unlock контур (открытие новых действий и навыков).

Итоговая модель должна быть:

- реалистичной;
- предсказуемой;
- объяснимой для игрока;
- безопасной для staged rollout.

---

## Source plans (дочерние документы)

- [Time System Refresh](.cursor/plans/time-system-refresh_1e25bee2.plan.md)
- [Event System Sync](.cursor/plans/event-system-sync_f80a15f4.plan.md)
- [Education Age Context](plans/education-age-context-plan.md)
- [Actions System Refresh](plans/actions-system-refresh-plan.md)
- [Skills System Refresh](plans/skills-system-refresh-plan.md)

Этот документ задает **межсистемные контракты, порядок внедрения и integration gates**.

---

## Текущее состояние проекта (срез)

### Что уже запланировано хорошо

- Есть отдельные детализированные планы по `time`, `events`, `education`, `actions`, `skills`.
- Зафиксирован курс на единые контракты (`advanceHours`, `EventIngress`, `canExecuteWithReason`, skill shape guard).
- Добавлена реалистичная модель обучения (needs, anti-grind, step-based programs).

### Что сейчас нужно синхронизировать

1. **Контракты пересекаются**, но пока описаны в разных документах.
2. **Порядок внедрения** может создать регрессии без общей wave-координации.
3. **ID/shape/проверки** частично расходятся между UI и engine в actions/skills/events.
4. **Knowledge unlock** должен быть встроен как результат обучения, а не отдельный параллельный путь.

---

## Выполненные фазы (2026-04-16)

### Фаза 0 — Baseline
- Baseline test results: 21 test file passed, 1 skipped | 114 tests passed, 3 skipped, 9 todo
- Pre-flight DoD выполнен

### Фаза 1 — Core contracts
- Time: периодические callbacks подключены в system-context
- Event: исправлена дедупликация (instanceId), все системы используют ingress API
- Action: удалено мертвое требование requiresPet, все requirements проверяются в engine
- Skills: SkillsSystem и StatsSystem добавлены в SystemContext, унифицирован skill shape
- Education: ageGroup добавлен ко всем education-actions, minAge добавлен в EducationProgram
- Tests: 114 passed, 0 failed

### Фаза 2 — Wave 1 (P0 stability)
- Stats: удалены дубли _applyStatChanges/_clamp из 5 систем
- Persistence: v1.2.0 с валидацией и backup
- Work/Career: shared helpers, TimeSystem через прямую ссылку
- Finance: все через canonical системы
- Tests: 114 passed, 0 failed

### Фаза 3 — Wave 2 (P1 quality)
- Activity History: EventHistorySystem в SystemContext, улучшенный ActivityLogSystem
- Recovery: P0 рефакторинг, делегирование в canonical системы
- School: интеграция через SystemContext
- Tests: 114 passed, 0 failed

### Фаза 4 — Wave 3 (P2 depth)
- Chain/Delayed Effects: в SystemContext, new системы заменены на canonical
- Life Memory: в SystemContext, trim/limit
- Personality: в SystemContext, BUGFIX 'player' → PLAYER_ENTITY
- Tags: в SystemContext
- Tests: 114 passed, 0 failed

### Фаза 5 — Product alignment
- BUGFIX: TEEN маппинг исправлен (13-15 лет)
- ageGroup добавлен ко всем 207 действиям
- sleep-actions удалены из action-слоя
- Tests: 114 passed, 0 failed

---

## Канонические межсистемные контракты

### 1) Time contract

- Единственный источник времени: `time.totalHours`.
- Изменение времени: только через `TimeSystem.advanceHours(...)`.
- Периодика: week/month/year через централизованные hooks.

### 2) Event contract

- Все доменные события (включая unlock) публикуются через `EventIngress`.
- `instanceId` детерминирован и используется для dedup/history/persistence.
- Единый payload-формат для UI.

### 3) Action availability contract

- Каноническая проверка доступности: engine (`canExecuteWithReason`).
- UI отображает результат engine, а не собственные ad-hoc проверки.
- Для закрытых действий reason-code обязателен.

### 4) Skills contract

- Единый формат навыков (`{ level, xp }` или зафиксированный v1-формат).
- Чтение навыков только через нормализованный helper.
- Никаких прямых `Number(skills[key])` в runtime-критичных системах.

### 5) Education realism contract

- Эффект обучения: `baseEffect * learningEfficiency`.
- `learningEfficiency` включает skills + needs + anti-grind + caps.
- Длинные программы всегда step-based и синхронизированы с временем.

### 6) Knowledge unlock contract

- Обучение может открывать `knowledge nodes`.
- `knowledge nodes` открывают:
  - навыки;
  - новые действия;
  - доступ к программам/карьере (по правилам).
- Unlock проходит через `EventIngress` и фиксируется в save/load.

---

## Integration matrix (кто от кого зависит)

| Система | Зависит от | Что критично синхронизировать |
|--------|------------|-------------------------------|
| `events` | `time` | period hooks, `instanceId`, порядок `advance -> enqueue` |
| `education` | `time`, `events` | step progress + `advanceHours`, milestone events |
| `actions` | `time`, `events`, `skills` | reason-codes, effect pipeline, skill delta application |
| `skills` | `actions`, `education`, `time`, `events` | shape contract, progression, explainability |
| `knowledge unlock` | `education`, `actions`, `skills`, `events` | unlock atomics, gating consistency, dedup |

---

## Wave rollout (единый порядок внедрения)

### Wave A — Foundation & correctness (P0)

**Цель:** убрать критичные рассинхроны контрактов.

- Time: единый time contract, убрать fallback мутации.
- Events: ingress + identity/dedup ядро.
- Actions: schema guards + engine-level reason checks + finance mismatch fix.
- Skills: shape guard + фиксы runtime integrators.

**Go/No-Go:**

- нет критичных regression в `canExecute`, skill-check, finance flows;
- зелёные unit/integration smoke tests;
- save/load совместим.

### Wave B — Orchestration & realism core (P1)

**Цель:** связать системы в общий реалистичный контур.

- Time hooks подключены централизованно.
- Education step-based flow + needs-aware learningEfficiency.
- Events period-safe processing + dedup.
- Actions/Skills синхронизированы по progression/effect pipeline.

**Go/No-Go:**

- period transitions не теряют и не дублируют эффекты;
- обучение корректно меняет время/события/навыки;
- причины блокировок объяснимы в UI.

### Wave C — Unlock progression & explainability (P2)

**Цель:** финально включить “учусь -> открываю -> практикую”.

- Knowledge nodes и action/skill unlock.
- UI explainability (вклад факторов в результат).
- Telemetry/diagnostics для balance tuning.

**Go/No-Go:**

- pilot unlock сценарий проходит end-to-end;
- нет дублей unlock-событий;
- p95 перфоманс в пределах budget.

---

## Реализм: что обязательно учесть между системами

1. **Needs-first реализм**
   - Голод, энергия, настроение влияют на обучение и качество действий.
2. **Diminishing returns**
   - Спам однотипных действий/тренировок снижает отдачу.
3. **Forgetting + reinforcement**
   - Неиспользуемые знания/навыки частично деградируют.
4. **Context matters**
   - Время суток/состояние персонажа/контекст меняют эффективность.
5. **Unlock by competence**
   - Новые действия и карьерные опции открываются не “из воздуха”, а из знаний и навыков.

---

## Короткий общий стартовый спринт (3 дня)

### День 1

- Закрыть P0 контрактные баги (`time`, `events`, `actions`, `skills`).
- Зафиксировать единые reason-codes и skill shape helpers.

### День 2

- Свести action/education pipeline с `advanceHours` + `EventIngress`.
- Поднять integration тесты на критичные цепочки.

### День 3

- Подключить минимальный realism-core (needs + anti-grind + step progress).
- Снять baseline telemetry и включить flags для staged rollout.

---

## Performance and reliability budgets

- `canExecuteWithReason` p95: <= 2 ms на карточку при нормальном каталоге.
- `applyEventChoice` p95: <= 8 ms (без disk I/O).
- `education step progress` p95: <= 5 ms.
- Dedup checks: O(1), без линейного прохода по полной истории.
- Queue growth control: ограничение pending events и стратегия деградации при overflow.

---

## Риски и митигации

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Дублирование логики между планами | средняя | высокое | `system-sync-plan.md` как единый master source |
| Интеграционные регрессии на wave-переходах | средняя | высокое | Go/No-Go gates + feature flags |
| Слишком сложная unlock-граф модель | средняя | среднее | Ограничить prerequisite depth до 2 в v1 |
| Потеря explainability при росте механик | средняя | высокое | обязательные reason codes + trace UI |
| Перфоманс деградация в UI | средняя | среднее | versioned snapshots + memoized selectors |

---

## Definition of Done (master)

- [ ] Все дочерние планы синхронизированы по общим контрактам этого документа.
- [ ] Wave A/B/C пройдены с подтвержденными Go/No-Go критериями.
- [ ] Нет критичных рассинхронов между UI и engine в действиях/навыках/событиях.
- [ ] Реализм-контур (needs, anti-grind, step learning, unlock logic) включен и стабилен.
- [ ] "Education -> Knowledge -> Skill/Action unlock" проходит end-to-end.
- [ ] Save/load и telemetry подтверждают корректность после rollout.

---

## Pre-flight завершён (2026-04-16)

> Результаты выполнения `plans/current-systems-optimization-plan.md`

### Выполненные фиксы

| # | Фикс | Файлы | Статус |
|---|------|-------|--------|
| 1 | Runtime status freeze — реестр систем | `SYSTEM_REGISTRY.md` | ✅ |
| 2 | Skills shape: `_extractLevel` helper, `getSkills/hasSkillLevel/getSkillLevel` | `SkillsSystem/index.ts` | ✅ |
| 3 | ActionSystem minSkills через `SkillsSystem.hasSkillLevel` | `ActionSystem/index.ts` | ✅ |
| 4 | MonthlySettlement делегирует event dedup в `EventQueueSystem` | `MonthlySettlementSystem/index.ts` | ✅ |
| 5 | FinanceActionSystem: прямая ссылка на `TimeSystem` | `FinanceActionSystem/index.ts` | ✅ |
| 6 | EducationSystem: прямая ссылка на `TimeSystem` | `EducationSystem/index.ts` | ✅ |
| 7 | RecoverySystem: прямая ссылка на `TimeSystem` | `RecoverySystem/index.ts` | ✅ |
| 8 | Telemetry module + hooks | `utils/telemetry.ts`, 4 системы | ✅ |
| 9 | Тесты: skills shape, event dedup, telemetry | `test/unit/domain/engine/` | ✅ |

### Готово к Wave A rollout

- **Time contract**: все сдвиги времени идут через `TimeSystem.advanceHours()`, fallback-мутации удалены.
- **Skills contract**: единый `_extractLevel` helper, `getSkills()` возвращает плоский `{ key: level }`.
- **Event dedup**: `EventQueueSystem.queuePendingEvent()` — единственная точка enqueue.
- **Action availability**: reason-codes + telemetry на каждый отказ.
- **Telemetry**: счётчики `action_fail:*`, `event_dedup_hit`, `skill_shape_fallback`, `time_advance_anomaly:*`.

### Тестовый baseline

- 107 тестов проходят (было 88, добавлено 19).
- 0 регрессий.

---

## P0 Closure завершён (2026-04-16)

> Дополнительный план: finance catalog mismatch + единая точка enqueue

### Блок 1 — Finance catalog mismatch

| # | Фикс | Файлы | Статус |
|---|------|-------|--------|
| 1 | `FINANCE_ACTIONS` в engine заменён на полный каталог (6 действий) | `FinanceActionSystem/index.constants.ts` | ✅ |
| 2 | Добавлена обработка `pay_off_small_debt`, `sell_unnecessary_items`, generic deduction | `FinanceActionSystem/index.ts` | ✅ |
| 3 | UI `FinanceActionList.vue` берёт данные из engine через store | `FinanceActionList.vue`, `game.store.ts`, `queries.ts` | ✅ |
| 4 | Contract-check тест: все action.id резолвятся | `finance-contract.test.ts` | ✅ |

### Блок 2 — Единая точка enqueue

| # | Фикс | Файлы | Статус |
|---|------|-------|--------|
| 1 | TimeSystem `maybeTriggerMicroEvent` → `EventQueueSystem.queuePendingEvent()` | `TimeSystem/index.ts` | ✅ |
| 2 | Нет прямых `pendingEvents.push` вне `EventQueueSystem` | audit | ✅ |
| 3 | Dedup invariant тест: повторный enqueue не растит очередь + `event_dedup_hit` | `event-dedup.test.ts` | ✅ |

### Тестовый baseline (обновлённый)

- 114 тестов проходят (было 107, добавлено 7).
- 0 регрессий.
