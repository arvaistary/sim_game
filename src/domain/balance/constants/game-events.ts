import type { MicroEvent, MicroEventChoice } from '@/domain/balance/types'
import type { QueuedGameEvent, WorkRandomEvent, WeeklyJobDismissalParams } from './game-events.types'

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
      id: 'micro_robbery_market_run_away',
      text: 'Попытаться убежать',
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
      id: 'micro_robbery_market_give_wallet',
      text: 'Отдать кошелёк без сопротивления',
      outcome: 'Вы не стали рисковать жизнью. Грабители быстро скрылись.',
      moneyDelta: -1100,
      statChanges: { stress: 7, mood: -5 },
    },
    {
      id: 'micro_robbery_market_negotiate',
      text: 'Попытаться договориться',
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
      id: 'micro_minor_injury_treat_and_rest',
      text: 'Обработать и дать отдых',
      outcome: 'Холодная вода, пластырь и минута покоя — боль быстро отступила.',
      statChanges: { stress: -5, mood: 5, health: 1 },
    },
    {
      id: 'micro_minor_injury_endure_and_continue',
      text: 'Стерпеть и продолжить день',
      outcome: 'Вы отмахнулись от боли и пошли дальше. Мизинец ноет до сих пор.',
      statChanges: { stress: 6, mood: -4 },
    },
    {
      id: 'micro_minor_injury_laugh_it_off',
      text: 'Отшутиться над собой',
      outcome: 'Самоирония помогла — настроение немного поднялось.',
      statChanges: { mood: 7, stress: -3 },
    },
  ],

  __default: [
    {
      id: 'micro_default_stay_calm',
      text: 'Отреагировать спокойно',
      outcome: 'Вы сохранили самообладание и продолжили день без лишних эмоций.',
      statChanges: { stress: -4, mood: 3 },
    },
    {
      id: 'micro_default_ignore_it',
      text: 'Проигнорировать',
      outcome: 'Событие прошло мимо, но лёгкий осадок остался.',
      statChanges: { stress: 2 },
    },
  ],
}

// =============================================================================
// ФУНКЦИИ СОЗДАНИЯ СОБЫТИЙ
// =============================================================================

/**
 * Создаёт экземпляр микро-события из определения.
 * @description [Domain] - формирует queued-событие с клонами выборов и уникальным instanceId.
 * @return { object } объект queued-события с choices, instanceId и type=micro
 */
export function buildMicroQueuedEvent(
  def: MicroEvent,
  actionType: string,
  totalHours: number,
): QueuedGameEvent {
  const instanceId: string = `${def.id}_${totalHours}`
  const choiceSource: MicroEventChoice[] =
    MICRO_EVENT_CHOICES_BY_ID[def.id] ?? MICRO_EVENT_CHOICES_BY_ID.__default ?? []

  return {
    ...def,
    type: 'micro' as const,
    actionSource: actionType,
    instanceId,
    choices: deepClone(choiceSource),
  }
}

/**
 * Создаёт событие итогов недели.
 * @description [Domain] - формирует queued-событие с вариантами «восстановиться» или «сфокусироваться на развитии».
 * @return { QueuedGameEvent } объект queued-события с type=weekly
 */
export function createWeeklySummaryQueuedEvent(weekNumber: number): QueuedGameEvent {
  return {
    id: 'weekly_summary',
    type: 'weekly' as const,
    title: `Итоги недели ${weekNumber}`,
    description: 'Неделя подошла к концу. Самое время немного подвести итоги и выбрать, на чём сосредоточиться дальше.',
    choices: [
      {
        id: 'weekly_summary_recover',
        text: 'Восстановиться и выдохнуть',
        outcome: 'Вы позволили себе отдохнуть и восстановить силы.',
        statChanges: { stress: -9, mood: 10, energy: 8 },
      },
      {
        id: 'weekly_summary_develop',
        text: 'Сфокусироваться на развитии',
        outcome: 'Вы сохранили высокий темп и чуть прокачали профессионализм.',
        statChanges: { stress: 4, mood: 2 },
        skillChanges: { professionalism: 1 },
      },
    ],
    instanceId: `weekly_summary_${weekNumber}`,
  }
}

/**
 * Создаёт событие ежегодного размышления.
 * @description [Domain] - формирует queued-событие с вариантами «здоровье и баланс» или «карьера и доход».
 * @return { QueuedGameEvent } объект queued-события с type=yearly
 */
