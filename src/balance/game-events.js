/**
 * Централизованные определения игровых событий (очередь выбора, микро-события, работа, финансы).
 * Паттерн: как `career-jobs.js` — тексты, шансы и последствия правятся здесь, системы только подставляют контекст (неделя, часы, имя работы).
 */

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

// --- Микро-события (TimeSystem: случайный триггер по типу действия) ---

/** Ключ = тип действия при advance; `default` — запасной шаблон. */
export const MICRO_EVENT_BY_ACTION = {
  buy_groceries: {
    id: 'micro_robbery_market',
    baseChance: 0.01,
    title: 'Подозрительные люди у магазина',
    description: 'Возле магазина вас попытались ограбить.',
  },
  default: {
    id: 'micro_minor_injury',
    baseChance: 0.03,
    title: 'Случайная травма',
    description: 'Вы больно ударились мизинцем об угол стола.',
    statImpact: { health: -1 },
  },
};

/** Варианты ответа по `id` шаблона; `__default` — общий запасной набор. */
export const MICRO_EVENT_CHOICES_BY_ID = {
  micro_robbery_market: [
    {
      label: 'Попытаться убежать',
      outcome: 'Вы рванули с места. Всё решает подготовка и реакция.',
      skillCheck: {
        key: 'physicalFitness',
        threshold: 4,
        successStatChanges: { stress: -4, mood: 2 },
        failStatChanges: { health: -6, stress: 8, mood: -4 },
        failMoneyDelta: -1200,
      },
    },
    {
      label: 'Отдать часть денег',
      outcome: 'Конфликт не обострился, но кошелёк похудел.',
      moneyDelta: -900,
      statChanges: { stress: 5, mood: -2 },
    },
  ],
  micro_minor_injury: [
    {
      label: 'Обработать удар и дать пальцу отдых',
      outcome:
        'Холодная вода и минута покоя — боль отпускает быстрее, нервы успокаиваются.',
      statChanges: { stress: -4, mood: 2 },
    },
    {
      label: 'Стерпеть и идти дальше',
      outcome:
        'Вы отмахнулись и продолжили день. Ноющий мизинец и раздражение не отпускают.',
      statChanges: { stress: 5, mood: -3 },
    },
    {
      label: 'Отшутиться и не зацикливаться',
      outcome: 'Самоирония сгладила острые углы — настроение чуть поднялось.',
      statChanges: { mood: 5, stress: -2 },
    },
  ],
  __default: [
    {
      label: 'Реагировать спокойно',
      outcome: 'Вы выбрали спокойный вариант и сохранили темп.',
      statChanges: { stress: -3, mood: 2 },
    },
    {
      label: 'Проигнорировать',
      outcome: 'Ничего критичного не произошло, но остался осадок.',
      statChanges: { stress: 2 },
    },
  ],
};

/**
 * Готовый объект для постановки в очередь микро-события.
 */
export function buildMicroQueuedEvent(def, actionType, totalHours) {
  const instanceId = `${def.id}_${totalHours}`;
  const choiceSource =
    MICRO_EVENT_CHOICES_BY_ID[def.id] ?? MICRO_EVENT_CHOICES_BY_ID.__default;
  return {
    ...def,
    type: 'micro',
    actionSource: actionType,
    instanceId,
    choices: deepClone(choiceSource),
  };
}

// --- Периодические события (SceneAdapter + TimeSystem hooks) ---

export function createWeeklySummaryQueuedEvent(weekNumber) {
  return {
    id: 'weekly_summary',
    type: 'weekly',
    title: `Итоги недели #${weekNumber}`,
    description: 'Неделя завершена. Подведите итоги и выберите фокус на следующую.',
    choices: [
      {
        label: 'Восстановиться',
        outcome: 'Вы дали себе немного выдохнуть.',
        statChanges: { stress: -6, mood: 6 },
      },
      {
        label: 'Сфокусироваться на работе',
        outcome: 'Темп сохранён, но цена — чуть больше стресса.',
        statChanges: { stress: 3 },
        skillChanges: { professionalism: 1 },
      },
    ],
    instanceId: `weekly_summary_${weekNumber}`,
  };
}

export function createYearlyReflectionQueuedEvent(yearNumber) {
  return {
    id: 'yearly_reflection',
    type: 'yearly',
    title: `Год ${yearNumber}: большой итог`,
    description: 'Прошёл ещё один год. Время подвести большой итог и выбрать приоритет.',
    choices: [
      {
        label: 'Сделать упор на здоровье',
        outcome: 'Вы перераспределили фокус в пользу долгой дистанции.',
        statChanges: { health: 8, stress: -6 },
      },
      {
        label: 'Сделать упор на карьеру',
        outcome: 'Карьерный темп растёт, но цена — выше нагрузка.',
        statChanges: { stress: 6, mood: -2 },
        skillChanges: { professionalism: 1 },
      },
    ],
    instanceId: `yearly_reflection_${yearNumber}`,
  };
}

// --- Карьера (WorkPeriodSystem) ---

