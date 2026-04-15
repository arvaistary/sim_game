# План реализации механики детства — обновлённая версия

> Дата создания: 2026-04-14
> Основан на аудите: `docs/childhood-mechanics-full-plan.md` vs текущая кодовая база
> Статус реализации оригинального плана: **~25%**

---

## 📋 Сводка текущего состояния

### Что УЖЕ реализовано (не требует доработки)

| Компонент | Файл | Описание |
|-----------|------|----------|
| `AgeGroup` enum (7 групп) | `src/domain/balance/actions/types.ts:31` | INFANT, TODDLER, CHILD, KID, TEEN, YOUNG, ADULT |
| 71 детское действие | `src/domain/balance/actions/child-actions.ts` | Все 5 возрастных групп покрыты |
| `BalanceAction` интерфейс | `src/domain/balance/actions/types.ts:41` | Полная типизация действий |
| `SkillsSystem` | `src/domain/engine/systems/SkillsSystem/index.ts` | Применение изменений навыков |
| `PersonalitySystem` | `src/domain/engine/systems/PersonalitySystem/index.ts` | 5 осей + 15 черт по Big Five |
| `SchoolSystem` | `src/domain/engine/systems/SchoolSystem/index.ts` | Авто-зачисление с 7 лет |
| `TimeSystem` | `src/domain/engine/systems/TimeSystem/index.ts` | Возрастные группы + скорость времени |
| `EventQueueSystem` | `src/domain/engine/systems/EventQueueSystem/index.ts` | Очередь событий |
| `EventChoiceSystem` | `src/domain/engine/systems/EventChoiceSystem/index.ts` | Обработка выборов (skill checks, статы, деньги) |
| `EventHistorySystem` | `src/domain/engine/systems/EventHistorySystem/index.ts` | История событий |
| `useAgeRestrictions` | `src/composables/useAgeRestrictions/index.ts` | Скрытие вкладок по возрасту |
| `AGE_LEARNING_MULTIPLIERS` | `src/domain/balance/constants/skills-constants.ts:939` | Множители обучения по возрасту |
| Общие события (взрослые) | `src/domain/balance/constants/game-events.ts` | Микро-события, рабочие, финансовые |
| ECS-компоненты | `src/domain/engine/components/index.ts` | Все ключи компонентов |

### Что НЕ реализовано (требует доработки)

| # | Компонент | Приоритет | Сложность |
|---|-----------|-----------|-----------|
| 1 | Механика возрастных потолков навыков (AgeCap) | 🔴 Критичный | Средняя |
| 2 | 27 детских навыков с привязкой к возрасту | 🔴 Критичный | Средняя |
| 3 | Детские события (127 шт.) | 🔴 Критичный | Высокая |
| 4 | Цепочки последствий (event chains) | 🔴 Критичный | Высокая |
| 5 | Система отложенных последствий (DelayedEffect) | 🟡 Важный | Средняя |
| 6 | Система памяти персонажа (LifeMemory) | 🟡 Важный | Средняя |
| 7 | 41 черта характера с компромиссами | 🟡 Важный | Средняя |
| 8 | Балансировочные таблицы | 🟢 Желательный | Низкая |
| 9 | Тесты детского модуля | 🟢 Желательный | Средняя |

---

## 🏗️ Этап 1: Детские навыки и возрастные потолки

> **Цель**: Добавить 27 детских навыков с механикой «лучший возраст» и ограничением макс. уровня по возрасту.
> **Зависимости**: Нет (можно начать сразу)
> **Оценка**: 2 дня

### 1.1. Типы для детских навыков

**Создать**: `src/domain/balance/types/childhood-skill.ts`

```typescript
/**
 * Детский навык — прокачивается только в определённом возрасте.
 * Если навык не развит до конца возрастного окна — его потолок навсегда снижен.
 */
export interface ChildhoodSkillDef {
  /** Уникальный ключ (совпадает с ключом в общем SkillDef) */
  key: string
  /** Лучший возраст для прокачки (начало) */
  bestAgeStart: number
  /** Лучший возраст для прокачки (конец) */
  bestAgeEnd: number
  /** Максимальный потолок если прокачан в лучшем возрасте (0-1) */
  maxPotential: 1.0
  /** Эффект на взрослую жизнь — описание для UI */
  adultBenefit: string
}

/**
 * Таблица штрафа за запоздалое развитие навыка.
 * Ключ — возраст начала прокачки, значение — макс. возможный уровень (0-1).
 */
export const AGE_SKILL_CAP_TABLE: Array<{ maxAge: number; cap: number }> = [
  { maxAge: 7,  cap: 1.00 },  // 100%
  { maxAge: 10, cap: 0.90 },  // 90%
  { maxAge: 13, cap: 0.75 },  // 75%
  { maxAge: 16, cap: 0.55 },  // 55%
  { maxAge: 18, cap: 0.40 },  // 40%
  { maxAge: Infinity, cap: 0.30 },  // 30% (после 18)
]
```