export function createYearlyReflectionQueuedEvent(yearNumber: number): QueuedGameEvent {
  return {
    id: 'yearly_reflection',
    type: 'yearly' as const,
    title: `Год ${yearNumber}: время подвести итог`,
    description: 'Прошёл ещё один год жизни. Стоит оглянуться назад и честно ответить — в каком направлении двигаться дальше.',
    choices: [
      {
        id: 'yearly_reflection_health_balance',
        text: 'Сделать акцент на здоровье и баланс',
        outcome: 'Вы решили, что долгосрочное самочувствие важнее всего.',
        statChanges: { health: 12, stress: -10, mood: 8 },
      },
      {
        id: 'yearly_reflection_career_income',
        text: 'Сделать акцент на карьеру и доход',
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
        id: 'deadline_push_take_it_myself',
        text: 'Взяться самому и вытянуть',
        outcome: 'Вы справились, но день получился очень тяжёлым.',
        salaryMultiplier: 0.22,
        statChanges: { energy: -22, stress: 16, mood: -3 },
      },
      {
        id: 'deadline_push_involve_colleagues',
        text: 'Подключить коллег',
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
        id: 'colleague_help_accept_help',
        text: 'Принять помощь',
        outcome: 'День прошёл гораздо спокойнее, а настроение улучшилось.',
        salaryMultiplier: 0.08,
        statChanges: { mood: 11, stress: -7 },
      },
      {
        id: 'colleague_help_handle_myself',
        text: 'Отказаться и справиться самому',
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
        id: 'tech_issues_stay_and_fix',
        text: 'Остаться и чинить',
        outcome: 'Часть дня удалось спасти, но вы сильно вымотались.',
        salaryMultiplier: -0.07,
        statChanges: { energy: -15, stress: 11 },
      },
      {
        id: 'tech_issues_report_and_end_day',
        text: 'Сообщить и завершить день',
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
        id: 'mid_month_raise_accept',
        text: 'Согласиться',
        outcome: 'Зарплата выросла, но и ожидания от вас тоже повысились.',
        permanentSalaryMultiplier: 0.06,
        statChanges: { mood: 13, stress: 7 },
      },
      {
        id: 'mid_month_raise_decline',
        text: 'Отказаться от прибавки',
        outcome: 'Вы сохранили привычный ритм без дополнительного давления.',
        statChanges: { stress: -4, mood: 4 },
      },
    ],
  },
]

/**
 * Создаёт событие из случайного рабочего шаблона.
 * @description [Domain] - клонирует choices work-события и добавляет earnedAmount в data.
 * @return { QueuedGameEvent } queued-событие типа work
 */
export function buildEventFromWorkRandomEvent(
  event: WorkRandomEvent,
  earnedAmount: number,
  totalHours: number,
): QueuedGameEvent {
  const instanceId: string = `${event.id}_${totalHours}`

  return {
    id: event.id,
    instanceId,
    type: 'work',
    title: event.title,
    description: event.description,
    choices: deepClone(event.choices),
    data: { earnedAmount },
  }
}

// =============================================================================
// НЕДЕЛЬНЫЙ БОНУС (отдельно от age-progress; не в GLOBAL_PROGRESS_EVENTS)
// =============================================================================

/** Контент weekly bonus; роллится из rollWeeklyEvents. */
export const WEEKLY_BONUS_MOMENT_EVENT = {
  id: 'weekly_bonus_moment',
  type: 'weekly' as const,
  title: 'Конец недели',
  description: 'Неделя завершена. Можно немного наградить себя или спокойно спланировать следующую.',
  choices: [
    {
      id: 'weekly_bonus_moment_reward_yourself',
      text: 'Наградить себя',
      outcome: 'Небольшое удовольствие помогло восстановить силы.',
      moneyDelta: -1200,
      statChanges: { mood: 14, stress: -10, energy: 6 },
    },
    {
      id: 'weekly_bonus_moment_focus_planning',
      text: 'Сфокусироваться на планировании',
      outcome: 'Вы сохранили деньги и лучше подготовились к следующей неделе.',
      statChanges: { stress: -6 },
      skillChanges: { timeManagement: 1 },
    },
  ],
}

// =============================================================================
// ГЛОБАЛЬНЫЕ ПРОГРЕСС-СОБЫТИЯ (возрастные пороги)
// =============================================================================

