# Отчёт: текущее состояние системы действий в Game Life

---

## 1. Структура данных действий

### Единого реестра действий НЕ существует

Действия разбросаны по нескольким независимым источникам данных:

| Источник | Файл | Тип действий |
|----------|------|-------------|
| `RECOVERY_TABS` | `game-state.js` | Карточки восстановления (6 табов × 3–5 карточек) |
| `FINANCE_ACTIONS` | `FinanceActionSystem.js` | Финансовые действия (3 шт.) |
| `EDUCATION_PROGRAMS` | `education-programs.js` | Образовательные программы (3 шт.) |
| `CAREER_JOBS` | `career-jobs.js` | Ветки карьеры (4 должности) |
| `WORK_RESULT_TIERS` | `game-state.js` | Тиры результата работы (4 шт.) |
| `WORK_RANDOM_EVENTS` | `game-state.js` | Случайные события на работе (6 шт.) |
| `GLOBAL_PROGRESS_EVENTS` | `game-state.js` | Недельные/возрастные события (3 шт.) |

### Формат карточки действия (recovery card)

```js
{
  title: string,           // Название
  price: number,           // Стоимость в рублях
  dayCost: number,         // Legacy-поле (дни)
  hourCost: number,        // Часовая стоимость (приоритет)
  effect: string,          // Текстовое описание эффектов
  mood: string,            // Описание-подсказка
  statChanges: {           // Изменения шкал (0–100)
    hunger?: number,
    energy?: number,
    stress?: number,
    mood?: number,
    health?: number,
    physical?: number,
  },
  skillChanges?: { [key: string]: number },  // Изменения навыков (0–10)
  housingComfortDelta?: number,    // Изменение комфорта
  housingUpgradeLevel?: number,    // Уровень жилья
  furnitureId?: string,            // ID мебели
  relationshipDelta?: number,      // Изменение отношений
  reserveDelta?: number,           // Пополнение резерва
  investmentReturn?: number,       // Открытие инвестиции
  salaryMultiplierDelta?: number,  // Бонус к ЗП
  educationLevel?: string,         // Уровень образования
}
```

### Дублирование данных

Критическая проблема: **данные баланса дублируются** между ECS-модулями и legacy-файлом `game-state.js`. Например:
- `FINANCE_ACTIONS` определён и в `FinanceActionSystem.js`, и в `game-state.js`
- `CAREER_JOBS` — и в `career-jobs.js`, и в `game-state.js`
- `EDUCATION_PROGRAMS` — и в `education-programs.js`, и в `game-state.js`
- `HOUSING_LEVELS` — и в `housing-levels.js`, и в `game-state.js`

---

## 2. Какие категории действий реализованы

### Детальная сводка по категориям:

| Категория | В GDD | В коде | Покрытие | Сцена |
|-----------|-------|--------|----------|-------|
| **Магазин** | 31 действие | 3 (перекус, обед, продукты) | ~10% | `ShopScene` |
| **Отдых** | 35 действий | 3 (вечер дома, кино, спортзал) | ~9% | `FunScene` |
| **Дом** | 16 действий | 5 (кровать, холодильник, декор, 2 переезда) | ~31% | `HomeScene` |
| **Социальное** | 28 действий | 3 (друг, родители, свидание) | ~11% | `SocialScene` |
| **Образование** | 38 действий | 3 программы (книга, курс, институт) | ~8% | `EducationScene` |
| **Финансы** | 21 действие | 3 (резерв, вклад, бюджет) | ~14% | `FinanceScene` |
| **Карьера** | 16 действий | 4 должности + рабочий период | ~25% | `CareerScene` |
| **Хобби** | 18 действий | **0** | **0%** | **Нет** |
| **Здоровье** | 8 действий | **0** | **0%** | **Нет** |
| **Саморазвитие** | 6 действий | **0** | **0%** | **Нет** |

---

## 3. Как работает система эффектов

### 3.1. Эффекты на шкалы (Stats)

**6 шкал** (определены в `STAT_DEFS` и `StatsSystem`):

| Ключ | Метка | Диапазон |
|------|-------|----------|
| `hunger` | Голод | 0–100 |
| `energy` | Энергия | 0–100 |
| `stress` | Стресс | 0–100 |
| `mood` | Настроение | 0–100 |
| `health` | Здоровье | 0–100 |
| `physical` | Физическая форма | 0–100 |

**Применение эффектов** — простое сложение с clamp:
```js
// StatsSystem.applyStatChanges()
stats[key] = clamp((stats[key] ?? 0) + value, 0, 100);
```

