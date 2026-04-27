import type { MicroEvent, MicroEventChoice, StatChanges } from '@domain/balance/types'

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

// =============================================================================
// МИКРО-СОБЫТИЯ (случайные мелкие события во время действий)
// =============================================================================

export const MICRO_EVENT_BY_ACTION: Record<string, MicroEvent> = {
  buy_groceries: {
    id: 'micro_robbery_market',
    baseChance: 0.012,
    title: 'Подозрительные люди у магазина',
    description: 'Возле входа в магазин к вам подошли двое подозрительных парней.',
  },
  default: {
    id: 'micro_minor_injury',
    baseChance: 0.025,
    title: 'Неловкая травма',
    description: 'Вы неудачно ударились мизинцем об угол стола или дверной косяк.',
    statImpact: { health: -1.5 },
  },
}

export const MICRO_EVENT_CHOICES_BY_ID: Record<string, MicroEventChoice[]> = {
  micro_robbery_market: [
    {
      label: 'Попытаться убежать',
      outcome: 'Вы резко рванули в сторону. Всё решило мгновение.',
      skillCheck: {
        key: 'physicalFitness',
        threshold: 5,
        successStatChanges: { stress: -5, mood: 4 },
        failStatChanges: { health: -7, stress: 12, mood: -6 },
        failMoneyDelta: -1500,
      },
    },
    {
      label: 'Отдать кошелёк без сопротивления',
      outcome: 'Вы не стали рисковать жизнью. Грабители быстро скрылись.',
      moneyDelta: -1100,
      statChanges: { stress: 7, mood: -5 },
    },
    {
      label: 'Попытаться договориться',
      outcome: 'Вы спокойно предложили отдать только наличные.',
      skillCheck: {
        key: 'charisma',
        threshold: 4,
        successStatChanges: { stress: -3, mood: 3 },
        failStatChanges: { health: -4, stress: 9, mood: -4 },
        failMoneyDelta: -800,
      },
    },
  ],

  micro_minor_injury: [
    {
      label: 'Обработать и дать отдых',
      outcome: 'Холодная вода, пластырь и минута покоя — боль быстро отступила.',
      statChanges: { stress: -5, mood: 5, health: 1 },
    },
    {
      label: 'Стерпеть и продолжить день',
      outcome: 'Вы отмахнулись от боли и пошли дальше. Мизинец ноет до сих пор.',
      statChanges: { stress: 6, mood: -4 },
    },
    {
      label: 'Отшутиться над собой',
      outcome: 'Самоирония помогла — настроение немного поднялось.',
      statChanges: { mood: 7, stress: -3 },
    },
  ],

  __default: [
    {
      label: 'Отреагировать спокойно',
      outcome: 'Вы сохранили самообладание и продолжили день без лишних эмоций.',
      statChanges: { stress: -4, mood: 3 },
    },
    {
      label: 'Проигнорировать',
      outcome: 'Событие прошло мимо, но лёгкий осадок остался.',
      statChanges: { stress: 2 },
    },
  ],
}

// =============================================================================
// ФУНКЦИИ СОЗДАНИЯ СОБЫТИЙ
// =============================================================================

export function buildMicroQueuedEvent(
  def: MicroEvent,
  actionType: string,
  totalHours: number,
) {
  const instanceId = `${def.id}_${totalHours}`
  const choiceSource =
    MICRO_EVENT_CHOICES_BY_ID[def.id] ?? MICRO_EVENT_CHOICES_BY_ID.__default

  return {
    ...def,
    type: 'micro' as const,
    actionSource: actionType,
    instanceId,
    choices: deepClone(choiceSource),
  }
}

export function createWeeklySummaryQueuedEvent(weekNumber: number) {
  return {
    id: 'weekly_summary',
    type: 'weekly' as const,
    title: `Итоги недели ${weekNumber}`,
    description: 'Неделя подошла к концу. Самое время немного подвести итоги и выбрать, на чём сосредоточиться дальше.',
    choices: [
      {
        label: 'Восстановиться и выдохнуть',
        outcome: 'Вы позволили себе отдохнуть и восстановить силы.',
        statChanges: { stress: -9, mood: 10, energy: 8 },
      },
      {
        label: 'Сфокусироваться на развитии',
        outcome: 'Вы сохранили высокий темп и чуть прокачали профессионализм.',
        statChanges: { stress: 4, mood: 2 },
        skillChanges: { professionalism: 1 },
      },
    ],
    instanceId: `weekly_summary_${weekNumber}`,
  }
}