### 1.2. Константы 27 детских навыков

**Создать**: `src/domain/balance/constants/childhood-skills.ts`

Содержит массив `CHILDHOOD_SKILLS: ChildhoodSkillDef[]` из 27 навыков:

| # | Ключ | Лучший возраст | Что даёт во взрослой жизни |
|---|------|----------------|---------------------------|
| 1 | `curiosity` | 4-8 | Все навыки прокачиваются на 20% быстрее |
| 2 | `smartness` | 6-11 | +3 ко всем проверкам интеллекта |
| 3 | `confidence` | 7-14 | Никогда не получаешь дебафф от отказа |
| 4 | `empathy` | 3-9 | Все отношения развиваются на 50% быстрее |
| 5 | `creativity` | 5-12 | Можно придумывать уникальные решения |
| 6 | `selfControl` | 8-16 | Никогда не делаешь импульсивные выборы |
| 7 | `persistence` | 10-17 | Можно перепробовать любую проверку 3 раза |
| 8 | `charisma` | 12-16 | Люди изначально относятся хорошо |
| 9 | `logic` | 9-15 | Все математические проверки с преимуществом |
| 10 | `memory` | 7-13 | Запоминаешь абсолютно все разговоры |
| 11 | `physicalStrength` | 14-18 | Базовый показатель силы на всю жизнь |
| 12 | `endurance` | 10-17 | Никогда не устаёшь раньше других |
| 13 | `agility` | 6-14 | Все физические проверки +2 |
| 14 | `attention` | 5-11 | Видишь скрытые варианты выбора |
| 15 | `responsibility` | 11-18 | Доверяют важные вещи |
| 16 | `honesty` | 4-10 | Твоей лжи верят если редко лжёшь |
| 17 | `riskTolerance` | 13-17 | Опасные варианты имеют удвоенную награду |
| 18 | `forgiveness` | 6-12 | Нет отрицательных модификаторов от обид |
| 19 | `grudge` | 12-16 | Запоминаешь всех кто предал |
| 20 | `humor` | 8-15 | Можно разрядить любую ситуацию |
| 21 | `musicalEar` | 3-7 | Можно развить любой музыкальный навык |
| 22 | `languageAptitude` | 2-10 | Любой язык изучается в 3 раза быстрее |
| 23 | `spatialThinking` | 7-13 | Отличная ориентация, хорошо в математике |
| 24 | `learningAbility` | 5-14 | Базовый множитель опыта на всю жизнь |
| 25 | `selfEsteem` | 10-18 | Базовый уровень счастья на всю жизнь |
| 26 | `trustInPeople` | 0-7 | По умолчанию веришь или не веришь людям |
| 27 | `capacityToLove` | 0-5 | Максимальная глубина близких отношений |

**Интеграция**: Некоторые ключи уже существуют в `src/domain/balance/constants/skills-constants.ts` (curiosity, empathy, memory, charisma, humor, responsibility, selfControl). Для них нужно:
- Добавить поле `childhoodWindow` в существующий `SkillDef` (или создать отдельный реестр)
- Остальные навыки добавить как новые записи в `BASIC_SKILLS` или отдельную категорию `CHILDHOOD_SKILLS`

### 1.3. ECS-компонент для детских навыков

**Создать**: компонент `CHILDHOOD_SKILLS_COMPONENT = 'childhood_skills'`

Добавить в `src/domain/engine/components/index.ts`:
```typescript
export const CHILDHOOD_SKILLS_COMPONENT = 'childhood_skills' as const
```

Структура данных компонента:
```typescript
interface ChildhoodSkillsComponent {
  // Текущий потолок каждого детского навыка (0-1)
  caps: Record<string, number>
  // Флаг: был ли навык впервые затронут в «лучшем возрасте»
  touchedInWindow: Record<string, boolean>
  // Возраст первого касания навыка
  firstTouchAge: Record<string, number>
}
```

### 1.4. Интеграция в SkillsSystem

**Изменить**: `src/domain/engine/systems/SkillsSystem/index.ts`

В метод `applySkillChanges()` добавить проверку:
1. Если навык — детский (есть в `CHILDHOOD_SKILLS`), проверить `caps[key]`
2. Новый уровень = `min(расчётный_уровень, maxLevel * cap)`
3. При первом повышении детского навыка — записать `firstTouchAge`
4. Вычислить `cap` по таблице `AGE_SKILL_CAP_TABLE` на основе текущего возраста

