# Обзор проекта Game Life

> **Версия документации:** 2.0
> **Дата обновления:** 19 апреля 2026

---

## Содержание

1. [Навигация и маршрутизация](#1-навигация-и-маршрутизация)
2. [Страницы игры](#2-страницы-игры)
3. [ECS системы](#3-ecs-системы)
4. [Взаимосвязи механик](#4-взаимосвязи-механик)
5. [Потоки данных](#5-потоки-данных)
6. [Техническая архитектура](#6-техническая-архитектура)

---

## 1. Навигация и маршрутизация

### 1.1 Конфигурация навигации

Навигация определена в `src/constants/navigation.ts`:

```typescript
export const NAV_ITEMS: NavItem[] = [
  { id: 'home', icon: 'H', label: 'Недвижимость' },
  { id: 'shop', icon: 'М', label: 'Магазин' },
  { id: 'actions', icon: 'Д', label: 'Действия' },
  { id: 'work', icon: 'Р', label: 'Работа' },
  { id: 'education', icon: 'О', label: 'Обучение' },
  { id: 'skills', icon: 'Н', label: 'Навыки' },
  { id: 'finance', icon: 'Ф', label: 'Финансы' },
  { id: 'activityLog', icon: '📋', label: 'Журнал' },
]

export const ROUTE_MAP: Record<string, string> = {
  home: '/game/home',
  shop: '/game/shop',
  actions: '/game/actions',
  work: '/game/work',
  education: '/game/education',
  skills: '/game/skills',
  finance: '/game/finance',
  activityLog: '/game/activity',
}
```

### 1.2 Ограничения по возрасту

Возрастные ограничения для вкладок определены в `src/composables/useAgeRestrictions.ts`:

| Вкладка | Возраст разблокировки |
|---------|---------------------|
| Недвижимость | 18 лет |
| Магазин | 0 лет |
| Действия | 0 лет |
| Работа | 18 лет |
| Обучение | 16 лет |
| Навыки | 0 лет |
| Финансы | 16 лет |
| Журнал | 0 лет |

### 1.3 Компонент навигации

`GameNav.vue` (`src/components/global/GameNav/GameNav.vue`) отвечает за:
- Отображение списка вкладок с иконками
- Подсветку активной страницы
- Блокировку недоступных вкладок (с иконкой 🔒)
- Показ toast-уведомлений при клике на заблокированные вкладки

---

## 2. Страницы игры

### 2.1 Обзор страниц

| Страница | Маршрут | Основные компоненты | Ключевые системы |
|---------|---------|------------------|----------------|
| **Работа** | `/game/work` | `CurrentJobPanel`, `WorkTabs`, `IndustryFilter`, `JobCards` | `CareerProgressSystem`, `WorkPeriodSystem` |
| **Обучение** | `/game/education` | `EducationLevel`, `ProgramList`, `ActionCardList` | `EducationSystem` |
| **Навыки** | `/game/skills` | `SkillList`, `SkillCard` | `SkillsSystem` |
| **Действия** | `/game/actions` | `ActionTabs`, `ActionCardList` | `ActionSystem` |
| **Финансы** | `/game/finance` | `BalancePanel`, `ExpenseList`, `ActionCardList` | `FinanceActionSystem`, `InvestmentSystem` |
| **Магазин** | `/game/shop` | `ShopCategoryTabs`, `ShopItemList` | `ActionSystem` |
| **Недвижимость** | `/game/home` | `HousingPanel`, `FurnitureGrid` | `ActionSystem`, `HousingSystem` |
| **Журн��л** | `/game/activity` | `ActivityLogList`, `ActivityFilter` | `ActivityLogSystem` |

---

### 2.2 Страница «Работа» (`/game/work`)

**Файл:** `src/pages/game/work/index.vue`

**Назначение:** Устройство на работу, выбор вакансий, карьерный рост

**Компоненты:**
- `CurrentJobPanel` — текущая должность, ЗП, уровень
- Фильтр по типу (полная занятость / фриланс / подработка)
- Фильтр по индустрии (IT / медицина / образование / etc.)
- Список вакансий с требованиями

**Данные для отображения:**
```typescript
interface Job {
  id: string;
  name: string;
  level: number;
  salaryPerHour: number;
  salaryPerDay: number;
  salaryPerWeek: number;
  schedule: '5/2' | '2/2' | 'flex' | 'freelance';
  description: string;
  current: boolean;           // текущая работа
  unlocked: boolean;         // доступна для устройства
  missingProfessionalism: number; // недостающий уровень навыка
  educationRequiredLabel: string; // требуемое образование
  effectiveSalaryPerHour: number; // ЗП с учётом модификаторов
}
```

**Требования для разблокировки вакансий:**
- `minProfessionalism` — минимальный уровень навыка «Профессионализм»
- `minEducationRank` — минимальный уровень образования

**Карьерный рост (автоматический):**
При достижении требований к след. должности — автоматическое повышение:
- `CareerProgressSystem.syncCareerProgress()` проверяет и повышает
- Публикует событие `activity:career` в eventBus
- Телеметрия: `career_promotion`

**Связь с другими системами:**
- `SkillsSystem` → проверка `professionalism`
- `EducationSystem` → проверка `educationRank`
- `WorkPeriodSystem` → еженедельные выплаты
- `TimeSystem` → игровое время работы

---

### 2.3 Страница «Обучение» (`/game/education`)

**Файл:** `src/pages/game/education/index.vue`

**Назначение:** Образование, курсы, программы обучения, практика

**Структура (3 вкладки):**

#### 2.3.1 Вкладка «Программы» (`programs`)
- `EducationLevel` — текущий уровень образования (Школа → Колледж → Институт → Аспирантура)
- `ProgramList` — доступные образовательные программы

**Примеры программ:**
| Программа | Стоимость | Длительность | Эффект |
|---------|-----------|--------------|--------|
| Онлайн-курс | 6 500+ ₽ | 24ч | +2 уровня навыка, +3% к ЗП |
| Колледж | 80 000+ ₽ | 160ч | +3 уровня, диплом, +6% к ЗП |
| Институт | 120 000+ ₽ | 320ч | +4 уровня, диплом, +10% к ЗП |

#### 2.3.2 Вкладка «Учёба и навыки» (`study`)
Формальное обучение: курсы, книги, сертификации
- `ActionCardList` с сортировкой по доступности
- Категория: `education`

#### 2.3.3 Вкладка «Практика и привычки» (`practice`)
Лёгкие ежедневные действия: медитация, спорт, чтение
- `ActionCardList`
- Категория: `selfdev`

**Данные образования:**
```typescript
interface Education {
  completedSchool: boolean;
  completedInstitute: boolean;
  educationLevel: string;      // 'none' | 'school' | 'college' | 'bachelor' | 'master' | 'phd'
  currentEducation: string | null;  // ID текущего обучения
  educationProgress: number;    // 0-100%
  educationStartTime: number;    // час начала
  educationEndTime: number;      // плановое окончание
  skillsGained: Record<string, number>; // полученные навыки
}
```

**Особенности механики:**
- Обучение конкурирует с работой за игровое время
- Когнитивная нагрузка (cognitive load) влияет на эффективность
- С возрастом обучение становится сложнее (множитель сложности)
- Максимум 1 активное обучение одновременно
- Возможность прерывания (потеря прогресса)

**Связь с другими системами:**
- `SkillsSystem` → прокачка навыков
- `CareerProgressSystem` → открытие карьерных веток
- `FinanceActionSystem` → оплата обучения
- `TimeSystem` → потребление времени
- `StatsSystem` → влияние на шкалы (усталость, стресс)

---

### 2.4 Страница «Навыки» (`/game/skills`)

**Файл:** `src/pages/game/skills/index.vue`

**Назначение:** Просмотр и развитие навыков персонажа

**Компоненты:**
- `SkillList` — список всех навыков
- `SkillCard` — карточка навыка с прогрессом

**Доступные навыки:**

| Категория | Навыки |
|-----------|--------|
| **Базовые** | Профессионализм, Тайм-менеджмент, Коммуникация, ЗОЖ, Финансовая грамотность |
| **Продвинутые** | Лидерство, Специализация, Креативность, Аналитика, Переговоры |
| **Физические** | Спорт, Фитнес, Выносливость |
| **Ментальные** | Медитация, Концентрация |
| **Творческие** | Музыка, Рисование, Писательство |

**Данные навыка:**
```typescript
interface Skill {
  key: string;
  level: number;        // 0-10
  xp: number;         // текущий XP
  xpToNextLevel: number; // XP до след. уровня
  category: string;   // 'professional' | 'social' | 'physical' | 'creative'
}

interface SkillModifiers {
  salaryMultiplier: number;    // *= 1 + level * 0.04
  learningSpeed: number;
  stressResistance: number;
  eventResistance: number;
  // ... и др.
}
```

**Механика прокачки:**
- XP модель: `proficiencyScoreToDisplayLevel(xp)`
- Множители: возраст, burnout, обучение, теги
- Источники XP:
  - Действия (`skillChanges` в action)
  - Образование
  - События
  - Работа

**Связь с другими системами:**
- `CareerProgressSystem` → требования для job
- `ActionSystem` → требования для действий
- `EventQueueSystem` → модификаторы событий
- `TagsSystem` → временные бонусы

---

### 2.5 Страница «Действия» (`/game/actions`)

**Файл:** `src/pages/game/actions/index.vue`

**Назначение:** Основной интерфейс выполнения действий

**Категории действий:**
- `fun` — развлечения
- `health` — здоровье
- `social` — социум
- `shop` — покупки
- `home` — дом
- `selfdev` — саморазвитие
- `career` — карьера
- `education` — образование

**Компоненты:**
- `ActionTabs` — переключатель категорий
- `ActionCardList` — список карточек действий

**Структура действия:**
```typescript
interface Action {
  id: string;
  title: string;
  label: string;
  category: ActionCategory;
  actionType: 'fun' | 'work' | 'study' | 'sleep' | 'neutral';
  hourCost: number;      // сколько часов занимает
  price: number;        // стоимость в рублях
  statChanges: StatChanges;  // изменения шкал
  skillChanges: Record<string, number>;  // изменения навыков
  cooldown?: { hours: number };  // кулдаун
  oneTime?: boolean;    // можно выполнить только 1 раз
  ageGroup?: AgeGroup;  // возрастная группа
  requirements?: {
    minAge?: number;
    minSkills?: Record<string, number>;
    housingLevel?: number;
    requiresItem?: string;
    requiresRelationship?: boolean;
  };
}
```

**Проверка доступности (ActionSystem):**
1. Возраст (`minAge`, `ageGroup`)
2. Энергия (≥10 для не-сна)
3. Голод (<80 для не-еды)
4. Деньги (`price`)
5. Время в неделе (`hourCost` ≤ weekHoursRemaining)
6. Кулдаун
7. Требования (навыки, жильё, предметы, отношения)

**Выполнение:**
- `ActionSystem.execute(actionId)`:
  1. Списать деньги
  2. Рассчитать изменения шкал (с модификаторами навыков)
  3. Применить anti-grind (diminishing returns)
  4. Применить изменения `StatsSystem`
  5. Применить изменения `SkillsSystem`
  6. Обновить `TimeSystem` (advanceHours)
  7. Записать в `ActivityLogSystem`
  8. Запустить проверку событий (`EventQueueSystem`)

---

### 2.6 Страница «Финансы» (`/game/finance`)

**Файл:** `src/pages/game/finance/index.vue`

**Назначение:** Управление деньгами, инвестиции, расходы

**Компоненты:**
- `BalancePanel` — текущий баланс кошелька
- `ExpenseList` — список регулярных расходов
- `ActionCardList` — финансовые действия

**Данные кошелька:**
```typescript
interface Wallet {
  money: number;         // доступные средства
  reserveFund: number;   // резервный фонд
  totalEarned: number;   // всего заработано за жизнь
  totalSpent: number;   // всего потрачено за жизнь
}
```

**Данные расходов (ежемесячные):**
```typescript
interface Expense {
  id: string;
  name: string;
  amount: number;
  category: 'housing' | 'food' | 'transport' | 'subscription' | 'other';
  startMonth: number;
  endMonth?: number;
}
```

**Типы финансовых действий:**
| Действие | Эффект |
|----------|--------|
| Положить в резерв | +деньги в reserve |
| Взять из резерва | -деньги из reserve |
| Инвестировать в акции | покупка акций |
| Положить на депозит | +проценты monthly |
| Взять кредит | +деньги, -обязательства |

**Инвестиции:**
- Банковский депозит: 3-5% годовых
- Акции: 5-15% (с волатильностью)
- Бизнес: 10-20% (с риском)

**Ежемесячный расчёт (`MonthlySettlementSystem`):**
1. Начисление зарплаты (`WorkPeriodSystem`)
2. Обработка подписок (`ActionSystem`)
3. Начисление процентов (`InvestmentSystem`)
4. Списание регулярных расходов
5. Проверка событий

---

### 2.7 Страница «Магазин» (`/game/shop`)

**Файл:** `src/pages/game/shop/index.vue`

**Назначение:** Покупка предметов, еды, вещей

**Категории:**
- `groceries` — продукты
- `furniture` — мебель
- `electronics` — электроника
- `clothing` — одежда
- `items` — предметы

**Особенности механики:**
- Влияние на `HousingSystem` (уровень комфорта)
- Предметы дают бонусы (спортивный коврик → доступ к тренировкам дома)
- Одежда влияет на социальные события

---

### 2.8 Страница «Недвижимость» (`/game/home`)

**Файл:** `src/pages/game/home/index.vue`

**Назначение:** Улучшение жилья, покупка мебели

**Уровни жилья:**
```
Комната → Студия → 1-к квартира → 2-к квартира → Дом → Особняк
```

**Бонусы мебели:**
| Предмет | Бонус |
|--------|-------|
| Кровать +15% комфорта | -15% падения Energy за рабочий период |
| Ноутбук | Доступ к удалённой работе |
| Спортковрик | Домашние тренировки |

---

### 2.9 Страница «Журнал» (`/game/activity`)

**Файл:** `src/pages/game/activity/index.vue`

**Назначение:** История действий и событий

**Компоненты:**
- `ActivityLogList` — хронологический список
- `ActivityFilter` — фильтр по типу (действия / события / работа / обучение)

**Данные записи:**
```typescript
interface ActivityLogEntry {
  id: string;
  type: 'action' | 'event' | 'work' | 'education';
  title: string;
  description: string;
  timestamp: number;
  gameTime: {
    totalHours: number;
    day: number;
    week: number;
    month: number;
    year: number;
  };
  metadata: {
    statChanges?: Record<string, number>;
    moneyDelta?: number;
    skillChanges?: Record<string, number>;
  };
}
```

**Ограничение:** Последние 100 записей (с обрезкой старых)

---

## 3. ECS системы

### 3.1 Реестр систем

| Система | Статус | Файл | Назначение |
|---------|--------|------|------------|
| `TimeSystem` | Active | `TimeSystem/index.ts` | Игровое время |
| `StatsSystem` | Active | `StatsSystem/index.ts` | Шкалы персонажа |
| `SkillsSystem` | Active | `SkillsSystem/index.ts` | Навыки и модификаторы |
| `ActionSystem` | Active | `ActionSystem/index.ts` | Выполнение действий |
| `EventQueueSystem` | Active | `EventQueueSystem/index.ts` | Очередь событий |
| `EventChoiceSystem` | Active | `EventChoiceSystem/index.ts` | Выбор в событиях |
| `EventHistorySystem` | Active | `EventHistorySystem/index.ts` | История событий |
| `CareerProgressSystem` | Active | `CareerProgressSystem/index.ts` | Карьерный рост |
| `WorkPeriodSystem` | Active | `WorkPeriodSystem/index.ts` | Рабочие периоды |
| `EducationSystem` | Active | `EducationSystem/index.ts` | Образование |
| `FinanceActionSystem` | Active | `FinanceActionSystem/index.ts` | Финансы |
| `InvestmentSystem` | Active | `InvestmentSystem/index.ts` | Инвестиции |
| `RecoverySystem` | Active | `RecoverySystem/index.ts` | Восстановление |
| `MonthlySettlementSystem` | Active | `MonthlySettlementSystem/index.ts` | Ежемесячный расчёт |
| `ActivityLogSystem` | Active | `ActivityLogSystem/index.ts` | Журнал активности |
| `PersonalitySystem` | Active | `PersonalitySystem/index.ts` | Черты личности (Big Five) |
| `TagsSystem` | Active | `TagsSystem/index.ts` | Временные теги |
| `LifeMemorySystem` | Active | `LifeMemorySystem/index.ts` | Воспоминания |
| `SchoolSystem` | Active | `SchoolSystem/index.ts` | Система школы |
| `AntiGrindSystem` | Active | `AntiGrindSystem/index.ts` | Защита от гринда |
| `MigrationSystem` | Active | `MigrationSystem/index.ts` | Миграции сохранений |
| `PersistenceSystem` | Active | `PersistenceSystem/index.ts` | Сохранение/загрузка |
| `DelayedEffectSystem` | Partial | `DelayedEffectSystem/index.ts` | Отложенные эффекты |
| `ChainResolverSystem` | Partial | `ChainResolverSystem/index.ts` | Цепочки событий |

### 3.2 Компоненты (данные)

Ключевые компоненты в `src/domain/engine/components/index.ts`:

```
TIME_COMPONENT      — игровое время
STATS_COMPONENT   — шкалы (energy, hunger, stress, health...)
SKILLS_COMPONENT  — навыки персонажа
WALLET_COMPONENT — деньги
CAREER_COMPONENT — текущая работа
EDUCATION_COMPONENT — образование
WORK_COMPONENT   — рабочие данные
housingComfort   — комфорт жилья
RELATIONSHIPS_COMPONENT — отношения
SUBSCRIPTION_COMPONENT — подписки
EVENT_QUEUE_COMPONENT — очередь событий
EVENT_HISTORY_COMPONENT — история событий
ACTIVITY_LOG_COMPONENT — журнал активности
```

---

## 4. Взаимосвязи механик

### 4.1 Диаграмма взаимосвязей

```
┌──────────────────────────────────────���─���─────────────────────────────────────────────┐
│                     PLAYER ENTITY                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │  TIME   │ │ STATS  │ │SKILLS  │ │ WALLET │              │
│  └────┬────┘ └───┬────┘ └───┬────┘ └───┬────┘              │
│       │           │          │          │                    │
│       ▼           ▼          ▼          ▼                    │
│  ┌─────────────────────────────────────────┐              │
│  │          ACTION SYSTEM                   │              │
│  │  - Проверка доступности действий        │              │
│  │  - Выполнение действий                   │              │
│  │  - Применение изменений                │              │
│  └──────────────┬─────────────────────────┘              │
│                 │                                          │
│    ┌────────────┼────────────┐                            │
│    ▼            ▼            ▼                            │
│ ┌──────┐  ┌───────┐  ┌──────────┐                       │
│ │STATS │  │SKILLS │  │  TIME   │                       │
│ │SYSTEM│  │SYSTEM │  │ SYSTEM  │                       │
│ └──┬───┘  └──┬────┘  └──────┬───┘                       │
│    │         │               │                            │
│    │         │               │                            │
│    └─────────┴───────────────┘                            │
│                 │                                        │
│       ┌────────┴────────┐                              │
│       ▼                 ▼                              │
│  ┌─────────────┐  ┌─────────────────┐                     │
│  │   CAREER   │  │  EDUCATION     │                     │
│  │ PROGRESS  │  │   SYSTEM      │                     │
│  │ SYSTEM   │  └───────────────┘                     │
│  └────┬────┘                                    │
│       │                                           │
│       │  ┌──────────────────┐                      │
│       ├──┤  EVENT QUEUE   │                      │
│       │  │   SYSTEM      │                      │
│       │  └───────┬────────┘                      │
│       │          │                                │
│       │    ┌────┴────┐                          │
│       │    ▼         ▼                          │
│       │ ┌────────┐ ┌────────────────┐          │
│       │ │CHOICE │ │   HISTORY     │          │
│       │ │SYSTEM │ │   SYSTEM     │          │
│       │ └───────┘ └───────────────┘          │
│       │                                       │
│       │  ┌──────────────────┐              │
│       └──┤ WORK PERIOD    │              │
│          │   SYSTEM      │              │
│          └───────────────┘              │
│                                       │
│          ┌──────────────────┐              │
│          │   FINANCE      │              │
│          │   ACTION      │              │
│          │   SYSTEM     │              │
│          └───────┬──────┘              │
│                  │                     │
│         ┌────────┴────────┐            │
│         ▼                 ▼            │
│   ┌─────────────┐  ┌─────────────┐     │
│   │ INVESTMENT │  │ RECOVERY   │     │
│   │  SYSTEM   │  │  SYSTEM   │     │
│   └───────────┘  └───────────┘     │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Ключевые зависимости

| Система | Зависит от |供应вляет |
|---------|-----------|----------|
| `ActionSystem` | `StatsSystem`, `SkillsSystem`, `TimeSystem` | `ActivityLog`, `EventQueue` |
| `CareerProgressSystem` | `SkillsSystem`, `EducationSystem` | `WorkPeriodSystem` |
| `EducationSystem` | `SkillsSystem`, `TimeSystem`, `StatsSystem` | — |
| `EventQueueSystem` | `TimeSystem` | `EventChoiceSystem` |
| `EventChoiceSystem` | `SkillsSystem`, `StatsSystem` | `EventHistorySystem` |
| `WorkPeriodSystem` | `CareerProgressSystem`, `TimeSystem` | `FinanceActionSystem` |
| `FinanceActionSystem` | `WalletComponent`, `StatsSystem` | `InvestmentSystem` |
| `InvestmentSystem` | `TimeSystem` | — |
| `RecoverySystem` | `StatsSystem`, `TimeSystem` | — |
| `MonthlySettlementSystem` | `WorkPeriodSystem`, `FinanceActionSystem`, `InvestmentSystem` | — |
| `SkillsSystem` | — | `CareerProgress`, `ActionSystem`, `EventQueue` |
| `TagsSystem` | `SkillsSystem` | — |

### 4.3 Примеры взаимодействий

#### 4.3.1 Выполнение рабочего дня
```
ActionSystem.execute('work_day')
  → StatsSystem.applyStatChanges({ energy: -20, stress: +5 })
  → SkillsSystem.applySkillChanges({ professionalism: +1 })
  → TimeSystem.advanceHours(8)
  → ActivityLogSystem.record()
  → WorkPeriodSystem.addHours(8)
  → EventQueueSystem.checkMicroEvents()
```

#### 4.3.2 Карьерный рост
```
CareerProgressSystem.syncCareerProgress()
  → SkillsSystem.getSkillLevel('professionalism')
  → EducationSystem.getEducationRank()
  → careerComponent.update()
  → WorkPeriodSystem.syncCurrentJob()
  → EventBus.dispatch('activity:career')
```

#### 4.3.3 Обучение (курс)
```
EducationSystem.startProgram()
  → TimeSystem.advanceHours(24)
  → StatsSystem.applyStatChanges({ stress: +10, energy: -15 })
  → SkillsSystem.applySkillChanges({ +2 levels })
  → EducationSystem.completeProgram()
  → CareerProgressSystem.checkUnlocks()
```

#### 4.3.4 Конец месяца
```
MonthlySettlementSystem.settleMonth()
  → WorkPeriodSystem.paySalary()
  → FinanceActionSystem.processSubscriptions()
  → InvestmentSystem.calculateReturns()
  → EventQueueSystem.queueMonthlyEvent()
  → StatsSystem.applyMonthlyDecline()
```

---

## 5. Потоки данных

### 5.1 Поток при выполнении действия

```
User Click → Vue Component → Composable → Pinia Store
   → Application Layer (commands.ts)
   → Game Facade → ActionSystem.execute()
   → ECS World ← Components Update
   → triggerRef → Vue Re-render
```

### 5.2 Поток при отображении данных

```
Vue Component → Pinia Store (computed)
   → ECS World.getComponent()
   → Component Data → Display in UI
```

### 5.3 Поток при загрузке сохранения

```
localStorage → PersistenceSystem.load()
   → MigrationSystem.applyMigrations()
   → hydrateEngineSnapshot()
   → wireSystemContext()
   → Game Ready
```

---

## 6. Техническая архитектура

### 6.1 Слои приложения

```
┌─────────────────────────────────────┐
│     Presentation Layer               │
│   (Vue Components, Pages, Stores)  │
├─────────────────────────────────────┤
│     Application Layer              │
│   (Commands, Queries, Game Facade)   │
├─────────────────────────────────────┤
│     Domain Layer                   │
│   (ECS Systems, Components)       │
├─────────────────────────────────────┤
│     Infrastructure Layer          │
│   (Storage, Analytics, Utils)      │
└─────────────────────────────────────┘
```

### 6.2 Ключевые directories

```
src/
├── application/         # Use Cases, Commands
│   └── game/
│       ├── commands.ts
│       ├── queries.ts
│       └── index.ts
│
├── components/          # Vue Components
│   ├── pages/          # Page-specific components
│   ├── game/          # Game UI components
│   ├── ui/            # Base UI components
│   └── global/        # Global components
│
├── composables/         # Vue Composables
│   ├── useActions/
│   ├── useActivityLog/
│   └── useAgeRestrictions/
│
├── constants/          # App constants
│   └── navigation.ts
│
├── domain/            # Domain Logic
│   ├── balance/      # Game Balance (actions, jobs, programs)
│   │   ├── actions/
│   │   ├── constants/
│   │   └── types/
│   └── engine/      # ECS
│       ├── components/
│       ├── systems/
│       └── world/
│
├── pages/             # Nuxt Pages
│   └── game/
│       ├── work/
│       ├── education/
│       ├── skills/
│       ├── actions/
│       ├── finance/
│       ├── shop/
│       ├── home/
│       └── activity/
│
└── stores/           # Pinia Stores
    └── game.store.ts
```

### 6.3 Testing подход

- **Unit тесты:** ECS системы (`test/unit/domain/engine/`)
- **Integration:** Компоненты
- **E2E:** Полный флоу игры (Playwright)

---

## Приложения

### A. Справочник констант

### B. Телеметрия событий

| Событие | Система |
|---------|---------|
| `action_execute` | ActionSystem |
| `career_promotion` | CareerProgressSystem |
| `career_demotion` | CareerProgressSystem |
| `career_change` | CareerProgressSystem |
| `work_shift` | WorkPeriodSystem |
| `work_salary_payout` | WorkPeriodSystem |
| `stat_change` | StatsSystem |
| `skill_change` | SkillsSystem |
| `event_*` | EventQueueSystem |

---

**Обновления:**
- 2026-04-19: Добавлен детальный разбор в��ех страниц и взаимосвязей