export const GLOBAL_PROGRESS_EVENTS = [
  {
    id: 'age_30_reunion',
    type: 'age' as const,
    title: '30 лет — встреча выпускников',
    triggerAge: 30,
    description: 'Одноклассники организовали встречу. Можно сравнить свой путь с чужими и немного переосмыслить жизнь.',
    choices: [
      {
        id: 'age_30_reunion_attend',
        text: 'Пойти на встречу',
        outcome: 'Вечер получился тёплым, немного ностальгическим и вдохновляющим.',
        moneyDelta: -800,
        statChanges: { mood: 15, stress: -5 },
        skillChanges: { communication: 1 },
      },
      {
        id: 'age_30_reunion_skip',
        text: 'Пропустить встречу',
        outcome: 'Вы остались в своём ритме и сохранили спокойствие.',
        statChanges: { stress: -3, mood: 2 },
      },
    ],
  },
  // NEEDS CLARIFICATION: GDD называет пороги 40/50/60 без полных карточек — заготовки по образцу 30.
  {
    id: 'age_40_milestone',
    type: 'age' as const,
    title: '40 лет — переоценка пути',
    triggerAge: 40,
    description: 'Сорокалетие заставляет оглянуться: карьера, здоровье и близкие требуют нового баланса.',
    choices: [
      {
        id: 'age_40_milestone_rebalance',
        text: 'Пересмотреть приоритеты',
        outcome: 'Вы наметили более устойчивый ритм на ближайшие годы.',
        statChanges: { stress: -8, mood: 8, health: 4 },
      },
      {
        id: 'age_40_milestone_keep_pace',
        text: 'Сохранить текущий темп',
        outcome: 'Вы решили не сбавлять обороты.',
        statChanges: { stress: 5, mood: 2 },
        skillChanges: { professionalism: 1 },
      },
    ],
  },
  {
    id: 'age_50_milestone',
    type: 'age' as const,
    title: '50 лет — зрелость и здоровье',
    triggerAge: 50,
    description: 'Полвека за плечами. Самое время честно оценить здоровье и долгосрочные цели.',
    choices: [
      {
        id: 'age_50_milestone_health_focus',
        text: 'Сфокусироваться на здоровье',
        outcome: 'Вы усилили заботу о себе.',
        statChanges: { health: 12, stress: -6, energy: 4 },
      },
      {
        id: 'age_50_milestone_legacy_focus',
        text: 'Думать о наследии',
        outcome: 'Вы больше думаете о том, что оставите после себя.',
        statChanges: { mood: 6, stress: -3 },
        skillChanges: { communication: 1 },
      },
    ],
  },
  {
    id: 'age_60_milestone',
    type: 'age' as const,
    title: '60 лет — новый этап',
    triggerAge: 60,
    description: 'Шестидесятилетие открывает новый жизненный этап и вопросы о темпе жизни.',
    choices: [
      {
        id: 'age_60_milestone_slow_down',
        text: 'Замедлиться осознанно',
        outcome: 'Вы позволили себе более спокойный ритм.',
        statChanges: { stress: -12, mood: 10, health: 6 },
      },
      {
        id: 'age_60_milestone_stay_active',
        text: 'Оставаться активным',
        outcome: 'Вы сохранили вовлечённость в дела и общение.',
        statChanges: { mood: 8, energy: -4 },
        skillChanges: { professionalism: 1 },
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
      id: 'finance_cash_gap_bank_loan',
      text: 'Взять кредит в банке',
      outcome: 'Вы оформили кредит. Теперь ежемесячные платежи увеличатся.',
      statChanges: { stress: 8, mood: -4 },
    },
    {
      id: 'finance_cash_gap_ask_family',
      text: 'Обратиться за помощью к семье',
      outcome: 'Семья помогла, но вы чувствуете себя неуютно из-за долга.',
      statChanges: { stress: 5, mood: -6 },
    },
    {
      id: 'finance_cash_gap_cut_expenses',
      text: 'Сократить расходы и пережить',
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
      id: 'finance_reserve_warning_replenish_reserve',
      text: 'Пополнить резерв',
      outcome: 'Вы решили отложить деньги на резерв для будущих расходов.',
      statChanges: { stress: 3, mood: 2 },
    },
    {
      id: 'finance_reserve_warning_ignore_warning',
      text: 'Игнорировать предупреждение',
      outcome: 'Вы решили не беспокоиться об этом сейчас.',
      statChanges: { stress: -2, mood: 1 },
    },
    {
      id: 'finance_reserve_warning_review_expenses',
      text: 'Проанализировать расходы',
      outcome: 'Вы пересмотрели свои расходы и нашли способы сэкономить.',
      statChanges: { stress: 4, mood: -2 },
      skillChanges: { timeManagement: 1 },
    },
  ],
}

/**
 * Создаёт событие увольнения за невыполнение недельной нормы часов.
 * @description [Domain] - формирует queued-событие типа career с вариантами «найти новую работу» или «взять перерыв».
 * @return { QueuedGameEvent } объект queued-события с type=career
 */
export function createWeeklyJobDismissalQueuedEvent(params: WeeklyJobDismissalParams): QueuedGameEvent {
  const { jobName, worked: _worked, required: _required, newWeekNumber, jobId } = params
  return {
    id: 'job_dismissal',
    type: 'career' as const,
    title: 'Увольнение с работы',
    description: `Вы не набрали достаточное количество часов на работе "${jobName}" за неделю. Вы уволены.`,
    choices: [
      {
        id: 'job_dismissal_find_new_job',
        text: 'Найти новую работу',
        outcome: 'Вы начали искать новую работу.',
        statChanges: { stress: 8, mood: -5 },
      },
      {
        id: 'job_dismissal_take_break',
        text: 'Взять перерыв',
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