### 1.5. Интеграция в начальный сейв

**Изменить**: `src/domain/balance/constants/initial-save.ts`

Добавить `childhood_skills` компонент со всеми 27 навыками (cap = 1.0, firstTouchAge = null).

**Изменить**: `src/domain/game-facade/index.ts` → `createWorldFromSave()`

Добавить инициализацию `childhood_skills` компонента при создании мира.

---

## 🏗️ Этап 2: Черты характера с компромиссами

> **Цель**: Добавить 41 черту характера из плана (вместо текущих 15 по Big Five).
> **Зависимости**: Нет (можно параллельно с Этапом 1)
> **Оценка**: 2 дня

### 2.1. Расширение типов личности

**Изменить**: `src/domain/balance/types/personality.ts`

Добавить к `PersonalityTraitDef`:
```typescript
export interface PersonalityTraitDef {
  // ... существующие поля ...
  
  /** Положительные эффекты черты */
  positiveEffects: string
  /** Отрицательные эффекты черты */
  negativeEffects: string
  /** Условие получения (описание) */
  acquireCondition: string
  /** Возрастное окно формирования */
  formAgeStart: number
  formAgeEnd: number
}
```

### 2.2. Новые 41 черта характера

**Изменить**: `src/domain/balance/constants/personality-traits.ts`

Заменить текущие 15 черт на 41 из плана. Каждая черта имеет:
- Положительные и отрицательные эффекты (компромисс)
- Условие получения (событие + возраст)
- Модификаторы (положительные и отрицательные)

Первые 21 черта (остальные 20 по аналогии):

| # | ID | Название | Ось | Условие | + эффект | − эффект |
|---|-----|----------|-----|---------|----------|----------|
| 1 | `perfectionist` | Перфекционист | CONSCIENTIOUSNESS | Ругали за ошибки 7-12 | +10% качество | −20% скорость |
| 2 | `pessimist` | Пессимист | NEUROTICISM | 5+ разочарований 10-16 | Нет сюрпризов | Нет радости |
| 3 | `optimist` | Оптимист | NEUROTICISM (neg) | 5+ хороших исходов | Доп. вариант выбора | Часто в неприятностях |
| 4 | `introvert` | Интроверт | EXTRAVERSION (neg) | Оставляли одного 3-7 | Не нужны люди | Сложно строить отношения |
| 5 | `extravert` | Экстраверт | EXTRAVERSION | Внимание когда плакал 3-7 | Легко знакомишься | Не можешь быть один |
| 6 | `workaholic` | Трудоголик | CONSCIENTIOUSNESS | Хвалили за результат 8-14 | ×2 работа | Быстрое выгорание |
| 7 | `lazy` | Лентяй | CONSCIENTIOUSNESS (neg) | Не хвалили за усилия 8-14 | Не выгораешь | Минимум усилий |
| 8 | `tough` | Жёсткий | AGREEABLENESS (neg) | Били, не жалели 7-12 | Никто не сломает | Нет сострадания |
| 9 | `soft` | Мягкий | AGREEABLENESS | Защищали, жалели 7-12 | Все помогают | Все используют |
| 10 | `liar` | Лгун | OPENNESS (neg) | Наказывали за правду 6-13 | Лжи всегда верят | Не отличаешь правду |
| 11 | `honestToBone` | Честный до мозга костей | OPENNESS | Не наказывали за правду 6-13 | Все доверяют | Не можешь солгать |
| 12 | `vengeful` | Мстительный | AGREEABLENESS (neg) | Не помогли при предательстве 12-16 | Боятся обидеть | Годы на месть |
| 13 | `forgiving` | Прощающий | AGREEABLENESS | Прощали ошибки 8-14 | Нет обид | Постоянно предают |
| 14 | `selfSufficient` | Самодостаточный | EXTRAVERSION (neg) | Никто не помогал 5-12 | Не нужен никто | Не просишь о помощи |
| 15 | `dependent` | Зависимый | EXTRAVERSION | Решали всё за тебя 5-12 | Хотят заботиться | Не можешь один |
| 16 | `riskTaker` | Рисковый | OPENNESS | 3+ риска с успехом 13-17 | ×2 награда за риск | Разобьёшься |
| 17 | `cautious` | Осторожный | OPENNESS (neg) | 3+ риска с провалом 13-17 | Нет больших бед | Нет больших наград |
| 18 | `teamPlayer` | Командный игрок | EXTRAVERSION | Командные игры 7-14 | Отлично в коллективе | Не берёшь ответственность |
| 19 | `loner` | Одиночка | EXTRAVERSION (neg) | Играл один 7-14 | Отлично один | Не можешь в команде |
| 20 | `materialist` | Материалист | CONSCIENTIOUSNESS | Хвалили за вещи 6-12 | Много зарабатываешь | Деньги ≠ счастье |
| 21 | `idealist` | Идеалист | OPENNESS | Хвалили за идеи 6-12 | Осмысленная жизнь | Почти наверняка бедный |