**Пассивные бонусы** от жилья/мебели применяются в `RecoverySystem._getPassiveBonuses()`:
- `foodRecoveryMultiplier` — холодильник (+20%) + комфорт
- `workEnergyMultiplier` — хорошая кровать + комфорт
- `homeMoodBonus` — декор/свет + комфорт + уровень жилья

**Модификаторы навыков** пересчитываются через `recalculateSkillModifiers()` — 25+ множителей, которые могут влиять на:
- Множитель расхода энергии (`energyDrainMultiplier`)
- Множитель набора стресса (`stressGainMultiplier`)
- Множитель восстановления настроения (`moodRecoveryMultiplier`)
- И т.д.

### 3.2. Эффекты на навыки (Skills)

**Навыки** — 39 штук в 4 категориях (определены в `skills-constants.js`):
- **Базовые** (15): `timeManagement`, `communication`, `financialLiteracy`, `healthyLifestyle`, `adaptability`, `discipline`, `physicalFitness`, `emotionalIntelligence`, `organization`, `basicCreativity`, `stressResistance`, `selfControl`, `curiosity`, `empathy`, `memory`
- **Профессиональные** (15): `professionalism`, `leadership`, `negotiations`, `analyticalThinking`, `specialization`, `stressResistancePro`, `technicalLiteracy`, `cooking`, `marketing`, `financialAnalysis`, `personnelManagement`, `sales`, `strategicPlanning`, `legalLiteracy`, `medicalKnowledge`
- **Социальные** (10): `charisma`, `humor`, `patience`, `optimism`, `responsibility`, `flexibleThinking`, `generosity`, `selfDisciplineExtended`, `intuition`, `wisdom`
- **Творческие** (10): `artisticMastery`, `musicalAbility`, `writing`, `photography`, `gardening`, `handiness`, `dance`, `acting`, `interiorDesign`, `culinaryArt`

**Применение** — через `SkillsSystem.applySkillChanges()`:
```js
skills[key] = clamp(oldValue + value, 0, 10);
// Затем: recalculateModifiers() — пересчитывает все 25+ модификаторов
```

**Модификаторы** — мультипликативные, с clamp в разумных пределах (функция `clampSkillModifiers()`).

### ⚠️ Важный недостаток
GDD (раздел 5.2) определяет **почасовые ставки изменения шкал** (Голод: -2.2/ч при работе, Энергия: +6.8/ч при сне и т.д.). **Текущая реализация не использует почасовые ставки** — вместо этого каждое действие задаёт фиксированные значения `statChanges`, которые не масштабируются пропорционально `hourCost`.

---

## 4. Как работает система времени

### Часовая модель реализована в `TimeSystem`

- `advanceHours(n)` — основная функция, добавляет n часов
- `totalHours` — накапливает общее время
- `normalizeTimeComponent()` — вычисляет производные: gameDays, gameWeeks, gameMonths, currentAge
- Отслеживаются: `hourOfDay`, `dayHoursRemaining`, `weekHoursRemaining`
- При переходе границ: `_triggerWeeklyEvents`, `_triggerMonthlyEvents`, `_triggerYearlyEvents`, `_triggerAgeEvents`

**Ключевые константы:**
- `HOURS_IN_DAY = 24`
- `HOURS_IN_WEEK = 168`
- `WEEKS_IN_MONTH = 4`
- `MONTHS_IN_YEAR = 12`
- `DAYS_IN_AGE_YEAR = 360`

**Расход времени действиями:**
- Каждое действие имеет `hourCost` (приоритет) или `dayCost` (legacy, конвертируется через `dayCost * 2`)
- `RecoverySystem.applyRecoveryAction()` → `timeSystem.advanceHours(hourCost, ...)`
- `FinanceActionSystem.applyFinanceAction()` → `timeSystem.advanceHours(hourCost, ...)`
- Работа → `WorkPeriodSystem.applyWorkShift(workHours)`

**Отслеживание сна** — есть поля `sleepHoursToday` и `sleepDebt`, но **штрафы за недосып не реализованы**.

---

## 5. Как работает финансовая система

### Компоненты финансов:

- `wallet.money` — свободные деньги
- `finance.reserveFund` — резерв
- `investment[]` — активные инвестиции
- `totalSpent` — потрачено всего

### Потоки денег:

1. **Доход от работы** — через `WorkPeriodSystem`: `доход = отработанные_часы × ставка_в_час × модификаторы`
2. **Расходы на действия** — `wallet.money -= cardData.price` (в `RecoverySystem`)
3. **Месячные расходы** — через `MonthlySettlementSystem.applyMonthlySettlement()`:
   - Базовые расходы × `dailyExpenseMultiplier` − `passiveIncomeBonus`
   - Сначала списываются свободные деньги, затем резерв
   - При дефиците → штрафы к стресс/настроение/здоровье + событие «кассовый разрыв»
