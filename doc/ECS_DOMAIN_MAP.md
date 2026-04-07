# Карта соответствия домена game-state → ECS

## Обзор
Документ отображает текущие функции из `game-state.js` на будущие ECS-компоненты и системы.

## Доменные области

### 1. Core Loop (Time/Work/Recovery)

| Функция game-state | Тип | ECS Component | ECS System | Приоритет |
|--------------------|-----|---------------|------------|-----------|
| `advanceGameTime` | Мутация | `TimeComponent` | `TimeSystem` | P0 |
| `applyWorkPeriodResult` | Мутация | `WorkComponent`, `CareerComponent` | `WorkPeriodSystem` | P0 |
| `applyWorkOutcomeToSave` | Мутация | `WorkComponent` | `WorkDaySystem` | P0 |
| `applyRecoveryActionToSave` | Мутация | `RecoveryComponent` | `RecoverySystem` | P0 |
| `buildWorkPeriodSummary` | UI | - | `WorkSummarySystem` (read-only) | P1 |
| `buildWorkSummary` | UI | - | `WorkSummarySystem` (read-only) | P1 |

**Components:**
- `TimeComponent`: `gameDays`, `gameWeeks`, `gameMonths`, `gameYears`, `currentAge`, `startAge`
- `WorkComponent`: `daysAtWork`, `totalWorkDays`, `salaryPerDay`, `salaryPerWeek`
- `RecoveryComponent`: `dayCost`, `statChanges`, `skillChanges`

**Systems:**
- `TimeSystem`: управление временем, запуск недельных/месячных событий
- `WorkPeriodSystem`: обработка рабочих периодов (несколько дней)
- `WorkDaySystem`: обработка одного рабочего дня
- `RecoverySystem`: обработка действий восстановления

---

### 2. Stats & Skills

| Функция game-state | Тип | ECS Component | ECS System | Приоритет |
|--------------------|-----|---------------|------------|-----------|
| `applyStatChanges` | Мутация | `StatsComponent` | `StatsSystem` | P0 |
| `applySkillChanges` | Мутация | `SkillsComponent` | `SkillsSystem` | P0 |
| `getPassiveBonuses` | Вычисление | `HousingComponent`, `StatsComponent` | `PassiveBonusSystem` | P1 |

**Components:**
- `StatsComponent`: `hunger`, `energy`, `stress`, `mood`, `health`, `physical`
- `SkillsComponent`: `professionalism`, `communication`, `timeManagement`, `healthyLifestyle`, `financialLiteracy`, `stressResistance`

**Systems:**
- `StatsSystem`: применение изменений к статистике (с clamp)
- `SkillsSystem`: применение изменений к навыкам (с clamp 0-10)
- `PassiveBonusSystem`: расчёт пассивных бонусов от жилья и мебели

---

### 3. Career

| Функция game-state | Тип | ECS Component | ECS System | Приоритет |
|--------------------|-----|---------------|------------|-----------|
| `getCareerTrack` | Чтение | `CareerComponent`, `SkillsComponent`, `EducationComponent` | `CareerQuerySystem` (read-only) | P0 |
| `syncCareerProgress` | Мутация | `CareerComponent` | `CareerProgressSystem` | P0 |

**Components:**
- `CareerComponent`: `id`, `name`, `level`, `daysAtWork`, `salaryPerDay`, `salaryPerWeek`

**Systems:**
- `CareerQuerySystem`: вычисление доступных работ на основе навыков/образования
- `CareerProgressSystem`: автоматическое повышение при достижении требований

---

### 4. Finance

| Функция game-state | Тип | ECS Component | ECS System | Приоритет |
|--------------------|-----|---------------|------------|-----------|
| `getFinanceOverview` | Чтение | `WalletComponent`, `FinanceComponent` | `FinanceQuerySystem` (read-only) | P0 |
| `getFinanceActions` | Чтение | `WalletComponent` | `FinanceActionSystem` (read-only) | P0 |
| `applyFinanceActionToSave` | Мутация | `WalletComponent`, `FinanceComponent` | `FinanceActionSystem` | P0 |
| `collectInvestmentToSave` | Мутация | `InvestmentComponent`, `WalletComponent` | `InvestmentSystem` | P1 |
| `applyMonthlyFinanceSettlement` | Мутация | `WalletComponent`, `FinanceComponent` | `MonthlySettlementSystem` | P1 |