### 2.3. Обновить PersonalitySystem

**Изменить**: `src/domain/engine/systems/PersonalitySystem/index.ts`

- `_checkTraitUnlocks()` — проверять не только порог оси, но и возрастное окно (`formAgeStart`..`formAgeEnd`)
- Добавить метод `acquireTrait(traitId, reason)` — для принудительного получения черты через события
- `_applyAxisDrift()` — учитывать детские события для усиленного дрейфа осей

---

## 🏗️ Этап 3: Детские события

> **Цель**: Создать 127 детских событий с выборами, привязанных к возрастным группам.
> **Зависимости**: Этап 1 (навыки), Этап 2 (черты) — для корректных эффектов
> **Оценка**: 5 дней

### 3.1. Типы детских событий

**Создать**: `src/domain/balance/types/childhood-event.ts`

```typescript
import type { StatChanges } from '@/domain/balance/types'
import { AgeGroup } from '@/domain/balance/actions/types'

/** Тип события по значимости */
export type ChildhoodEventType = 'everyday' | 'formative' | 'fateful'

/** Отложенное последствие выбора */
export interface DelayedConsequence {
  /** Возраст (или кол-во лет спустя) когда последствие проявится */
  triggerAge: number | { yearsLater: number }
  /** Описание что произойдёт */
  description: string
  /** Изменения характеристик */
  statChanges?: StatChanges
  /** Изменения навыков */
  skillChanges?: Record<string, number>
  /** ID черты характера которую даёт/забирает */
  grantTrait?: string
  /** ID памяти которую оставляет */
  memoryId?: string
}

/** Вариант выбора в детском событии */
export interface ChildhoodEventChoice {
  label: string
  description: string
  statChanges?: StatChanges
  skillChanges?: Record<string, number>
  /** Мгновенная черта характера */
  grantTrait?: string
  /** Отложенные последствия (70% выборов имеют хотя бы одно) */
  delayedConsequences?: DelayedConsequence[]
  /** Требование навыка для доступности выбора */
  requiresSkill?: { key: string; minLevel: number }
  /** Скрытый выбор (виден только при определённых условиях) */
  hidden?: boolean
  hiddenCondition?: { skill: string; minLevel: number }
}

/** Определение детского события */
export interface ChildhoodEventDef {
  id: string
  title: string
  description: string
  /** Возрастная группа */
  ageGroup: AgeGroup
  /** Тип по значимости */
  type: ChildhoodEventType
  /** Вероятность появления (everyday: 0.70, formative: 0.25, fateful: 0.05) */
  probability: number
  /** Можно ли повторить */
  repeatable: boolean
  /** Варианты выбора */
  choices: ChildhoodEventChoice[]
  /** Условие появления (опционально) */
  condition?: string  // ID предыдущего события или триггер
  /** Тег для цепочки */
  chainTag?: string
}
```

### 3.2. Файлы событий по возрастным группам

**Создать**:
- `src/domain/balance/constants/childhood-events/index.ts` — реэкспорт
- `src/domain/balance/constants/childhood-events/infant-events.ts` — 0-3 года (~20 событий)
- `src/domain/balance/constants/childhood-events/preschool-events.ts` — 4-7 лет (~25 событий)
- `src/domain/balance/constants/childhood-events/school-events.ts` — 8-12 лет (~30 событий)
- `src/domain/balance/constants/childhood-events/teen-events.ts` — 13-15 лет (~27 событий)
- `src/domain/balance/constants/childhood-events/young-events.ts` — 16-18 лет (~25 событий)

### 3.3. Примеры ключевых событий

#### Событие: «Учительница математики» (10 лет, school-events.ts)