const WEEKLY_JOB_DISMISSAL_CHOICES = [
  {
    label: 'Понятно',
    outcome: 'Вы приняли решение работодателя.',
    statChanges: { stress: 8, mood: -5 },
  },
];

export function createWeeklyJobDismissalQueuedEvent({
  jobName,
  worked,
  required,
  newWeekNumber,
  jobId,
}) {
  return {
    id: 'weekly_job_dismissal_underwork',
    type: 'career',
    title: 'Увольнение',
    description:
      `За прошедшую неделю вы отработали ${worked} ч из ${required} ч по норме.\n\n` +
      `Работодатель расторг контракт: должность «${jobName}» потеряна.\n\n` +
      `Следующую игровую неделю вы не сможете снова устроиться на эту же позицию.`,
    choices: deepClone(WEEKLY_JOB_DISMISSAL_CHOICES),
    instanceId: `weekly_job_dismissal_${newWeekNumber}_${jobId}`,
  };
}

// --- Финансы: шаблоны для очереди (ECS) и legacy/debug (массив) ---

export const EVENT_FINANCE_RESERVE_WARNING = {
  id: 'finance_reserve_warning',
  type: 'emergency',
  title: 'Резерв почти закончился',
  description:
    'Подушка стала слишком тонкой. Пора решить, что важнее: срочно ужаться по тратам или удержать привычный ритм.',
  choices: [
    {
      label: 'Жёстко урезать досуг',
      outcome: 'Ты быстро стабилизировал бюджет, но настроение просело.',
      statChanges: { stress: -4, mood: -6 },
      skillChanges: { financialLiteracy: 1 },
      monthlyExpenseDelta: { leisure: -2000 },
    },
    {
      label: 'Оставить как есть',
      outcome: 'Комфорт сохранился, но тревога о деньгах стала сильнее.',
      statChanges: { stress: 8, mood: -2 },
    },
  ],
};

export const EVENT_FINANCE_CASH_GAP = {
  id: 'finance_cash_gap',
  type: 'emergency',
  title: 'Кассовый разрыв месяца',
  description:
    'Обязательные расходы съели почти всё. Нужно быстро решить, откуда взять воздух на следующий цикл.',
  choices: [
    {
      label: 'Переложить из резерва',
      outcome: 'Ты закрыл дыру за счёт подушки и немного снизил давление.',
      statChanges: { stress: -3 },
    },
    {
      label: 'Сократить жильё',
      outcome: 'Решение неприятное, но бюджет станет заметно легче уже со следующего месяца.',
      statChanges: { mood: -8, stress: 4 },
      housingLevelDelta: -1,
    },
  ],
};

/** Порядок как в legacy: предупреждение, затем разрыв — для отладочной панели и `game-state`. */
export const FINANCE_EMERGENCY_EVENTS = [EVENT_FINANCE_RESERVE_WARNING, EVENT_FINANCE_CASH_GAP];

/**
 * Копия шаблона для постановки в очередь (без разделения ссылок между инстансами).
 */
export function cloneQueuedEventTemplate(template) {
  return deepClone(template);
}

// --- Случайные события смены (legacy game-state / WorkEvent) ---