**Components:**
- `WalletComponent`: `money`, `totalEarnings`, `totalSpent`
- `FinanceComponent`: `reserveFund`, `monthlyExpenses`, `lastMonthlySettlement`
- `InvestmentComponent`: `id`, `type`, `amount`, `expectedReturn`, `maturityDay`, `status`

**Systems:**
- `FinanceQuerySystem`: обзор финансов, расчёт баланса
- `FinanceActionSystem`: применение финансовых действий (резерв, депозит, бюджет)
- `InvestmentSystem`: управление инвестициями, закрытие вкладов
- `MonthlySettlementSystem**: месячный расчёт расходов

---

### 5. Housing

| Функция game-state | Тип | ECS Component | ECS System | Приоритет |
|--------------------|-----|---------------|------------|-----------|
| `getHousingOverview` | Чтение | `HousingComponent`, `FurnitureComponent[]` | `HousingQuerySystem` (read-only) | P0 |
| `shiftHousingLevel` | Мутация | `HousingComponent`, `FinanceComponent` | `HousingUpgradeSystem` | P0 |
| `applyWeeklyHousingPassive` | Мутация | `HousingComponent`, `StatsComponent` | `HousingPassiveSystem` | P1 |
| `hasFurniture` | Чтение | `FurnitureComponent[]` | - | P1 |

**Components:**
- `HousingComponent`: `level`, `name`, `comfort`, `lastWeeklyBonus`
- `FurnitureComponent`: `id`, `level`

**Systems:**
- `HousingQuerySystem**: обзор жилья, расчёт бонусов
- `HousingUpgradeSystem`: изменение уровня жилья
- `HousingPassiveSystem**: недельные бонусы от жилья и мебели

---

### 6. Education

| Функция game-state | Тип | ECS Component | ECS System | Приоритет |
|--------------------|-----|---------------|------------|-----------|
| `canStartEducationProgram` | Валидация | `EducationComponent`, `WalletComponent` | `EducationValidationSystem` | P0 |
| `startEducationProgram` | Мутация | `EducationComponent`, `WalletComponent` | `EducationSystem` | P0 |
| `advanceEducationCourseDay` | Мутация | `EducationComponent`, `StatsComponent` | `EducationProgressSystem` | P1 |

**Components:**
- `EducationComponent`: `school`, `institute`, `educationLevel`, `activeCourses[]`

**Systems:**
- `EducationValidationSystem`: проверка возможности начала обучения
- `EducationSystem`: начало образовательной программы
- `EducationProgressSystem**: продвижение учебного курса

---

### 7. Events

| Функция game-state | Тип | ECS Component | ECS System | Приоритет |
|--------------------|-----|---------------|------------|-----------|
| `pickWorkPeriodEvent` | Генерация | `WorkComponent`, `SkillsComponent`, `EducationComponent` | `EventGeneratorSystem` | P0 |
| `pickWorkEvent` | Генерация | `WorkComponent`, `SkillsComponent`, `EducationComponent` | `EventGeneratorSystem` | P0 |
| `consumePendingEvent` | Мутация | `EventQueueComponent` | `EventQueueSystem` | P0 |
| `applyQueuedEventChoice` | Мутация | `EventQueueComponent`, все компоненты | `EventChoiceSystem` | P0 |
| `queuePendingEvent` | Мутация | `EventQueueComponent` | `EventQueueSystem` | P1 |
| `recordEvent` | Мутация | `EventHistoryComponent` | `EventHistorySystem` | P1 |
| `enqueueProgressEvents` | Мутация | `EventQueueComponent`, `TimeComponent` | `ProgressEventSystem` | P1 |

**Components:**
- `EventQueueComponent`: `pendingEvents[]`
- `EventHistoryComponent`: `eventHistory[]`, `totalEvents`

**Systems:**
- `EventGeneratorSystem`: генерация случайных событий (работа, глобальные)
- `EventQueueSystem`: управление очередью событий
- `EventChoiceSystem**: применение выбора события
- `EventHistorySystem**: запись истории событий
- `ProgressEventSystem`: генерация событий прогресса (недельные, по возрасту)

---