```typescript
{
  id: 'math_teacher_kindness',
  title: 'Учительница математики',
  description: 'Учительница позволила тебе остаться после урока и объяснила материал который никто не понял.',
  ageGroup: AgeGroup.KID,
  type: 'formative',
  probability: 0.25,
  repeatable: false,
  chainTag: 'math_teacher',
  choices: [
    {
      label: 'Приходить к ней после уроков каждый раз',
      description: 'Ты решил что этот человек заслуживает твоего времени.',
      statChanges: { stress: -5 },
      skillChanges: { logic: 15, persistence: 10 },
      delayedConsequences: [
        {
          triggerAge: { yearsLater: 25 },
          description: 'Она напишет тебе и скажет что ты всегда был её любимым учеником.',
          statChanges: { mood: 30 },
          memoryId: 'math_teacher_letter'
        }
      ],
      // Отрицательный эффект: одноклассники считают ботаником
      grantTrait: undefined,
    },
    {
      label: 'Смеяться над ней вместе со всеми',
      description: 'Все одноклассники начали тебя уважать.',
      statChanges: { mood: 10 },
      skillChanges: { charisma: 10 },
      delayedConsequences: [
        {
          triggerAge: { yearsLater: 30 },
          description: 'Ты встретишь её в больнице и поймёшь что единственный человек который верил в тебя ты унизил.',
          statChanges: { mood: -40, stress: 30 },
          memoryId: 'math_teacher_regret'
        }
      ],
    },
    {
      label: 'Просто уйти и ничего не говорить',
      description: 'Никаких немедленных эффектов.',
      delayedConsequences: [
        {
          triggerAge: { yearsLater: 17 },
          description: 'Ты будешь жалеть об этом абсолютно случайно в один обычный вечер.',
          statChanges: { mood: -10 },
          memoryId: 'math_teacher_missed'
        }
      ],
    },
  ],
}
```

#### Событие: «Лучший друг» (11 лет, school-events.ts)

```typescript
{
  id: 'best_friend_stolen_gum',
  title: 'Лучший друг',
  description: 'Друг украл пачку жвачек и вас поймали. Охранник смотрит на вас обоих.',
  ageGroup: AgeGroup.KID,
  type: 'fateful',
  probability: 0.05,
  repeatable: false,
  chainTag: 'best_friend',
  choices: [
    {
      label: 'Сказать что это он',
      description: 'Тебя отпустят, но он больше никогда не будет твоим другом.',
      statChanges: { stress: 10 },
      delayedConsequences: [
        {
          triggerAge: { yearsLater: 30 },
          description: 'На протяжении всей жизни ты будешь знать что ты предал его.',
          statChanges: { mood: -15 },
          grantTrait: 'selfSufficient',
          memoryId: 'betrayed_best_friend'
        }
      ],
    },
    {
      label: 'Сказать что это ты',
      description: 'Тебя накажут очень сильно, но он будет твоим лучшим другом ещё 30 лет.',
      statChanges: { stress: 30, mood: -20 },
      delayedConsequences: [
        {
          triggerAge: { yearsLater: 31 },
          description: 'Когда тебе будет 42 и у тебя будет всё очень плохо — он единственный кто придёт.',
          statChanges: { mood: 50, stress: -30 },
          memoryId: 'best_friend_saved_me'
        }
      ],
    },
    {
      label: 'Молчать',
      description: 'Оба получите по полной.',
      statChanges: { stress: 25, mood: -10 },
      skillChanges: { endurance: 10, resilience: 10 },
      delayedConsequences: [
        {
          triggerAge: { yearsLater: 5 },
          description: 'Вы больше никогда не будете друзьями, но оба станете очень сильными людьми.',
          statChanges: { mood: -5 },
          memoryId: 'best_friend_silence'
        }
      ],
    },
  ],
}
```

### 3.4. Реестр всех детских событий

**Создать**: `src/domain/balance/constants/childhood-events/index.ts`

```typescript
import { INFANT_EVENTS } from './infant-events'
import { PRESCHOOL_EVENTS } from './preschool-events'
import { SCHOOL_EVENTS } from './school-events'
import { TEEN_EVENTS } from './teen-events'
import { YOUNG_EVENTS } from './young-events'
import type { ChildhoodEventDef } from '@/domain/balance/types/childhood-event'

export const ALL_CHILDHOOD_EVENTS: ChildhoodEventDef[] = [
  ...INFANT_EVENTS,
  ...PRESCHOOL_EVENTS,
  ...SCHOOL_EVENTS,
  ...TEEN_EVENTS,
  ...YOUNG_EVENTS,
]

export const CHILDHOOD_EVENTS_BY_AGE_GROUP = Object.freeze(
  ALL_CHILDHOOD_EVENTS.reduce((acc, event) => {
    if (!acc[event.ageGroup]) acc[event.ageGroup] = []
    acc[event.ageGroup].push(event)
    return acc
  }, {} as Record<number, ChildhoodEventDef[]>)
)
```

---

## 🏗️ Этап 4: Система отложенных последствий

> **Цель**: Реализовать механику «70% последствий проявляются через 10-30 лет».
> **Зависимости**: Этап 3 (детские события — структура `DelayedConsequence`)
> **Оценка**: 2 дня

