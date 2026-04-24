# План: Оптимизация текущих систем (pre-flight)

## Статус: ✅ Завершено (2026-04-16)

## Цель

Стабилизировать текущую архитектуру в её существующем виде, убрать критичные рассинхроны и технические долги, чтобы безопасно перейти к уже подготовленным планам:

- `plans/system-sync-plan.md`
- `plans/time-system-refresh.plan.md` / `.cursor/plans/time-system-refresh_1e25bee2.plan.md`
- `.cursor/plans/event-system-sync_f80a15f4.plan.md`
- `plans/education-age-context-plan.md`
- `plans/actions-system-refresh-plan.md`
- `plans/skills-system-refresh-plan.md`

---

## Scope

### In scope

- Аудит и стабилизация текущего runtime wiring систем.
- Исправление критичных несоответствий UI/engine (actions, skills, events, finance).
- Минимальная унификация контрактов без полного редизайна.
- Тестовая и telemetry-база для безопасного перехода к следующим фазам.

### Out of scope

- Полная архитектурная переработка каждой системы.
- Глубокий ребаланс экономики/прогрессии.
- Массовая миграция контента за один релиз.

---

## Runtime inventory (текущее состояние)

| Система | Статус | Комментарий |
|--------|--------|-------------|
| `ActionSystem` | Active | Основной контур карточек действий |
| `ActivityLogSystem` | Active | Логи активности, подключена явно |
| `CareerProgressSystem` | Active | Используется через фасад |
| `EducationSystem` | Active | Отдельный контур программ обучения |
| `EventChoiceSystem` | Active | Резолв событий |
| `EventQueueSystem` | Active | Очередь событий |
| `FinanceActionSystem` | Active | Отдельный finance-контур |
| `InvestmentSystem` | Active | Инвестиционный контур |
| `MonthlySettlementSystem` | Active | Ежемесячные расчеты |
| `RecoverySystem` | Active | Recovery-tabs поток |
| `SkillsSystem` | Active (embedded) | Встроен в другие системы |
| `StatsSystem` | Active (embedded) | Встроен в Action/другие |
| `TimeSystem` | Active | Каноническое игровое время |
| `WorkPeriodSystem` | Active | Работа и weekly flow |
| `ChainResolverSystem` | Partial | Есть в коде, не в основном wiring |
| `DelayedEffectSystem` | Partial | Есть, но не в базовом orchestrator |
| `EventHistorySystem` | Partial | Есть модуль, но запись истории размазана |
| `LifeMemorySystem` | Partial | Есть, но не в основном потоке |
| `MigrationSystem` | Partial | Наличие есть, runtime-роль ограничена |
| `PersonalitySystem` | Partial | Используется локально |
| `SchoolSystem` | Partial | Есть, но не в основном контуре |
| `TagsSystem` | Partial | Есть, но слабая интеграция |
| `PersistenceSystem` | Active (через world/store) | Работает, но нужна контрактная стабилизация |

---

## Ключевые проблемы “здесь и сейчас”

### P0 — блокеры

1. **UI/engine рассинхрон finance actions** (id/наборы действий).
2. **Skills shape рассинхрон** (`number` vs `{ level, xp }`) в части систем.
3. **Event dedup/history несогласованность** (`instanceId` vs `eventId`).
4. **Возрастные ограничения местами UI-only** (не дублируются engine-проверками).

### P1 — важное до масштабных изменений

1. Часть систем “partial” не имеет явно задокументированного статуса (active/experimental).
2. Дубли source-of-truth для данных действий/эффектов.
3. Недостаточная объяснимость причин недоступности и результатов.
4. Недостаток integration-тестов на сквозные цепочки.

### P2 — полировка

1. Перфоманс hot-path (`canExecute`, repeated selectors, save churn).
2. Унификация telemetry и диагностик.
3. Cleanup legacy paths после стабилизации.

---

## Execution plan

### Этап 1: Runtime status freeze (P0, S)

- Зафиксировать официальный статус систем: `Active / Partial / Dormant`.
- Пометить Partial-системы как:
  - `experimental`, или
  - `planned integration`, или
  - `deprecated candidate`.

**Выход:** прозрачная карта runtime перед изменениями.

### Этап 2: Контрактные фиксы ядра (P0, M)

- Actions:
  - исправить finance id mismatch;
  - минимально унифицировать проверки доступности на engine уровне.
- Skills:
  - ввести единый helper чтения skill level;
  - убрать критичные прямые чтения по старому shape.
- Events:
  - стабилизировать dedup key (`instanceId`) в ключевых путях.

**Выход:** критичные баги консистентности закрыты.

### Этап 3: Минимальная оркестрация времени/событий (P0/P1, M)

- Убедиться, что все системно важные сдвиги времени идут через `TimeSystem`.
- Зафиксировать порядок: `action/command -> time -> event enqueue -> resolve/log`.
- Убрать критичные fallback-мутации времени там, где они ломают консистентность.

**Выход:** основной lifecycle стабилен.

### Этап 4: Observability и причинность (P1, M)

- Ввести базовые reason-codes для отказов по actions/education.
- Добавить ключевые telemetry-счетчики:
  - action fail reasons,
  - event dedup hits,
  - skill shape fallback hits,
  - time advance anomalies.

**Выход:** система измерима и дебажима.

### Этап 5: Тестовый safety-net (P1, M)

- Unit:
  - actions availability,
  - skills shape helpers,
  - event dedup invariants.
- Integration:
  - action -> time -> event -> log;
  - finance flow;
  - education step flow.
- Save/load contract tests на ключевые компоненты.

**Выход:** регрессии ловятся до перехода к крупным планам.

### Этап 6: Pre-handoff к большим планам (P2, S)

- Обновить `system-sync-plan` фактическим статусом после стабилизации.
- Сформировать список “готово к phase rollout” для time/event/education/actions/skills.

**Выход:** чистая точка входа в ранее подготовленные планы.

---

## Быстрый старт (3 дня)

### День 1

- Runtime status freeze.
- Finance actions mismatch fix.
- Skills shape P0 fix в критичных системах.

### День 2

- Event dedup ключи на основных путях.
- Engine-level availability checks для критичных ограничений.
- Time lifecycle sanity check.

### День 3

- Integration smoke tests.
- Telemetry hooks + базовые dashboards/log points.
- Handoff-note в `system-sync-plan`.

---

## Зависимости

- Базируется на текущем runtime и существующих планах.
- Должен быть завершен до запуска “Wave B/C” в `plans/system-sync-plan.md`.

---

## Оценка трудозатрат

| Этап | Время |
|------|-------|
| Этап 1 | 0.5–1 ч |
| Этап 2 | 2–4 ч |
| Этап 3 | 1–3 ч |
| Этап 4 | 1–2 ч |
| Этап 5 | 2–4 ч |
| Этап 6 | 0.5–1 ч |
| **Итого** | **7–15 часов** |

---

## Definition of Done

- [x] Есть зафиксированная runtime-карта систем (Active/Partial/Dormant).
- [x] Закрыты критичные рассинхроны actions/skills/events/time.
- [x] Основные команды работают в едином lifecycle-порядке.
- [x] Добавлены базовые reason-codes и telemetry по отказам/аномалиям.
- [x] Есть integration safety-net для ключевых пользовательских сценариев.
- [x] Подготовлен handoff к крупным планам без P0-долгов.