### 8. Persistence

| Функция game-state | Тип | ECS Component | ECS System | Приоритет |
|--------------------|-----|---------------|------------|-----------|
| `loadSave` | Чтение | Все компоненты | `PersistenceSystem` | P0 |
| `saveGame` | Запись | Все компоненты | `PersistenceSystem` | P0 |
| `persistSave` | Запись + registry | Все компоненты | `PersistenceSystem` | P0 |

**Components:**
- Все компоненты (сохраняются как единый saveData объект)

**Systems:**
- `PersistenceSystem`: загрузка/сохранение, миграция версий

---

## Константы и данные

| Константа | Тип | ECS Расположение | Приоритет |
|-----------|-----|-----------------|-----------|
| `DEFAULT_SAVE` | Data | `src/ecs/data/default-save.js` | P0 |
| `RECOVERY_TABS` | Data | `src/ecs/data/recovery-tabs.js` | P0 |
| `EDUCATION_PROGRAMS` | Data | `src/ecs/data/education-programs.js` | P0 |
| `CAREER_JOBS` | Data | `src/ecs/data/career-jobs.js` | P0 |
| `HOUSING_LEVELS` | Data | `src/ecs/data/housing-levels.js` | P0 |
| `FINANCE_ACTIONS` | Data | `src/ecs/data/finance-actions.js` | P0 |
| `WORK_RESULT_TIERS` | Data | `src/ecs/data/work-result-tiers.js` | P0 |
| `WORK_RANDOM_EVENTS` | Data | `src/ecs/data/work-random-events.js` | P0 |
| `GLOBAL_PROGRESS_EVENTS` | Data | `src/ecs/data/global-progress-events.js` | P0 |
| `FINANCE_EMERGENCY_EVENTS` | Data | `src/ecs/data/finance-emergency-events.js` | P0 |

---

## Feature Slices для поэтапного переноса

### Срез A: Work Period + Stat Changes + Time (P0)
**Components:**
- `TimeComponent`
- `StatsComponent`
- `WorkComponent`

**Systems:**
- `TimeSystem`
- `StatsSystem`
- `WorkPeriodSystem`

**Мигрируемые функции:**
- `advanceGameTime`
- `applyStatChanges`
- `applyWorkPeriodResult`
- `buildWorkPeriodSummary`

---

### Срез B: Recovery Actions + Validation (P0)
**Components:**
- `RecoveryComponent`
- `WalletComponent`

**Systems:**
- `RecoverySystem`
- `WalletValidationSystem`

**Мигрируемые функции:**
- `applyRecoveryActionToSave`
- `validateRecoveryAction`

---

### Срез C: Career Progression (P0)
**Components:**
- `CareerComponent`
- `SkillsComponent`

**Systems:**
- `CareerProgressSystem`
- `CareerQuerySystem`

**Мигрируемые функции:**
- `getCareerTrack`
- `syncCareerProgress`

---

### Срез D: Finance Settlements/Investments (P1)
**Components:**
- `WalletComponent`
- `FinanceComponent`
- `InvestmentComponent`

**Systems:**
- `FinanceQuerySystem`
- `FinanceActionSystem`
- `InvestmentSystem`
- `MonthlySettlementSystem`

**Мигрируемые функции:**
- `getFinanceOverview`
- `getFinanceActions`
- `applyFinanceActionToSave`
- `collectInvestmentToSave`
- `applyMonthlyFinanceSettlement`

---

## Минимальный ECS-скоуп первой итерации

**Компоненты (P0):**
1. `TimeComponent`
2. `StatsComponent`
3. `WorkComponent`
4. `RecoveryComponent`
5. `WalletComponent`
6. `CareerComponent`
7. `SkillsComponent`

**Системы (P0):**
1. `TimeSystem`
2. `StatsSystem`
3. `SkillsSystem`
4. `WorkPeriodSystem`
5. `RecoverySystem`
6. `CareerProgressSystem`
7. `PersistenceSystem`

**Сцены для первой итерации:**
- `MainGameScene` (с SceneAdapter)
- `RecoveryScene` (с SceneAdapter)

**Функции game-state, которые останутся как fallback:**
- Все функции P1 и ниже приоритета
- Чтение данных для UI (overview функции)
- Валидация действий