export function createYearlyReflectionQueuedEvent(yearNumber: number) {
  return {
    id: 'yearly_reflection',
    type: 'yearly' as const,
    title: `Год ${yearNumber}: время подвести итог`,
    description: 'Прошёл ещё один год жизни. Стоит оглянуться назад и честно ответить — в каком направлении двигаться дальше.',
    choices: [
      {
        label: 'Сделать акцент на здоровье и баланс',
        outcome: 'Вы решили, что долгосрочное самочувствие важнее всего.',
        statChanges: { health: 12, stress: -10, mood: 8 },
      },
      {
        label: 'Сделать акцент на карьеру и доход',
        outcome: 'Вы выбрали ускорение профессионального роста.',
        statChanges: { stress: 9, mood: -3 },
        skillChanges: { professionalism: 2 },
      },
    ],
    instanceId: `yearly_reflection_${yearNumber}`,
  }
}

// =============================================================================
// РАБОЧИЕ СЛУЧАЙНЫЕ СОБЫТИЯ
// =============================================================================

interface WorkRandomEventChoice {
  label: string
  outcome: string
  salaryMultiplier?: number
  permanentSalaryMultiplier?: number
  statChanges: StatChanges
  skillChanges?: Record<string, number>
}

interface WorkRandomEvent {
  id: string
  title: string
  description: string
  probability: number
  cooldownDays: number
  minClicks?: number
  requiresSkill?: Record<string, number>
  requiresEducationRank?: number
  choices: WorkRandomEventChoice[]
}

export const WORK_RANDOM_EVENTS: WorkRandomEvent[] = [
  {
    id: 'deadline_push',
    title: 'Внезапный дедлайн',
    description: 'Руководство срочно попросило закрыть важную задачу до конца дня.',
    probability: 0.20,
    cooldownDays: 18,
    minClicks: 28,
    choices: [
      {
        label: 'Взяться самому и вытянуть',
        outcome: 'Вы справились, но день получился очень тяжёлым.',
        salaryMultiplier: 0.22,
        statChanges: { energy: -22, stress: 16, mood: -3 },
      },
      {
        label: 'Подключить коллег',
        outcome: 'Задача была закрыта совместными усилиями.',
        salaryMultiplier: 0.09,
        statChanges: { energy: -11, stress: 5, mood: 6 },
      },
    ],
  },
  {
    id: 'colleague_help',
    title: 'Коллега пришёл на помощь',
    description: 'Сосед по офису заметил, что вы тонете в задачах, и предложил помощь.',
    probability: 0.16,
    cooldownDays: 15,
    choices: [
      {
        label: 'Принять помощь',
        outcome: 'День прошёл гораздо спокойнее, а настроение улучшилось.',
        salaryMultiplier: 0.08,
        statChanges: { mood: 11, stress: -7 },
      },
      {
        label: 'Отказаться и справиться самому',
        outcome: 'Вы доказали самостоятельность, но устали сильнее обычного.',
        salaryMultiplier: 0.05,
        statChanges: { energy: -10, stress: 7 },
      },
    ],
  },
  {
    id: 'tech_issues',
    title: 'Технический сбой',
    description: 'В середине рабочего дня отказал важный инструмент или программа.',
    probability: 0.19,
    cooldownDays: 17,
    choices: [
      {
        label: 'Остаться и чинить',
        outcome: 'Часть дня удалось спасти, но вы сильно вымотались.',
        salaryMultiplier: -0.07,
        statChanges: { energy: -15, stress: 11 },
      },
      {
        label: 'Сообщить и завершить день',
        outcome: 'Потери по зарплате больше, но вы сохранили нервы.',
        salaryMultiplier: -0.18,
        statChanges: { mood: -5, stress: 3 },
      },
    ],
  },
  {
    id: 'mid_month_raise',
    title: 'Неожиданное повышение ставки',
    description: 'Руководитель отметил вашу работу и предложил прибавку уже с этого месяца.',
    probability: 0.09,
    cooldownDays: 85,
    minClicks: 55,
    requiresSkill: { professionalism: 5 },
    choices: [
      {
        label: 'Согласиться',
        outcome: 'Зарплата выросла, но и ожидания от вас тоже повысились.',
        permanentSalaryMultiplier: 0.06,
        statChanges: { mood: 13, stress: 7 },
      },
      {
        label: 'Отказаться от прибавки',
        outcome: 'Вы сохранили привычный ритм без дополнительного давления.',
        statChanges: { stress: -4, mood: 4 },
      },
    ],
  },
]