### 4.1. ECS-компонент для отложенных эффектов

**Создать**: `src/domain/engine/components/index.ts` — добавить:
```typescript
export const DELAYED_EFFECTS_COMPONENT = 'delayed_effects' as const
```

Структура:
```typescript
interface DelayedEffectEntry {
  id: string
  sourceEventId: string
  triggerAge: number
  description: string
  statChanges?: StatChanges
  skillChanges?: Record<string, number>
  grantTrait?: string
  memoryId?: string
  triggered: boolean
}

interface DelayedEffectsComponent {
  pending: DelayedEffectEntry[]
}
```

### 4.2. DelayedEffectSystem

**Создать**: `src/domain/engine/systems/DelayedEffectSystem/index.ts`

```typescript
export class DelayedEffectSystem {
  init(world: GameWorld): void
  update(world: GameWorld, deltaHours: number): void
  scheduleEffect(entry: DelayedEffectEntry): void
  getPendingEffects(): DelayedEffectEntry[]
}
```

Логика `update()`:
1. Получить текущий возраст из `TIME_COMPONENT`
2. Пройти по `pending` эффектам
3. Если `triggerAge <= currentAge` и `!triggered`:
   - Применить `statChanges` через `StatsSystem`
   - Применить `skillChanges` через `SkillsSystem`
   - Если `grantTrait` — вызвать `PersonalitySystem.acquireTrait()`
   - Если `memoryId` — записать в `LifeMemory` (Этап 5)
   - Поставить событие в `EventQueueSystem` (показать игроку)
   - Отметить `triggered = true`

### 4.3. Интеграция в EventChoiceSystem

**Изменить**: `src/domain/engine/systems/EventChoiceSystem/index.ts`

В методе `applyEventChoice()` после обработки немедленных эффектов:
1. Проверить `choice.delayedConsequences`
2. Для каждого — создать `DelayedEffectEntry` и передать в `DelayedEffectSystem.scheduleEffect()`

### 4.4. Интеграция в game-facade

**Изменить**: `src/domain/game-facade/index.ts`

Добавить инициализацию `delayed_effects` компонента и `DelayedEffectSystem` в список систем.

---

## 🏗️ Этап 5: Система памяти персонажа

> **Цель**: Персонаж запоминает все значимые события. Память влияет на будущие выборы и события.
> **Зависимости**: Этап 4 (отложенные эффекты ссылаются на память)
> **Оценка**: 2 дня

### 5.1. Типы памяти

**Создать**: `src/domain/balance/types/life-memory.ts`

```typescript
export interface LifeMemoryEntry {
  id: string
  /** Возраст когда произошло */
  age: number
  /** Краткое описание */
  summary: string
  /** Эмоциональная окраска (-100 до +100) */
  emotionalWeight: number
  /** Теги для поиска */
  tags: string[]
  /** Связанное событие */
  sourceEventId?: string
  /** Связанный выбор */
  sourceChoiceLabel?: string
  /** День в игре */
  gameDay: number
  /** Влияет ли на текущие выборы */
  active: boolean
}

export interface LifeMemoryComponent {
  memories: LifeMemoryEntry[]
  /** Общий эмоциональный фон детства (-100 до +100) */
  childhoodScore: number
}
```

### 5.2. ECS-компонент

**Изменить**: `src/domain/engine/components/index.ts`:
```typescript
export const LIFE_MEMORY_COMPONENT = 'life_memory' as const
```

### 5.3. LifeMemorySystem

**Создать**: `src/domain/engine/systems/LifeMemorySystem/index.ts`

```typescript
export class LifeMemorySystem {
  init(world: GameWorld): void
  recordMemory(entry: Omit<LifeMemoryEntry, 'gameDay'>): void
  getMemories(filter?: { tag?: string; minAge?: number; maxAge?: number }): LifeMemoryEntry[]
  getChildhoodScore(): number
  hasMemory(memoryId: string): boolean
}
```

- `recordMemory()` — добавляет запись, пересчитывает `childhoodScore`
- `getChildhoodScore()` — среднее `emotionalWeight` всех записей до 18 лет
- `hasMemory()` — проверка для условных событий (например, «если помнишь X — появляется выбор Y»)

### 5.4. Интеграция

**Изменить**: `src/domain/engine/systems/EventChoiceSystem/index.ts`

После каждого выбора события — вызывать `LifeMemorySystem.recordMemory()`.

**Изменить**: `src/domain/game-facade/index.ts`

Добавить `life_memory` компонент и `LifeMemorySystem`.

---

## 🏗️ Этап 6: Цепочки последствий