4. **Инвестиции** — вклады с фиксированной доходностью, модифицированной `investmentReturnMultiplier`

### Карьера и ЗП:

4 должности в `CAREER_JOBS` — от «Офисный сотрудник» (1050 ₽/ч) до «Тимлид» (1950 ₽/ч). ЗП модифицируется `salaryMultiplier` от навыков.

---

## 6. Какие сцены отображают действия

| Сцена | Файл | Что показывает |
|-------|------|---------------|
| `MainGameSceneECS` | Главный экран | Профиль, шкалы, навигация, кнопка «Пойти на работу» |
| `HomeScene` | Дом | 5 карточек: мебель (3 шт.) + переезды (2 шт.) |
| `ShopScene` | Магазин | 3 карточки: перекус, обед, продукты |
| `FunScene` | Развлечения | 3 карточки: вечер дома, кино, спортзал |
| `SocialScene` | Соц. жизнь | 3 карточки: друг, родители, свидание |
| `EducationScene` | Обучение | 3 программы + активные курсы с прогрессом |
| `FinanceScene` | Финансы | Обзор, расходы, 3 действия, инвестиции |
| `CareerScene` | Карьера | 4 должности с требованиями |
| `EventQueueScene` | События | Очередь событий с выбором |
| `SkillsScene` | Навыки | Обзор навыков |

**Базовый класс** `RecoveryTabSceneCore` — общая сцена для Home/Shop/Fun/Social, рендерит карточки из `RECOVERY_TABS` с прокруткой, валидацией денег/времени и модальными окнами.

**Навигация** (определена в `NAV_ITEMS`): home, shop, fun, education, skills, social, finance.

---

## 7. Чего НЕ хватает для полной системы действий (по GDD 04_balance.md)

### 🔴 Критические пробелы

| # | Проблема | GDD | Текущее состояние |
|---|----------|-----|-------------------|
| 1 | **Нет единого реестра действий** | Все действия в одном формате | Действия размазаны по 7+ файлам, дублируются |
| 2 | **Нет почасовых ставок шкал** | Раздел 5.2: Голод -2.2/ч при работе, Энергия +6.8/ч при сне | Flat-значения в `statChanges` без связи с `hourCost` |
| 3 | **Нет 3 категорий действий** | Хобби (18), Здоровье (8), Саморазвитие (6) | 0 действий, 0 сцен |
| 4 | **Крайне мало действий** | ~220 действий в GDD | ~23 действия + 4 должности |

### 🟡 Существенные пробелы

| # | Проблема | Описание |
|---|----------|----------|
| 5 | **Нет штрафов за недосып** | `sleepDebt` считается, но не влияет на игру |
| 6 | **Нет возрастных штрафов** | GDD: после 40 лет негативные эффекты +0.5–1%/год |
| 7 | **Нет системы подписок** | GDD: фитнес-абонемент, онлайн-сервисы с ежемесячной оплатой |
| 8 | **Нет системы хобби-дохода** | GDD: хобби может приносить доход через `hobbyIncomeMultiplier` |
| 9 | **Нет системы здоровья/смерти** | GDD: Health < 10 → Game Over |
| 10 | **Нет карьерных действий** | GDD: 16 действий (нетворкинг, собеседование, сверхурочная и т.д.) |
| 11 | **Нет кредитной системы** | GDD: кредиты, долги, ипотека |
| 12 | **Нет системы страхования** | GDD: страхование жизни/здоровья |
| 13 | **Мало уровней жилья** | GDD: 5 уровней (от Комнаты до Дома), в коде: 3 уровня |
| 14 | **Мало карьерных веток** | GDD: 5 уровней от Курьера до Менеджера, в коде: 4 уровня (от Офисного сотрудника) |

### 🟢 Архитектурные проблемы

| # | Проблема | Решение |
|---|----------|---------|
| 15 | **Дублирование данных** между `game-state.js` и ECS-модулями | Удалить legacy-копии, оставить единственный источник в `src/balance/` |
| 16 | **Два пути применения действий** (legacy `game-state.js` и ECS `RecoverySystem`) | Унифицировать через ECS-путь |
| 17 | **Действия не валидируют время** в legacy-пути | RecoveryTabSceneCore проверяет `dayHoursRemaining`, но legacy-функции — нет |
| 18 | **Нет условий доступности действий** | GDD предполагает требования (навыки, возраст, образование) для многих действий, но текущий формат карточки не имеет `requirements` |

### Количественная сводка:

```
Всего действий в GDD:     ~220
Реализовано действий:      ~23  (≈10%)
Реализовано категорий:     7 из 10
Реализовано сцен:         10 из 13 необходимых
```