// =============================================================================
// ГЛОБАЛЬНЫЕ ПРОГРЕСС-СОБЫТИЯ
// =============================================================================

export const GLOBAL_PROGRESS_EVENTS = [
  {
    id: 'weekly_bonus_moment',
    type: 'weekly' as const,
    title: 'Конец недели',
    description: 'Неделя завершена. Можно немного наградить себя или спокойно спланировать следующую.',
    choices: [
      {
        label: 'Наградить себя',
        outcome: 'Небольшое удовольствие помогло восстановить силы.',
        moneyDelta: -1200,
        statChanges: { mood: 14, stress: -10, energy: 6 },
      },
      {
        label: 'Сфокусироваться на планировании',
        outcome: 'Вы сохранили деньги и лучше подготовились к следующей неделе.',
        statChanges: { stress: -6 },
        skillChanges: { timeManagement: 1 },
      },
    ],
  },
  {
    id: 'age_30_reunion',
    type: 'age' as const,
    title: '30 лет — встреча выпускников',
    triggerAge: 30,
    description: 'Одноклассники организовали встречу. Можно сравнить свой путь с чужими и немного переосмыслить жизнь.',
    choices: [
      {
        label: 'Пойти на встречу',
        outcome: 'Вечер получился тёплым, немного ностальгическим и вдохновляющим.',
        moneyDelta: -800,
        statChanges: { mood: 15, stress: -5 },
        skillChanges: { communication: 1 },
      },
      {
        label: 'Пропустить встречу',
        outcome: 'Вы остались в своём ритме и сохранили спокойствие.',
        statChanges: { stress: -3, mood: 2 },
      },
    ],
  },
]

export const EVENT_FINANCE_CASH_GAP = {
  id: 'finance_cash_gap',
  type: 'finance' as const,
  title: 'Финансовый дефицит',
  description: 'После месячного расчёта у вас образовался дефицит. Нужно найти способ покрыть недостачу.',
  choices: [
    {
      label: 'Взять кредит в банке',
      outcome: 'Вы оформили кредит. Теперь ежемесячные платежи увеличатся.',
      statChanges: { stress: 8, mood: -4 },
    },
    {
      label: 'Обратиться за помощью к семье',
      outcome: 'Семья помогла, но вы чувствуете себя неуютно из-за долга.',
      statChanges: { stress: 5, mood: -6 },
    },
    {
      label: 'Сократить расходы и пережить',
      outcome: 'Вы решили обойтись без лишнего. Это было непросто.',
      statChanges: { stress: 12, mood: -8 },
    },
  ],
}

export const EVENT_FINANCE_RESERVE_WARNING = {
  id: 'finance_reserve_warning',
  type: 'finance' as const,
  title: 'Резервный фонд почти пуст',
  description: 'Ваш резервный фонд ниже рекомендуемого уровня. Стоит подумать о его пополнении.',
  choices: [
    {
      label: 'Пополнить резерв',
      outcome: 'Вы решили отложить деньги на резерв для будущих расходов.',
      statChanges: { stress: 3, mood: 2 },
    },
    {
      label: 'Игнорировать предупреждение',
      outcome: 'Вы решили не беспокоиться об этом сейчас.',
      statChanges: { stress: -2, mood: 1 },
    },
    {
      label: 'Проанализировать расходы',
      outcome: 'Вы пересмотрели свои расходы и нашли способы сэкономить.',
      statChanges: { stress: 4, mood: -2 },
      skillChanges: { timeManagement: 1 },
    },
  ],
}

export function createWeeklyJobDismissalQueuedEvent(params: {
  jobName: string
  worked: number
  required: number
  newWeekNumber: number
  jobId: string
}) {
  const { jobName, worked, required, newWeekNumber, jobId } = params

  return {
    id: 'job_dismissal',
    type: 'career' as const,
    title: 'Увольнение с работы',
    description: `Вы не набрали достаточное количество часов на работе "${jobName}" за неделю. Вы уволены.`,
    choices: [
      {
        label: 'Найти новую работу',
        outcome: 'Вы начали искать новую работу.',
        statChanges: { stress: 8, mood: -5 },
      },
      {
        label: 'Взять перерыв',
        outcome: 'Вы решили взять перерыв от работы.',
        statChanges: { stress: -3, mood: -2 },
      },
    ],
    instanceId: `job_dismissal_${jobId}_${newWeekNumber}`,
  }
}

export function cloneQueuedEventTemplate<T>(template: T): T {
  return deepClone(template)
}