> **Цель**: Связанные серии событий где прошлый выбор влияет на будущие.
> **Зависимости**: Этап 3 (события), Этап 5 (память)
> **Оценка**: 3 дня

### 6.1. Механика цепочек

Цепочка — это серия событий объединённых `chainTag`. Следующее событие в цепочке появляется только если:
1. Предыдущее событие обработано (есть в `EventHistorySystem`)
2. Выполнен `condition` (определённый выбор в предыдущем)
3. Достигнут нужный возраст

### 6.2. ChainResolver

**Создать**: `src/domain/engine/systems/ChainResolverSystem/index.ts`

```typescript
export class ChainResolverSystem {
  init(world: GameWorld): void
  /** Проверить все цепочки и вернуть события готовые к появлению */
  resolveAvailableChains(currentAge: number): ChildhoodEventDef[]
  /** Записать что событие цепочки обработано */
  markChainEventProcessed(chainTag: string, eventId: string, choiceIndex: number): void
}
```

### 6.3. Ключевые цепочки из плана

| Цепочка | Возраст начала | Кол-во шагов | Описание |
|---------|---------------|--------------|----------|
| «Учительница математики» | 10 | 3 | Выбор влияет на логику/харизму + отложенное письмо |
| «Лучший друг» | 11 | 3 | Предательство/лояльность + последствия через 30 лет |
| «Первый поцелуй» | 14 | 4 | Каждый выбор оставляет след на всю жизнь |
| «Сигарета у старшеклассника» | 12 | 2 | Здоровье vs социальный статус |
| «Дневник» | 13 | 3 | Самопознание через записи |
| «Спорт или улица» | 14 | 2 | Разветвление жизненного пути |
| «Предательство друга» | 15 | 2 | Обратная сторона дружбы |
| «Выпускной» | 17 | 3 | Финальное событие детства |

### 6.4. Интеграция в систему событий

**Изменить**: логику выбора случайных событий (в `ActionSystem` или отдельном `ChildhoodEventScheduler`)

При выборе события для показа:
1. Проверить цепочки через `ChainResolverSystem.resolveAvailableChains()`
2. Если есть готовое цепочечное событие — показать его с приоритетом
3. Иначе — выбрать случайное событие по вероятности (everyday 70%, formative 25%, fateful 5%)

---

## 🏗️ Этап 7: Балансировочные таблицы

> **Цель**: Настроить численные значения согласно плану.
> **Зависимости**: Все предыдущие этапы
> **Оценка**: 1 день

### 7.1. Таблица получения навыка за действие

**Создать**: `src/domain/balance/constants/childhood-balance.ts`

```typescript
export const SKILL_GAIN_BY_AGE = {
  [AgeGroup.INFANT]:  { smallSuccess: 1,  bigSuccess: 3,  bigFail: 0 },
  [AgeGroup.TODDLER]: { smallSuccess: 1,  bigSuccess: 3,  bigFail: 0 },
  [AgeGroup.CHILD]:   { smallSuccess: 2,  bigSuccess: 7,  bigFail: 4 },
  [AgeGroup.KID]:     { smallSuccess: 3,  bigSuccess: 12, bigFail: 8 },
  [AgeGroup.TEEN]:    { smallSuccess: 4,  bigSuccess: 18, bigFail: 15 },
  [AgeGroup.YOUNG]:   { smallSuccess: 5,  bigSuccess: 25, bigFail: 20 },
} as const
```

### 7.2. Таблица вероятности событий

```typescript
export const EVENT_PROBABILITY = {
  everyday: 0.70,   // Обычные повседневные — повторяемые
  formative: 0.25,  // Важные формирующие — один раз за жизнь
  fateful: 0.05,    // Уникальные судьбоносные — только один раз
} as const
```

### 7.3. Интеграция

**Изменить**: `src/domain/engine/systems/SkillsSystem/index.ts`

Использовать `SKILL_GAIN_BY_AGE` для модификации `skillChanges` из действий в зависимости от текущей `AgeGroup`.

---

## 🏗️ Этап 8: Тестирование

> **Цель**: Покрыть тестами все новые механики.
> **Зависимости**: Все предыдущие этапы
> **Оценка**: 2 дня

### 8.1. Юнит-тесты

**Создать**:

| Файл | Что тестирует |
|------|---------------|
| `test/unit/domain/childhood-skills.test.ts` | Возрастные потолки, caps, firstTouchAge |
| `test/unit/domain/childhood-events.test.ts` | Структура событий, вероятности, привязка к возрасту |
| `test/unit/domain/delayed-effects.test.ts` | Планирование, срабатывание по возрасту, применение эффектов |
| `test/unit/domain/life-memory.test.ts` | Запись, фильтрация, childhoodScore |
| `test/unit/domain/chain-resolver.test.ts` | Цепочки, условия, последовательность |
| `test/unit/domain/personality-traits.test.ts` | 41 черта, условия получения, возрастные окна |