export const WORK_RANDOM_EVENTS = [
  {
    id: 'deadline_push',
    title: 'Срочный дедлайн',
    description:
      'Команде внезапно нужно закрыть задачу до конца дня. Можно впрячься самому или быстро собрать помощь.',
    probability: 0.22,
    cooldownDays: 20,
    minClicks: 24,
    choices: [
      {
        label: 'Рвануть самому',
        outcome: 'Ты вытянул дедлайн ценой лишних сил, зато руководство это заметило.',
        salaryMultiplier: 0.25,
        statChanges: { energy: -20, stress: 15 },
      },
      {
        label: 'Собрать помощь',
        outcome: 'Коллеги включились в последний момент. Темп ниже, но нагрузка мягче.',
        salaryMultiplier: 0.1,
        statChanges: { energy: -10, stress: 6, mood: 4 },
      },
    ],
  },
  {
    id: 'colleague_help',
    title: 'Коллега помог',
    description: 'Сосед по отделу заметил, что ты тонешь в задачах, и предложил подхватить часть рутины.',
    probability: 0.18,
    cooldownDays: 16,
    choices: [
      {
        label: 'Принять помощь',
        outcome: 'Ты сохранил силы и закончил день спокойнее обычного.',
        salaryMultiplier: 0.1,
        statChanges: { mood: 10, stress: -4 },
      },
      {
        label: 'Справиться самому',
        outcome: 'Удалось доказать самостоятельность, но день вышел немного тяжелее.',
        salaryMultiplier: 0.04,
        statChanges: { stress: 6, energy: -8 },
      },
    ],
  },
  {
    id: 'tech_issues',
    title: 'Технические неполадки',
    description:
      'Рабочий инструмент подвёл в середине смены. Можно задержаться и чинить процесс или смириться с потерями.',
    probability: 0.2,
    cooldownDays: 18,
    choices: [
      {
        label: 'Остаться и добить',
        outcome: 'Часть дня удалось спасти, но усталость заметно выросла.',
        salaryMultiplier: -0.05,
        statChanges: { energy: -12, stress: 8 },
      },
      {
        label: 'Сообщить и свернуть',
        outcome: 'Потери по деньгам выше, зато ты не выгорел окончательно.',
        salaryMultiplier: -0.15,
        statChanges: { energy: -6, mood: -4 },
      },
    ],
  },
  {
    id: 'mid_month_raise',
    title: 'Повышение в середине месяца',
    description: 'Руководитель отметил твой темп и предлагает чуть поднять ставку уже с этого дня.',
    probability: 0.08,
    cooldownDays: 90,
    minClicks: 58,
    requiresSkill: { professionalism: 2 },
    choices: [
      {
        label: 'Взять ответственность',
        outcome: 'Ставка выросла, но ожидания тоже стали выше.',
        salaryMultiplier: 0.1,
        permanentSalaryMultiplier: 0.05,
        statChanges: { mood: 12, stress: 8 },
      },
      {
        label: 'Оставить как есть',
        outcome: 'Ты сохранил привычный ритм без дополнительной нагрузки.',
        salaryMultiplier: 0,
        statChanges: { stress: -2, mood: 2 },
      },
    ],
  },
  {
    id: 'strategy_session',
    title: 'Стратегическая сессия',
    description:
      'Тебя позвали на встречу, где нужны не только руки, но и структурное мышление. Это шанс показать взрослый уровень.',
    probability: 0.14,
    cooldownDays: 28,
    minClicks: 40,
    requiresSkill: { professionalism: 4 },
    requiresEducationRank: 1,
    choices: [
      {
        label: 'Вести обсуждение',
        outcome: 'Ты уверенно собрал аргументы и получил заметный плюс к доверию команды.',
        salaryMultiplier: 0.16,
        statChanges: { stress: 10, mood: 8 },
      },
      {
        label: 'Поддержать аналитикой',
        outcome: 'Ты сработал аккуратно и полезно, без лишнего давления на себя.',
        salaryMultiplier: 0.08,
        statChanges: { stress: 4, mood: 4 },
      },
    ],
  },
  {
    id: 'client_presentation',
    title: 'Презентация для клиента',
    description:
      'Клиенту нужен понятный разбор ситуации. Здесь образование и коммуникация уже действительно влияют на исход.',
    probability: 0.12,
    cooldownDays: 24,
    minClicks: 40,
    requiresSkill: { communication: 3 },
    requiresEducationRank: 1,
    choices: [
      {
        label: 'Выступить самому',
        outcome: 'Презентация вышла убедительной, и день принёс больше пользы, чем обычно.',
        salaryMultiplier: 0.18,
        statChanges: { mood: 10, energy: -8 },
      },
      {
        label: 'Собрать материалы',
        outcome: 'Ты не выходил на первый план, но обеспечил команде сильную базу.',
        salaryMultiplier: 0.1,
        statChanges: { stress: -2, energy: -4 },
      },
    ],
  },
];

// --- Глобальные сюжетные события (legacy queue из game-state) ---

export const GLOBAL_PROGRESS_EVENTS = [
  {
    id: 'weekly_bonus_moment',
    type: 'weekly',
    title: 'Конец недели',
    description:
      'Неделя закрыта. Можно перевести дух, взять маленький бонус к настроению или спокойно спланировать следующую.',
    choices: [
      {
        label: 'Наградить себя',
        outcome: 'Небольшой ритуал завершения недели помогает не рассыпаться на дистанции.',
        moneyDelta: -900,
        statChanges: { mood: 12, stress: -8 },
      },
      {
        label: 'Планировать дальше',
        outcome: 'Ты сохранил деньги и чуть снизил тревогу перед следующими днями.',
        statChanges: { stress: -5 },
        skillChanges: { timeManagement: 1 },
      },
    ],
  },
  {
    id: 'weekly_friend_ping',
    type: 'weekly',
    title: 'Сообщение от друга',
    description:
      'Под конец недели написал старый друг: зовёт выбраться на прогулку и выдохнуть после работы.',
    choices: [
      {
        label: 'Встретиться',
        outcome: 'Короткая встреча заметно подняла настроение и поддержала отношения.',
        moneyDelta: -500,
        statChanges: { mood: 10, stress: -6 },
        relationshipDelta: 8,
      },
      {
        label: 'Ответить позже',
        outcome: 'Ты сохранил силы сегодня, но контакт чуть остыл.',
        statChanges: { energy: 4 },
        relationshipDelta: -3,
      },
    ],
  },
  {
    id: 'age_30_reunion',
    type: 'age',
    title: '30 лет: встреча выпускников',
    triggerAge: 30,
    description:
      'Тебя приглашают на встречу выпускников. Можно сравнить свой путь с чужими историями и немного переосмыслить цель.',
    choices: [
      {
        label: 'Пойти',
        outcome: 'Вечер вышел тёплым и немного вдохновляющим.',
        moneyDelta: -500,
        statChanges: { mood: 12, stress: -4 },
        skillChanges: { communication: 1 },
      },
      {
        label: 'Не идти',
        outcome: 'Ты сохранил спокойствие и остался в своём ритме.',
        statChanges: { stress: -2 },
      },
    ],
  },
];