### 8.2. Интеграционные тесты

**Создать**: `test/integration/childhood/childhood-flow.test.ts`

Тестовый сценарий «полное детство 0-18»:
1. Создать мир с новорождённым
2. Пройти все возрастные группы
3. Проверить что навыки ограничены по AgeCap
4. Проверить что черты формируются по событиям
5. Проверить что отложенные эффекты срабатывают
6. Проверить память персонажа

---

## 📁 Итоговая структура новых файлов

```
src/domain/balance/
├── types/
│   ├── childhood-skill.ts          ← НОВЫЙ (Этап 1.1)
│   └── childhood-event.ts          ← НОВЫЙ (Этап 3.1)
├── constants/
│   ├── childhood-skills.ts         ← НОВЫЙ (Этап 1.2)
│   ├── childhood-balance.ts        ← НОВЫЙ (Этап 7.1)
│   ├── childhood-events/           ← НОВАЯ ДИРЕКТОРИЯ (Этап 3.2)
│   │   ├── index.ts
│   │   ├── infant-events.ts
│   │   ├── preschool-events.ts
│   │   ├── school-events.ts
│   │   ├── teen-events.ts
│   │   └── young-events.ts
│   ├── personality-traits.ts       ← ИЗМЕНИТЬ (Этап 2.2)
│   └── initial-save.ts             ← ИЗМЕНИТЬ (Этап 1.5)
├── types/
│   └── personality.ts              ← ИЗМЕНИТЬ (Этап 2.1)

src/domain/engine/
├── components/
│   └── index.ts                    ← ИЗМЕНИТЬ (+3 компонента)
├── systems/
│   ├── DelayedEffectSystem/        ← НОВЫЙ (Этап 4.2)
│   │   └── index.ts
│   ├── LifeMemorySystem/           ← НОВЫЙ (Этап 5.3)
│   │   └── index.ts
│   ├── ChainResolverSystem/        ← НОВЫЙ (Этап 6.2)
│   │   └── index.ts
│   ├── SkillsSystem/
│   │   └── index.ts                ← ИЗМЕНИТЬ (Этап 1.4)
│   ├── EventChoiceSystem/
│   │   └── index.ts                ← ИЗМЕНИТЬ (Этап 4.3)
│   └── PersonalitySystem/
│       └── index.ts                ← ИЗМЕНИТЬ (Этап 2.3)

src/domain/game-facade/
└── index.ts                        ← ИЗМЕНИТЬ (Этапы 1.5, 4.4, 5.4)

test/
├── unit/domain/
│   ├── childhood-skills.test.ts    ← НОВЫЙ (Этап 8.1)
│   ├── childhood-events.test.ts    ← НОВЫЙ
│   ├── delayed-effects.test.ts     ← НОВЫЙ
│   ├── life-memory.test.ts         ← НОВЫЙ
│   ├── chain-resolver.test.ts      ← НОВЫЙ
│   └── personality-traits.test.ts  ← НОВЫЙ
└── integration/childhood/
    └── childhood-flow.test.ts      ← НОВЫЙ (Этап 8.2)
```

---

## 📅 Порядок выполнения

```
Этап 1 (Детские навыки + AgeCap)  ─┐
Этап 2 (Черты характера)          ─┤─ можно параллельно (2 дня)
                                    ↓
Этап 3 (Детские события)          ─── 5 дней
                                    ↓
Этап 4 (Отложенные последствия)   ─┐
Этап 5 (Память персонажа)         ─┤─ можно параллельно (2 дня)
                                    ↓
Этап 6 (Цепочки последствий)      ─── 3 дня
                                    ↓
Этап 7 (Балансировка)             ─── 1 день
                                    ↓
Этап 8 (Тестирование)             ─── 2 дня

ИТОГО: ~17 рабочих дней
```

---

## ⚠️ Критические правила из плана (НЕ НАРУШАТЬ)

1. **Никогда не показывай игроку численные значения эффектов выбора** — только описание
2. **Никогда не говори какой выбор хороший а какой плохой** — нет маркеров
3. **Никогда не показывай полный список доступных действий** — только те которые персонаж может себе представить
4. **Самые важные вещи в жизни никогда не помечены как важные**
5. **Игрок должен закончить детство с ощущением что он бы всё сделал по другому**
6. **70% последствий выбора не видны сразу** — проявятся через 10-30 лет
7. **Навык не прокачанный до возраста — максимум 70%** — ключевое правило AgeCap
