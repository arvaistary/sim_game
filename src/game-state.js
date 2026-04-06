function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function clone(value) {
  return structuredClone(value);
}

export const DEFAULT_SAVE = {
  version: "0.2.0",
  playerName: "Алексей",
  startAge: 23,
  currentAge: 24,
  gameDays: 146,
  gameWeeks: 20,
  gameMonths: 5,
  gameYears: 0.4,
  money: 68450,
  totalEarnings: 68450,
  totalSpent: 0,
  currentJob: {
    id: "office_employee",
    name: "Офисный сотрудник",
    schedule: "5/2",
    salaryPerWeek: 42000,
    salaryPerDay: 8400,
    level: 1,
    daysAtWork: 146,
  },
  housing: {
    level: 1,
    name: "Студия",
    comfort: 35,
    furniture: [],
    lastWeeklyBonus: null,
  },
  skills: {
    professionalism: 2,
    communication: 2,
    timeManagement: 2,
    healthyLifestyle: 1,
    financialLiteracy: 1,
    stressResistance: 1,
  },
  education: {
    school: "completed",
    institute: "none",
    educationLevel: "Среднее",
    activeCourses: [],
  },
  relationships: [
    {
      id: "friend_ivan",
      name: "Иван",
      type: "friend",
      level: 42,
      lastContact: 142,
    },
  ],
  investments: [],
  finance: {
    reserveFund: 18000,
    monthlyExpenses: {
      housing: 16000,
      food: 9000,
      transport: 4500,
      leisure: 6500,
      education: 2500,
    },
    lastMonthlySettlement: null,
  },
  eventHistory: [],
  pendingEvents: [],
  lifetimeStats: {
    totalWorkDays: 0,
    totalEvents: 0,
    maxMoney: 68450,
  },
  stats: {
    hunger: 64,
    energy: 57,
    stress: 42,
    mood: 73,
    health: 81,
    physical: 49,
  },
};

export const RECOVERY_TABS = [
  {
    id: "shop",
    label: "Магазин",
    icon: "М",
    accentKey: "accent",
    title: "Быстрое восстановление",
    subtitle: "Еда, бытовые мелочи и базовые покупки после рабочей смены.",
    cards: [
      { title: "Быстрый перекус", price: 150, dayCost: 1, effect: "Голод +35 • Энергия +10 • Стресс -5", mood: "На 5 минут и снова в ритм", statChanges: { hunger: 35, energy: 10, stress: -5 } },
      { title: "Полноценный обед", price: 450, dayCost: 1, effect: "Голод +65 • Энергия +25 • Настроение +15", mood: "Самый стабильный вариант", statChanges: { hunger: 65, energy: 25, mood: 15 } },
      { title: "Запас продуктов домой", price: 1200, dayCost: 1, effect: "Голод +25 • Настроение +8 • Комфорт дома +2", mood: "Небольшой буфер комфорта", statChanges: { hunger: 25, mood: 8 }, housingComfortDelta: 2 },
    ],
  },
  {
    id: "fun",
    label: "Развлечения",
    icon: "Р",
    accentKey: "blue",
    title: "Сбросить напряжение",
    subtitle: "Сцены отдыха помогают стабилизировать стресс и настроение.",
    cards: [
      { title: "Вечер дома", price: 0, dayCost: 1, effect: "Энергия +55 • Настроение +20 • Стресс -25", mood: "Самый бережный отдых", statChanges: { energy: 55, mood: 20, stress: -25 } },
      { title: "Кино или прогулка", price: 800, dayCost: 1, effect: "Энергия +30 • Настроение +45 • Стресс -30", mood: "Мягкий городской уют", statChanges: { energy: 30, mood: 45, stress: -30 } },
      { title: "Спортзал", price: 1200, dayCost: 1, effect: "Энергия +40 • Настроение +35 • Стресс -35 • Форма +10", mood: "Хорошо для длинной дистанции", statChanges: { energy: 40, mood: 35, stress: -35, physical: 10 } },
    ],
  },
  {
    id: "home",
    label: "Дом",
    icon: "Д",
    accentKey: "sage",
    title: "Комфорт и жильё",
    subtitle: "Уют комнаты влияет на эффективность восстановления и будущий прогресс.",
    cards: [
      { title: "Хорошая кровать", price: 18000, dayCost: 1, effect: "Энергия +18 • Здоровье +8 • Комфорт дома +10", mood: "Лучшее вложение в ежедневный цикл", statChanges: { energy: 18, health: 8 }, housingComfortDelta: 10, furnitureId: "good_bed" },
      { title: "Холодильник", price: 24000, dayCost: 1, effect: "Голод +12 • Комфорт дома +12", mood: "Работает каждый ход", statChanges: { hunger: 12 }, housingComfortDelta: 12, furnitureId: "refrigerator" },
      { title: "Декор и свет", price: 9500, dayCost: 1, effect: "Комфорт дома +8 • Настроение +5", mood: "Уют без лишней сложности", statChanges: { mood: 5 }, housingComfortDelta: 8, furnitureId: "decor_light" },
      {
        title: "Переехать в 1-комнатную квартиру",
        price: 95000,
        dayCost: 2,
        effect: "Уровень жилья 2 • Комфорт до 52 • Домашние бонусы сильнее",
        mood: "Следующий шаг к более устойчивому циклу",
        housingUpgradeLevel: 2,
      },
      {
        title: "Переехать в уютную квартиру",
        price: 210000,
        dayCost: 3,
        effect: "Уровень жилья 3 • Комфорт до 72 • Больше пассивного восстановления",
        mood: "Дорогой, но очень сильный апгрейд качества жизни",
        housingUpgradeLevel: 3,
      },
    ],
  },
  {
    id: "education",
    label: "Обучение",
    icon: "О",
    accentKey: "accent",
    title: "Развитие навыков",
    subtitle: "Книги, курсы и образование открывают новые работы и повышают доход.",
    cards: [
      { title: "Книга по тайм-менеджменту", price: 900, dayCost: 1, effect: "Навык +1 • Стресс -5", mood: "Дешёвый и быстрый рост", statChanges: { stress: -5 }, skillChanges: { timeManagement: 1 } },
      { title: "Онлайн-курс", price: 6500, dayCost: 4, effect: "Профессионализм +1 • Коммуникация +1 • Настроение +8", mood: "Средний темп с хорошей отдачей", statChanges: { mood: 8, energy: -8 }, skillChanges: { professionalism: 1, communication: 1 } },
      { title: "Институт / переподготовка", price: 120000, dayCost: 7, effect: "Профессионализм +2 • ЗП за день +5% • Новая образовательная ступень", mood: "Долгий маршрут к сильной работе", skillChanges: { professionalism: 2 }, salaryMultiplierDelta: 0.05, educationLevel: "Высшее" },
    ],
  },
  {
    id: "social",
    label: "Соц. жизнь",
    icon: "С",
    accentKey: "blue",
    title: "Отношения и поддержка",
    subtitle: "Связи снижают стресс, повышают настроение и создают долгосрочные бонусы.",
    cards: [
      { title: "Встретиться с другом", price: 500, dayCost: 1, effect: "Настроение +18 • Стресс -12 • Отношения +8", mood: "Надёжный способ перевести дух", statChanges: { mood: 18, stress: -12 }, relationshipDelta: 8 },
      { title: "Позвонить родителям", price: 0, dayCost: 1, effect: "Настроение +10 • Стресс -8", mood: "Небольшой, но частый буст", statChanges: { mood: 10, stress: -8 }, relationshipDelta: 4 },
      { title: "Свидание", price: 1800, dayCost: 1, effect: "Настроение +22 • Отношения +12", mood: "Для длинной эмоциональной линии", statChanges: { mood: 22, stress: -6 }, relationshipDelta: 12 },
    ],
  },
      {
        id: "finance",
        label: "Финансы",
    icon: "Ф",
    accentKey: "sage",
    title: "Деньги и планирование",
        subtitle: "Финансовые решения влияют на стабильность, риски и будущий доход.",
        cards: [
      { title: "Отложить в резерв", price: 5000, dayCost: 1, effect: "Резерв +5 000 • Стресс -10 • Настроение +6", mood: "Снижает тревожность перед расходами", statChanges: { stress: -10, mood: 6 }, reserveDelta: 5000 },
      { title: "Открыть депозит", price: 50000, dayCost: 1, effect: "Инвестиция +4 000 • Финансовая грамотность +1", mood: "Низкий риск, спокойный рост", investmentReturn: 4000, investmentDurationDays: 28, skillChanges: { financialLiteracy: 1 } },
      { title: "Пересмотреть бюджет", price: 0, dayCost: 1, effect: "Стресс -8 • Финансовая грамотность +1", mood: "Хорошая рутина перед крупными целями", statChanges: { stress: -8 }, skillChanges: { financialLiteracy: 1 } },
    ],
  },
];

export const EDUCATION_PROGRAMS = [
  {
    id: "time_management_book",
    title: "Книга по тайм-менеджменту",
    subtitle: "Короткий и дешёвый способ подтянуть базовую дисциплину.",
    typeLabel: "Книга",
    cost: 900,
    daysRequired: 2,
    accentKey: "accent",
    rewardText: "Тайм-менеджмент +1 • Стресс -4",
    completionStatChanges: { stress: -4 },
    completionSkillChanges: { timeManagement: 1 },
  },
  {
    id: "online_productivity_course",
    title: "Онлайн-курс",
    subtitle: "Несколько дней системного обучения с хорошей отдачей в работе.",
    typeLabel: "Онлайн-курс",
    cost: 6500,
    daysRequired: 5,
    accentKey: "blue",
    rewardText: "Профессионализм +1 • Коммуникация +1 • Настроение +8",
    completionStatChanges: { mood: 8 },
    completionSkillChanges: { professionalism: 1, communication: 1 },
  },
  {
    id: "institute_retraining",
    title: "Институт / переподготовка",
    subtitle: "Длинный маршрут к новой ступени карьеры и более сильной базовой ставке.",
    typeLabel: "Институт",
    cost: 120000,
    daysRequired: 8,
    accentKey: "sage",
    rewardText: "Профессионализм +2 • ЗП за день +5% • Уровень образования: Высшее",
    completionSkillChanges: { professionalism: 2 },
    salaryMultiplierDelta: 0.05,
    educationLevel: "Высшее",
  },
];

export const CAREER_JOBS = [
  {
    id: "office_employee",
    name: "Офисный сотрудник",
    schedule: "5/2",
    level: 1,
    salaryPerDay: 8400,
    salaryPerWeek: 42000,
    minProfessionalism: 0,
    minEducationRank: 0,
  },
  {
    id: "project_coordinator",
    name: "Координатор проектов",
    schedule: "5/2",
    level: 2,
    salaryPerDay: 9800,
    salaryPerWeek: 49000,
    minProfessionalism: 3,
    minEducationRank: 0,
  },
  {
    id: "business_analyst",
    name: "Бизнес-аналитик",
    schedule: "5/2",
    level: 3,
    salaryPerDay: 12800,
    salaryPerWeek: 64000,
    minProfessionalism: 4,
    minEducationRank: 1,
  },
  {
    id: "team_lead",
    name: "Тимлид",
    schedule: "5/2",
    level: 4,
    salaryPerDay: 15600,
    salaryPerWeek: 78000,
    minProfessionalism: 6,
    minEducationRank: 1,
  },
];

export const HOUSING_LEVELS = [
  {
    level: 1,
    name: "Студия",
    baseComfort: 35,
    monthlyHousingCost: 16000,
    upgradePrice: 0,
  },
  {
    level: 2,
    name: "1-комнатная квартира",
    baseComfort: 52,
    monthlyHousingCost: 26000,
    upgradePrice: 95000,
  },
  {
    level: 3,
    name: "Уютная квартира",
    baseComfort: 72,
    monthlyHousingCost: 38000,
    upgradePrice: 210000,
  },
];

const FINANCE_ACTIONS = [
  {
    id: "reserve_transfer",
    title: "Пополнить резерв",
    subtitle: "Переложить часть свободных денег в финансовую подушку.",
    amount: 10000,
    reserveDelta: 10000,
    dayCost: 1,
    statChanges: { stress: -10, mood: 4 },
    skillChanges: { financialLiteracy: 1 },
    accentKey: "sage",
    description: "Ликвидные деньги -10 000 ₽ • Резерв +10 000 ₽ • Стресс -10",
  },
  {
    id: "open_deposit",
    title: "Открыть вклад",
    subtitle: "Заморозить капитал на 28 дней ради спокойного дохода.",
    amount: 50000,
    expectedReturn: 4000,
    durationDays: 28,
    dayCost: 1,
    statChanges: { stress: -4, mood: 3 },
    skillChanges: { financialLiteracy: 1 },
    accentKey: "blue",
    description: "Ликвидные деньги -50 000 ₽ • Через 28 дней можно забрать 54 000 ₽",
  },
  {
    id: "budget_review",
    title: "Пересобрать бюджет",
    subtitle: "Чуть снизить тревогу и подправить ежемесячные траты.",
    amount: 0,
    dayCost: 1,
    statChanges: { stress: -8, mood: 5 },
    skillChanges: { financialLiteracy: 1 },
    monthlyExpenseDelta: {
      leisure: -1000,
      education: 500,
    },
    accentKey: "accent",
    description: "Стресс -8 • Финансовая грамотность +1 • Расходы на досуг -1 000 ₽/мес",
  },
];

const WORK_RESULT_TIERS = [
  {
    minClicks: 58,
    grade: "Отличная смена",
    description: "Высокий темп работы. День прошёл эффективно и без заметных потерь по качеству.",
    color: "#4EBF7A",
    salaryMultiplier: 0.18,
    statChanges: { hunger: -16, energy: -18, stress: 8, mood: 6 },
  },
  {
    minClicks: 40,
    grade: "Стабильный результат",
    description: "Нормальная продуктивность без перегрузки. Это надёжный базовый итог рабочей фазы.",
    color: "#6D9DC5",
    salaryMultiplier: 0,
    statChanges: { hunger: -18, energy: -24, stress: 12, mood: -2 },
  },
  {
    minClicks: 24,
    grade: "Тяжёлая смена",
    description: "Ритм просел. День закрыт, но с потерей темпа и более заметной усталостью.",
    color: "#E8B94A",
    salaryMultiplier: -0.12,
    statChanges: { hunger: -22, energy: -30, stress: 18, mood: -8, health: -3 },
  },
  {
    minClicks: 0,
    grade: "Провальный темп",
    description: "Смена прошла тяжело: ошибок больше, ресурсов меньше, а настроение проседает.",
    color: "#D14D4D",
    salaryMultiplier: -0.25,
    statChanges: { hunger: -26, energy: -36, stress: 24, mood: -14, health: -6 },
  },
];

const WORK_RANDOM_EVENTS = [
  {
    id: "deadline_push",
    title: "Срочный дедлайн",
    description: "Команде внезапно нужно закрыть задачу до конца дня. Можно впрячься самому или быстро собрать помощь.",
    probability: 0.22,
    cooldownDays: 20,
    minClicks: 24,
    choices: [
      {
        label: "Рвануть самому",
        outcome: "Ты вытянул дедлайн ценой лишних сил, зато руководство это заметило.",
        salaryMultiplier: 0.25,
        statChanges: { energy: -20, stress: 15 },
      },
      {
        label: "Собрать помощь",
        outcome: "Коллеги включились в последний момент. Темп ниже, но нагрузка мягче.",
        salaryMultiplier: 0.1,
        statChanges: { energy: -10, stress: 6, mood: 4 },
      },
    ],
  },
  {
    id: "colleague_help",
    title: "Коллега помог",
    description: "Сосед по отделу заметил, что ты тонешь в задачах, и предложил подхватить часть рутины.",
    probability: 0.18,
    cooldownDays: 16,
    choices: [
      {
        label: "Принять помощь",
        outcome: "Ты сохранил силы и закончил день спокойнее обычного.",
        salaryMultiplier: 0.1,
        statChanges: { mood: 10, stress: -4 },
      },
      {
        label: "Справиться самому",
        outcome: "Удалось доказать самостоятельность, но день вышел немного тяжелее.",
        salaryMultiplier: 0.04,
        statChanges: { stress: 6, energy: -8 },
      },
    ],
  },
  {
    id: "tech_issues",
    title: "Технические неполадки",
    description: "Рабочий инструмент подвёл в середине смены. Можно задержаться и чинить процесс или смириться с потерями.",
    probability: 0.2,
    cooldownDays: 18,
    choices: [
      {
        label: "Остаться и добить",
        outcome: "Часть дня удалось спасти, но усталость заметно выросла.",
        salaryMultiplier: -0.05,
        statChanges: { energy: -12, stress: 8 },
      },
      {
        label: "Сообщить и свернуть",
        outcome: "Потери по деньгам выше, зато ты не выгорел окончательно.",
        salaryMultiplier: -0.15,
        statChanges: { energy: -6, mood: -4 },
      },
    ],
  },
  {
    id: "mid_month_raise",
    title: "Повышение в середине месяца",
    description: "Руководитель отметил твой темп и предлагает чуть поднять ставку уже с этого дня.",
    probability: 0.08,
    cooldownDays: 90,
    minClicks: 58,
    requiresSkill: { professionalism: 2 },
    choices: [
      {
        label: "Взять ответственность",
        outcome: "Ставка выросла, но ожидания тоже стали выше.",
        salaryMultiplier: 0.1,
        permanentSalaryMultiplier: 0.05,
        statChanges: { mood: 12, stress: 8 },
      },
      {
        label: "Оставить как есть",
        outcome: "Ты сохранил привычный ритм без дополнительной нагрузки.",
        salaryMultiplier: 0,
        statChanges: { stress: -2, mood: 2 },
      },
    ],
  },
  {
    id: "strategy_session",
    title: "Стратегическая сессия",
    description: "Тебя позвали на встречу, где нужны не только руки, но и структурное мышление. Это шанс показать взрослый уровень.",
    probability: 0.14,
    cooldownDays: 28,
    minClicks: 40,
    requiresSkill: { professionalism: 4 },
    requiresEducationRank: 1,
    choices: [
      {
        label: "Вести обсуждение",
        outcome: "Ты уверенно собрал аргументы и получил заметный плюс к доверию команды.",
        salaryMultiplier: 0.16,
        statChanges: { stress: 10, mood: 8 },
      },
      {
        label: "Поддержать аналитикой",
        outcome: "Ты сработал аккуратно и полезно, без лишнего давления на себя.",
        salaryMultiplier: 0.08,
        statChanges: { stress: 4, mood: 4 },
      },
    ],
  },
  {
    id: "client_presentation",
    title: "Презентация для клиента",
    description: "Клиенту нужен понятный разбор ситуации. Здесь образование и коммуникация уже действительно влияют на исход.",
    probability: 0.12,
    cooldownDays: 24,
    minClicks: 40,
    requiresSkill: { communication: 3 },
    requiresEducationRank: 1,
    choices: [
      {
        label: "Выступить самому",
        outcome: "Презентация вышла убедительной, и день принёс больше пользы, чем обычно.",
        salaryMultiplier: 0.18,
        statChanges: { mood: 10, energy: -8 },
      },
      {
        label: "Собрать материалы",
        outcome: "Ты не выходил на первый план, но обеспечил команде сильную базу.",
        salaryMultiplier: 0.1,
        statChanges: { stress: -2, energy: -4 },
      },
    ],
  },
];

const GLOBAL_PROGRESS_EVENTS = [
  {
    id: "weekly_bonus_moment",
    type: "weekly",
    title: "Конец недели",
    description: "Неделя закрыта. Можно перевести дух, взять маленький бонус к настроению или спокойно спланировать следующую.",
    choices: [
      {
        label: "Наградить себя",
        outcome: "Небольшой ритуал завершения недели помогает не рассыпаться на дистанции.",
        moneyDelta: -900,
        statChanges: { mood: 12, stress: -8 },
      },
      {
        label: "Планировать дальше",
        outcome: "Ты сохранил деньги и чуть снизил тревогу перед следующими днями.",
        statChanges: { stress: -5 },
        skillChanges: { timeManagement: 1 },
      },
    ],
  },
  {
    id: "weekly_friend_ping",
    type: "weekly",
    title: "Сообщение от друга",
    description: "Под конец недели написал старый друг: зовёт выбраться на прогулку и выдохнуть после работы.",
    choices: [
      {
        label: "Встретиться",
        outcome: "Короткая встреча заметно подняла настроение и поддержала отношения.",
        moneyDelta: -500,
        statChanges: { mood: 10, stress: -6 },
        relationshipDelta: 8,
      },
      {
        label: "Ответить позже",
        outcome: "Ты сохранил силы сегодня, но контакт чуть остыл.",
        statChanges: { energy: 4 },
        relationshipDelta: -3,
      },
    ],
  },
  {
    id: "age_30_reunion",
    type: "age",
    title: "30 лет: встреча выпускников",
    triggerAge: 30,
    description: "Тебя приглашают на встречу выпускников. Можно сравнить свой путь с чужими историями и немного переосмыслить цель.",
    choices: [
      {
        label: "Пойти",
        outcome: "Вечер вышел тёплым и немного вдохновляющим.",
        moneyDelta: -500,
        statChanges: { mood: 12, stress: -4 },
        skillChanges: { communication: 1 },
      },
      {
        label: "Не идти",
        outcome: "Ты сохранил спокойствие и остался в своём ритме.",
        statChanges: { stress: -2 },
      },
    ],
  },
];

const FINANCE_EMERGENCY_EVENTS = [
  {
    id: "finance_reserve_warning",
    title: "Резерв почти закончился",
    description: "Подушка стала слишком тонкой. Пора решить, что важнее: срочно ужаться по тратам или удержать привычный ритм.",
    choices: [
      {
        label: "Жёстко урезать досуг",
        outcome: "Ты быстро стабилизировал бюджет, но настроение просело.",
        statChanges: { stress: -4, mood: -6 },
        skillChanges: { financialLiteracy: 1 },
        monthlyExpenseDelta: { leisure: -2000 },
      },
      {
        label: "Оставить как есть",
        outcome: "Комфорт сохранился, но тревога о деньгах стала сильнее.",
        statChanges: { stress: 8, mood: -2 },
      },
    ],
  },
  {
    id: "finance_cash_gap",
    title: "Кассовый разрыв месяца",
    description: "Обязательные расходы съели почти всё. Нужно быстро решать, откуда взять воздух на следующий цикл.",
    choices: [
      {
        label: "Переложить из резерва",
        outcome: "Ты закрыл дыру за счёт подушки и немного снизил давление.",
        statChanges: { stress: -3 },
      },
      {
        label: "Сократить жильё",
        outcome: "Решение неприятное, но бюджет станет заметно легче уже со следующего месяца.",
        statChanges: { mood: -8, stress: 4 },
        housingLevelDelta: -1,
      },
    ],
  },
];

export function loadSave() {
  const stored = window.localStorage.getItem("game-life-save");

  if (!stored) {
    return clone(DEFAULT_SAVE);
  }

  try {
    const parsed = JSON.parse(stored);
    return {
      ...clone(DEFAULT_SAVE),
      ...parsed,
      stats: {
        ...DEFAULT_SAVE.stats,
        ...(parsed.stats ?? {}),
      },
      currentJob: {
        ...DEFAULT_SAVE.currentJob,
        ...(parsed.currentJob ?? {}),
      },
      housing: {
        ...DEFAULT_SAVE.housing,
        ...(parsed.housing ?? {}),
        furniture: parsed.housing?.furniture ?? DEFAULT_SAVE.housing.furniture,
      },
      skills: {
        ...DEFAULT_SAVE.skills,
        ...(parsed.skills ?? {}),
      },
      education: {
        ...DEFAULT_SAVE.education,
        ...(parsed.education ?? {}),
        activeCourses: parsed.education?.activeCourses ?? DEFAULT_SAVE.education.activeCourses,
      },
      finance: {
        ...DEFAULT_SAVE.finance,
        ...(parsed.finance ?? {}),
        monthlyExpenses: {
          ...DEFAULT_SAVE.finance.monthlyExpenses,
          ...(parsed.finance?.monthlyExpenses ?? {}),
        },
      },
      relationships: parsed.relationships ?? DEFAULT_SAVE.relationships,
      investments: parsed.investments ?? DEFAULT_SAVE.investments,
      eventHistory: parsed.eventHistory ?? DEFAULT_SAVE.eventHistory,
      pendingEvents: parsed.pendingEvents ?? DEFAULT_SAVE.pendingEvents,
      lifetimeStats: {
        ...DEFAULT_SAVE.lifetimeStats,
        ...(parsed.lifetimeStats ?? {}),
      },
    };
  } catch (error) {
    console.warn("Не удалось прочитать сохранение, использую демо-данные.", error);
    return clone(DEFAULT_SAVE);
  }
}

export function saveGame(saveData) {
  saveData.saveTime = Date.now();
  window.localStorage.setItem("game-life-save", JSON.stringify(saveData));
}

export function persistSave(scene, saveData) {
  saveData.lifetimeStats.maxMoney = Math.max(saveData.lifetimeStats.maxMoney ?? 0, saveData.money);
  scene.saveData = saveData;
  scene.registry.set("saveData", saveData);
  saveGame(saveData);
}

export function formatMoney(value) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export function validateRecoveryAction(saveData, cardData) {
  if (saveData.money < cardData.price) {
    return { ok: false, reason: `Недостаточно денег. Нужно ${formatMoney(cardData.price)} ₽, а сейчас доступно ${formatMoney(saveData.money)} ₽.` };
  }

  if (cardData.furnitureId && hasFurniture(saveData, cardData.furnitureId)) {
    return { ok: false, reason: "Это улучшение уже куплено. Лучше выбрать другой шаг восстановления." };
  }

  if (cardData.educationLevel === "Высшее" && saveData.education.educationLevel === "Высшее") {
    return { ok: false, reason: "Этот образовательный шаг уже закрыт. Можно сосредоточиться на курсах или следующей карьерной цели." };
  }

  if (cardData.housingUpgradeLevel) {
    const currentLevel = saveData.housing?.level ?? 1;
    if (cardData.housingUpgradeLevel <= currentLevel) {
      return { ok: false, reason: "Этот уровень жилья уже открыт. Лучше выбрать другое улучшение дома." };
    }

    if (cardData.housingUpgradeLevel > currentLevel + 1) {
      return { ok: false, reason: "Нельзя перепрыгнуть через уровень жилья. Сначала открой следующий доступный вариант." };
    }
  }

  if (cardData.housingSetLevel) {
    const currentLevel = saveData.housing?.level ?? 1;
    if (cardData.housingSetLevel === currentLevel) {
      return { ok: false, reason: "Этот уровень жилья уже активен." };
    }
  }

  return { ok: true };
}

export function applyRecoveryActionToSave(saveData, cardData) {
  const passive = getPassiveBonuses(saveData);
  const statChanges = { ...(cardData.statChanges ?? {}) };
  const isAssetTransfer = Boolean(cardData.reserveDelta || cardData.investmentReturn);

  if (cardData.title.includes("перекус") || cardData.title.includes("обед")) {
    statChanges.hunger = Math.round((statChanges.hunger ?? 0) * passive.foodRecoveryMultiplier);
  }

  if (cardData.title === "Вечер дома") {
    statChanges.mood = (statChanges.mood ?? 0) + passive.homeMoodBonus;
  }

  saveData.money -= cardData.price;
  if (!isAssetTransfer) {
    saveData.totalSpent += cardData.price;
  }
  applyStatChanges(saveData.stats, statChanges);
  applySkillChanges(saveData.skills, cardData.skillChanges);

  if (cardData.housingComfortDelta) {
    saveData.housing.comfort = clamp(saveData.housing.comfort + cardData.housingComfortDelta);
  }

  if (cardData.housingUpgradeLevel) {
    const housingTier = HOUSING_LEVELS.find((item) => item.level === cardData.housingUpgradeLevel);
    if (housingTier) {
      saveData.housing.level = housingTier.level;
      saveData.housing.name = housingTier.name;
      saveData.housing.comfort = Math.max(saveData.housing.comfort, housingTier.baseComfort);
      saveData.finance.monthlyExpenses.housing = housingTier.monthlyHousingCost;
    }
  }

  if (cardData.housingSetLevel) {
    const housingTier = HOUSING_LEVELS.find((item) => item.level === cardData.housingSetLevel);
    if (housingTier) {
      saveData.housing.level = housingTier.level;
      saveData.housing.name = housingTier.name;
      saveData.housing.comfort = Math.min(saveData.housing.comfort, housingTier.baseComfort + 12);
      saveData.finance.monthlyExpenses.housing = housingTier.monthlyHousingCost;
    }
  }

  if (cardData.furnitureId) {
    saveData.housing.furniture.push({ id: cardData.furnitureId, level: 1 });
  }

  applyRelationshipDelta(saveData, cardData.relationshipDelta);

  if (cardData.reserveDelta) {
    saveData.finance.reserveFund = Math.max(0, (saveData.finance?.reserveFund ?? 0) + cardData.reserveDelta);
  }

  if (cardData.investmentReturn) {
    openInvestment(saveData, {
      type: "deposit",
      label: cardData.title,
      amount: cardData.price,
      expectedReturn: cardData.investmentReturn,
      durationDays: cardData.investmentDurationDays ?? 28,
    });
  }

  if (cardData.salaryMultiplierDelta) {
    saveData.currentJob.salaryPerDay = Math.round(saveData.currentJob.salaryPerDay * (1 + cardData.salaryMultiplierDelta));
    saveData.currentJob.salaryPerWeek = saveData.currentJob.salaryPerDay * 5;
  }

  if (cardData.educationLevel) {
    saveData.education.educationLevel = cardData.educationLevel;
    saveData.education.institute = "completed";
  }

  advanceGameTime(saveData, cardData.dayCost ?? 1);

  return buildRecoverySummary(cardData, statChanges);
}

export function buildWorkOutcome(saveData, clickCount) {
  const tier = WORK_RESULT_TIERS.find((item) => clickCount >= item.minClicks) ?? WORK_RESULT_TIERS.at(-1);
  const workEvent = pickWorkEvent(saveData, clickCount);
  const baseSalary = calculateWorkDaySalary(saveData.currentJob.salaryPerDay, tier.salaryMultiplier);

  return {
    ...tier,
    baseSalary,
    workEvent,
    clickCount,
    previewText: [
      tier.description,
      `${clickCount} кликов за 10 секунд`,
      `Базовая выплата: ${formatMoney(baseSalary)} ₽`,
      workEvent ? `Сценарное событие: ${workEvent.title}` : "Сценарное событие не сработало",
    ].join("\n"),
  };
}

export function applyWorkOutcomeToSave(saveData, outcome, eventChoice) {
  const passive = getPassiveBonuses(saveData);
  const combinedStatChanges = mergeStatChanges(
    outcome.statChanges,
    eventChoice?.statChanges,
    {
      energy: Math.round(((outcome.statChanges.energy ?? 0) + (eventChoice?.statChanges?.energy ?? 0)) * (passive.workEnergyMultiplier - 1)),
    },
  );
  const salary = calculateWorkDaySalary(outcome.baseSalary, eventChoice?.salaryMultiplier ?? 0);

  saveData.money += salary;
  saveData.totalEarnings += salary;
  saveData.currentJob.daysAtWork = (saveData.currentJob.daysAtWork ?? 0) + 1;
  saveData.lifetimeStats.totalWorkDays = (saveData.lifetimeStats.totalWorkDays ?? 0) + 1;

  applyStatChanges(saveData.stats, combinedStatChanges);

  if (eventChoice?.permanentSalaryMultiplier) {
    saveData.currentJob.salaryPerDay = Math.round(saveData.currentJob.salaryPerDay * (1 + eventChoice.permanentSalaryMultiplier));
    saveData.currentJob.salaryPerWeek = saveData.currentJob.salaryPerDay * 5;
  }

  if (outcome.workEvent) {
    recordEvent(saveData, outcome.workEvent.id, outcome.workEvent.title);
  }

  advanceGameTime(saveData, 1);

  const careerUpdateSummary = syncCareerProgress(saveData);

  return buildWorkSummary(outcome, salary, combinedStatChanges, eventChoice, careerUpdateSummary);
}

export function consumePendingEvent(saveData) {
  if (!saveData.pendingEvents?.length) {
    return null;
  }

  return saveData.pendingEvents.shift() ?? null;
}

export function applyQueuedEventChoice(saveData, queuedEvent, choiceIndex) {
  const choice = queuedEvent?.choices?.[choiceIndex];
  if (!queuedEvent || !choice) {
    return "";
  }

  saveData.money += choice.moneyDelta ?? 0;
  saveData.totalEarnings += Math.max(0, choice.moneyDelta ?? 0);
  saveData.totalSpent += Math.max(0, -(choice.moneyDelta ?? 0));
  applyStatChanges(saveData.stats, choice.statChanges);
  applySkillChanges(saveData.skills, choice.skillChanges);
  applyRelationshipDelta(saveData, choice.relationshipDelta);
  applyMonthlyExpenseDelta(saveData, choice.monthlyExpenseDelta);

  if (choice.housingLevelDelta) {
    shiftHousingLevel(saveData, choice.housingLevelDelta);
  }

  recordEvent(saveData, queuedEvent.id, queuedEvent.title);

  return [
    `${queuedEvent.title}`,
    choice.outcome,
    summarizeStatChanges(choice.statChanges),
    typeof choice.moneyDelta === "number" && choice.moneyDelta !== 0
      ? `Деньги ${choice.moneyDelta > 0 ? "+" : ""}${formatMoney(choice.moneyDelta)} ₽`
      : "",
    choice.housingLevelDelta
      ? `Жильё: ${saveData.housing.name}`
      : "",
  ].filter(Boolean).join("\n");
}

export function canStartEducationProgram(saveData, program) {
  if (saveData.money < program.cost) {
    return { ok: false, reason: `Недостаточно денег. Нужно ${formatMoney(program.cost)} ₽.` };
  }

  if (saveData.education.activeCourses?.length) {
    return { ok: false, reason: "Сейчас уже идёт обучение. Сначала заверши активный курс." };
  }

  if (program.educationLevel && saveData.education.educationLevel === program.educationLevel) {
    return { ok: false, reason: "Этот уровень образования уже получен." };
  }

  return { ok: true };
}

export function getCareerTrack(saveData) {
  const professionalism = saveData.skills?.professionalism ?? 0;
  const educationRank = getEducationRank(saveData.education?.educationLevel);
  const currentJobId = saveData.currentJob?.id;

  return CAREER_JOBS.map((job) => ({
    ...job,
    current: currentJobId === job.id,
    unlocked: professionalism >= job.minProfessionalism && educationRank >= job.minEducationRank,
    missingProfessionalism: Math.max(0, job.minProfessionalism - professionalism),
    educationRequiredLabel: getEducationLabelByRank(job.minEducationRank),
  }));
}

export function getFinanceOverview(saveData) {
  const monthlyExpenses = saveData.finance?.monthlyExpenses ?? DEFAULT_SAVE.finance.monthlyExpenses;
  const expenseLines = [
    { id: "housing", label: "Жильё", amount: monthlyExpenses.housing ?? 0 },
    { id: "food", label: "Еда", amount: monthlyExpenses.food ?? 0 },
    { id: "transport", label: "Транспорт", amount: monthlyExpenses.transport ?? 0 },
    { id: "leisure", label: "Досуг", amount: monthlyExpenses.leisure ?? 0 },
    { id: "education", label: "Обучение", amount: monthlyExpenses.education ?? 0 },
  ];
  const monthlyExpensesTotal = expenseLines.reduce((sum, item) => sum + item.amount, 0);
  const monthlyIncome = (saveData.currentJob?.salaryPerWeek ?? 0) * 4;
  const reserveFund = saveData.finance?.reserveFund ?? 0;
  const activeInvestments = (saveData.investments ?? []).map((investment) => {
    const state = getInvestmentState(investment, saveData.gameDays);
    return {
      ...investment,
      state,
      maturityDay: investment.maturityDay ?? ((investment.startDate ?? 0) + (investment.durationDays ?? 28)),
      daysLeft: Math.max(0, (investment.maturityDay ?? ((investment.startDate ?? 0) + (investment.durationDays ?? 28))) - saveData.gameDays),
      payoutAmount: (investment.amount ?? 0) + (investment.expectedReturn ?? 0),
    };
  });
  const investedTotal = activeInvestments
    .filter((item) => item.state !== "closed")
    .reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const expectedReturnTotal = activeInvestments
    .filter((item) => item.state !== "closed")
    .reduce((sum, item) => sum + (item.expectedReturn ?? 0), 0);

  return {
    liquidMoney: saveData.money,
    reserveFund,
    investedTotal,
    expectedReturnTotal,
    monthlyIncome,
    monthlyExpensesTotal,
    monthlyBalance: monthlyIncome - monthlyExpensesTotal,
    expenseLines,
    investments: activeInvestments.filter((item) => item.state !== "closed"),
    lastMonthlySettlement: saveData.finance?.lastMonthlySettlement ?? null,
  };
}

export function getHousingOverview(saveData) {
  const currentLevel = saveData.housing?.level ?? 1;
  const currentTier = HOUSING_LEVELS.find((item) => item.level === currentLevel) ?? HOUSING_LEVELS[0];
  const nextTier = HOUSING_LEVELS.find((item) => item.level === currentLevel + 1) ?? null;
  const passive = getPassiveBonuses(saveData);
  const weeklyBonus = buildWeeklyHousingBonus(saveData);

  return {
    currentTier,
    nextTier,
    comfort: saveData.housing?.comfort ?? currentTier.baseComfort,
    furnitureCount: saveData.housing?.furniture?.length ?? 0,
    passive,
    weeklyBonus: {
      ...weeklyBonus,
      summary: summarizeStatChanges(weeklyBonus),
    },
    lastWeeklyBonus: saveData.housing?.lastWeeklyBonus ?? null,
  };
}

export function getFinanceActions(saveData) {
  const overview = getFinanceOverview(saveData);
  return FINANCE_ACTIONS.map((action) => ({
    ...action,
    available: overview.liquidMoney >= action.amount,
    reason: overview.liquidMoney >= action.amount ? "" : `Нужно ${formatMoney(action.amount)} ₽ свободных денег.`,
  }));
}

export function applyFinanceActionToSave(saveData, actionId) {
  const action = FINANCE_ACTIONS.find((item) => item.id === actionId);
  if (!action) {
    return "Финансовое действие не найдено.";
  }

  if (saveData.money < action.amount) {
    return `Недостаточно свободных денег. Нужно ${formatMoney(action.amount)} ₽.`;
  }

  if (action.id === "reserve_transfer") {
    saveData.money -= action.amount;
    saveData.finance.reserveFund = Math.max(0, (saveData.finance?.reserveFund ?? 0) + action.reserveDelta);
  }

  if (action.id === "open_deposit") {
    saveData.money -= action.amount;
    openInvestment(saveData, {
      type: "deposit",
      label: action.title,
      amount: action.amount,
      expectedReturn: action.expectedReturn,
      durationDays: action.durationDays,
    });
  }

  if (action.id === "budget_review") {
    Object.entries(action.monthlyExpenseDelta ?? {}).forEach(([key, value]) => {
      const currentValue = saveData.finance.monthlyExpenses[key] ?? 0;
      saveData.finance.monthlyExpenses[key] = Math.max(0, currentValue + value);
    });
  }

  applyStatChanges(saveData.stats, action.statChanges);
  applySkillChanges(saveData.skills, action.skillChanges);
  advanceGameTime(saveData, action.dayCost ?? 1);

  return [
    `${action.title} выполнено.`,
    action.description,
    summarizeStatChanges(action.statChanges),
  ].filter(Boolean).join("\n");
}

export function collectInvestmentToSave(saveData, investmentId) {
  const investment = saveData.investments?.find((item) => item.id === investmentId);
  if (!investment) {
    return "Инвестиция не найдена.";
  }

  const state = getInvestmentState(investment, saveData.gameDays);
  if (state === "closed") {
    return "Эта инвестиция уже закрыта.";
  }

  if (state !== "matured") {
    const maturityDay = investment.maturityDay ?? ((investment.startDate ?? 0) + (investment.durationDays ?? 28));
    return `Пока рано. До закрытия вклада осталось ${Math.max(0, maturityDay - saveData.gameDays)} д.`;
  }

  const payoutAmount = (investment.amount ?? 0) + (investment.expectedReturn ?? 0);
  saveData.money += payoutAmount;
  saveData.totalEarnings += investment.expectedReturn ?? 0;
  investment.totalEarned = (investment.totalEarned ?? 0) + (investment.expectedReturn ?? 0);
  investment.closedAt = saveData.gameDays;
  investment.status = "closed";

  return [
    `${investment.label ?? "Инвестиция"} закрыта.`,
    `Возвращено ${formatMoney(payoutAmount)} ₽, из них доход ${formatMoney(investment.expectedReturn ?? 0)} ₽.`,
  ].join("\n");
}

export function startEducationProgram(saveData, program) {
  saveData.money -= program.cost;
  saveData.totalSpent += program.cost;

  const activeCourse = {
    id: program.id,
    name: program.title,
    type: program.typeLabel,
    progress: 0,
    daysRequired: program.daysRequired,
    daysSpent: 0,
    costPaid: program.cost,
  };

  saveData.education.activeCourses = [activeCourse];

  return [
    `${program.title} начат.`,
    `Стоимость: ${formatMoney(program.cost)} ₽.`,
    `Понадобится ${program.daysRequired} игровых дн.`,
  ].join("\n");
}

export function advanceEducationCourseDay(saveData, courseId) {
  const course = saveData.education.activeCourses?.find((item) => item.id === courseId);
  const program = EDUCATION_PROGRAMS.find((item) => item.id === courseId);

  if (!course || !program) {
    return { completed: false, summary: "Активный курс не найден." };
  }

  advanceGameTime(saveData, 1);
  course.daysSpent += 1;
  course.progress = clamp(course.daysSpent / course.daysRequired, 0, 1);

  applyStatChanges(saveData.stats, {
    energy: -10,
    stress: 8,
    mood: -3,
  });

  if (course.daysSpent < course.daysRequired) {
    return {
      completed: false,
      summary: [
        `Учебный день завершён: ${course.name}.`,
        `Прогресс: ${Math.round(course.progress * 100)}%.`,
        "Энергия -10 • Стресс +8 • Настроение -3",
      ].join("\n"),
    };
  }

  applySkillChanges(saveData.skills, program.completionSkillChanges);
  applyStatChanges(saveData.stats, program.completionStatChanges);

  if (program.salaryMultiplierDelta) {
    saveData.currentJob.salaryPerDay = Math.round(saveData.currentJob.salaryPerDay * (1 + program.salaryMultiplierDelta));
    saveData.currentJob.salaryPerWeek = saveData.currentJob.salaryPerDay * 5;
  }

  if (program.educationLevel) {
    saveData.education.educationLevel = program.educationLevel;
    saveData.education.institute = "completed";
  }

  const careerUpdateSummary = syncCareerProgress(saveData);
  saveData.education.activeCourses = saveData.education.activeCourses.filter((item) => item.id !== courseId);

  return {
    completed: true,
    summary: [
      `${program.title} завершён.`,
      program.rewardText,
      careerUpdateSummary,
      "Последний учебный день тоже повлиял на ресурсы: Энергия -10 • Стресс +8 • Настроение -3",
    ].join("\n"),
  };
}

function buildRecoverySummary(cardData, statChanges) {
  const changes = summarizeStatChanges(statChanges);
  return [
    `${cardData.title} завершено.`,
    `Потрачено: ${formatMoney(cardData.price)} ₽ • Время: ${cardData.dayCost} д.`,
    changes || "Шкалы без заметных изменений.",
  ].join("\n");
}

function buildWorkSummary(outcome, salary, statChanges, eventChoice, careerUpdateSummary) {
  const lines = [
    `${outcome.grade}. Выплата за день: ${formatMoney(salary)} ₽.`,
    summarizeStatChanges(statChanges),
  ];

  if (eventChoice && outcome.workEvent) {
    lines.push(`Событие: ${outcome.workEvent.title} — ${eventChoice.outcome}`);
  }

  if (careerUpdateSummary) {
    lines.push(careerUpdateSummary);
  }

  return lines.filter(Boolean).join("\n");
}

function summarizeStatChanges(statChanges = {}) {
  const defs = [
    ["hunger", "Голод"],
    ["energy", "Энергия"],
    ["stress", "Стресс"],
    ["mood", "Настроение"],
    ["health", "Здоровье"],
    ["physical", "Форма"],
  ];

  return defs
    .filter(([key]) => statChanges?.[key])
    .map(([key, label]) => `${label} ${statChanges[key] > 0 ? "+" : ""}${statChanges[key]}`)
    .join(" • ");
}

function pickWorkEvent(saveData, clickCount) {
  const availableEvents = WORK_RANDOM_EVENTS.filter((event) => {
    if (typeof event.minClicks === "number" && clickCount < event.minClicks) {
      return false;
    }

    if (event.requiresSkill) {
      const [skillKey, skillValue] = Object.entries(event.requiresSkill)[0];
      if ((saveData.skills?.[skillKey] ?? 0) < skillValue) {
        return false;
      }
    }

    if (typeof event.requiresEducationRank === "number" && getEducationRank(saveData.education?.educationLevel) < event.requiresEducationRank) {
      return false;
    }

    const lastOccurrence = [...(saveData.eventHistory ?? [])]
      .reverse()
      .find((item) => item.eventId === event.id);

    if (lastOccurrence && saveData.gameDays - lastOccurrence.day < event.cooldownDays) {
      return false;
    }

    return Math.random() < event.probability;
  });

  if (availableEvents.length === 0) {
    return null;
  }

  return availableEvents[Math.floor(Math.random() * availableEvents.length)];
}

function calculateWorkDaySalary(baseSalary, multiplierDelta = 0) {
  return Math.max(0, Math.round(baseSalary * (1 + multiplierDelta)));
}

function mergeStatChanges(...chunks) {
  return chunks.reduce((accumulator, chunk) => {
    Object.entries(chunk ?? {}).forEach(([key, value]) => {
      accumulator[key] = (accumulator[key] ?? 0) + value;
    });
    return accumulator;
  }, {});
}

function applyStatChanges(stats, statChanges = {}) {
  Object.entries(statChanges ?? {}).forEach(([key, value]) => {
    stats[key] = clamp((stats[key] ?? 0) + value);
  });
}

function applySkillChanges(skills, skillChanges = {}) {
  Object.entries(skillChanges ?? {}).forEach(([key, value]) => {
    skills[key] = clamp((skills[key] ?? 0) + value, 0, 10);
  });
}

function getPassiveBonuses(saveData) {
  const comfortRatio = clamp((saveData.housing?.comfort ?? 0) / 100, 0, 1);
  const housingLevel = saveData.housing?.level ?? 1;

  return {
    foodRecoveryMultiplier: (hasFurniture(saveData, "refrigerator") ? 1.2 : 1) + comfortRatio * 0.08,
    workEnergyMultiplier: Math.max(0.78, (hasFurniture(saveData, "good_bed") ? 0.9 : 1) - comfortRatio * 0.08 - (housingLevel - 1) * 0.02),
    homeMoodBonus: (hasFurniture(saveData, "decor_light") ? 6 : 0) + Math.round(comfortRatio * 4) + (housingLevel - 1) * 2,
  };
}

function hasFurniture(saveData, furnitureId) {
  return Boolean(saveData.housing?.furniture?.some((item) => item.id === furnitureId));
}

function openInvestment(saveData, config) {
  const durationDays = config.durationDays ?? 28;
  saveData.investments.push({
    id: `${config.type}_${saveData.investments.length + 1}`,
    type: config.type,
    label: config.label,
    amount: config.amount,
    startDate: saveData.gameDays,
    durationDays,
    maturityDay: saveData.gameDays + durationDays,
    expectedReturn: config.expectedReturn ?? 0,
    totalEarned: 0,
    status: "active",
  });
}

function getInvestmentState(investment, currentDay) {
  if (investment.status === "closed") {
    return "closed";
  }

  const maturityDay = investment.maturityDay ?? ((investment.startDate ?? 0) + (investment.durationDays ?? 28));
  if (currentDay >= maturityDay) {
    return "matured";
  }

  return "active";
}

function applyMonthlyExpenseDelta(saveData, expenseDelta = {}) {
  Object.entries(expenseDelta ?? {}).forEach(([key, value]) => {
    const currentValue = saveData.finance.monthlyExpenses[key] ?? 0;
    saveData.finance.monthlyExpenses[key] = Math.max(0, currentValue + value);
  });
}

function shiftHousingLevel(saveData, delta) {
  const currentLevel = saveData.housing?.level ?? 1;
  const nextLevel = currentLevel + delta;
  const clampedLevel = Math.max(1, Math.min(HOUSING_LEVELS.length, nextLevel));
  const tier = HOUSING_LEVELS.find((item) => item.level === clampedLevel) ?? HOUSING_LEVELS[0];
  saveData.housing.level = tier.level;
  saveData.housing.name = tier.name;
  saveData.housing.comfort = Math.max(tier.baseComfort, Math.min(saveData.housing.comfort, tier.baseComfort + 18));
  saveData.finance.monthlyExpenses.housing = tier.monthlyHousingCost;
}

function applyRelationshipDelta(saveData, relationshipDelta) {
  if (!relationshipDelta) {
    return;
  }

  const firstRelationship = saveData.relationships?.[0];
  if (!firstRelationship) {
    return;
  }

  firstRelationship.level = clamp(firstRelationship.level + relationshipDelta);
  firstRelationship.lastContact = saveData.gameDays;
}

function buildWeeklyHousingBonus(saveData) {
  const comfortRatio = clamp((saveData.housing?.comfort ?? 0) / 100, 0, 1);
  const housingLevel = saveData.housing?.level ?? 1;
  const passive = getPassiveBonuses(saveData);

  return {
    energy: Math.round(2 + comfortRatio * 5 + (housingLevel - 1) * 2),
    mood: Math.round(2 + passive.homeMoodBonus * 0.4),
    stress: -Math.round(1 + comfortRatio * 3 + (housingLevel - 1)),
    health: hasFurniture(saveData, "good_bed") ? 2 : 1,
  };
}

function applyWeeklyHousingPassive(saveData, weekNumber) {
  const weeklyBonus = buildWeeklyHousingBonus(saveData);
  applyStatChanges(saveData.stats, weeklyBonus);
  saveData.housing.lastWeeklyBonus = {
    week: weekNumber,
    summary: summarizeStatChanges(weeklyBonus),
  };
}

function applyMonthlyFinanceSettlement(saveData, monthNumber) {
  const monthlyExpenses = saveData.finance?.monthlyExpenses ?? DEFAULT_SAVE.finance.monthlyExpenses;
  const monthlyTotal = Object.values(monthlyExpenses).reduce((sum, value) => sum + value, 0);
  const liquidPaid = Math.min(saveData.money, monthlyTotal);
  saveData.money -= liquidPaid;

  const remaining = monthlyTotal - liquidPaid;
  const reservePaid = Math.min(saveData.finance.reserveFund ?? 0, remaining);
  saveData.finance.reserveFund = Math.max(0, (saveData.finance.reserveFund ?? 0) - reservePaid);

  const shortage = Math.max(0, remaining - reservePaid);
  saveData.totalSpent += monthlyTotal - shortage;

  if (shortage > 0) {
    applyStatChanges(saveData.stats, {
      stress: Math.min(18, 8 + Math.round(shortage / 10000)),
      mood: -Math.min(16, 6 + Math.round(shortage / 12000)),
      health: -Math.min(10, 3 + Math.round(shortage / 18000)),
    });
  } else if (reservePaid > 0) {
    applyStatChanges(saveData.stats, {
      stress: -3,
      mood: 2,
    });
  }

  saveData.finance.lastMonthlySettlement = {
    month: monthNumber,
    totalCharged: monthlyTotal,
    liquidPaid,
    reservePaid,
    shortage,
    liquidAfter: saveData.money,
    reserveAfter: saveData.finance.reserveFund,
  };

  if (shortage > 0) {
    const cashGapEvent = clone(FINANCE_EMERGENCY_EVENTS.find((item) => item.id === "finance_cash_gap"));
    queuePendingEvent(saveData, {
      ...cashGapEvent,
      instanceId: `${cashGapEvent.id}_${monthNumber}`,
    });
  } else if ((saveData.finance.reserveFund ?? 0) < monthlyTotal * 0.35) {
    const reserveWarningEvent = clone(FINANCE_EMERGENCY_EVENTS.find((item) => item.id === "finance_reserve_warning"));
    queuePendingEvent(saveData, {
      ...reserveWarningEvent,
      instanceId: `${reserveWarningEvent.id}_${monthNumber}`,
    });
  }
}

function advanceGameTime(saveData, days = 1) {
  const previousWeek = saveData.gameWeeks;
  const previousMonth = saveData.gameMonths;
  const previousAge = saveData.currentAge;

  saveData.gameDays += days;
  saveData.gameWeeks = Math.max(1, Math.floor(saveData.gameDays / 7));
  saveData.gameMonths = Math.max(1, Math.floor(saveData.gameDays / 30));
  saveData.gameYears = Number((saveData.gameDays / 360).toFixed(1));
  saveData.currentAge = saveData.startAge + Math.floor(saveData.gameDays / 360);

  if (saveData.gameWeeks > previousWeek) {
    for (let week = previousWeek + 1; week <= saveData.gameWeeks; week += 1) {
      applyWeeklyHousingPassive(saveData, week);
    }
  }

  if (saveData.gameMonths > previousMonth) {
    for (let month = previousMonth + 1; month <= saveData.gameMonths; month += 1) {
      applyMonthlyFinanceSettlement(saveData, month);
    }
  }

  enqueueProgressEvents(saveData, previousWeek, previousAge);
}

function enqueueProgressEvents(saveData, previousWeek, previousAge) {
  if (saveData.gameWeeks > previousWeek) {
    const weeklyPool = GLOBAL_PROGRESS_EVENTS.filter((event) => event.type === "weekly");
    const weeklyEvent = weeklyPool[Math.floor(Math.random() * weeklyPool.length)];
    queuePendingEvent(saveData, {
      ...clone(weeklyEvent),
      instanceId: `${weeklyEvent.id}_${saveData.gameWeeks}`,
    });
  }

  GLOBAL_PROGRESS_EVENTS
    .filter((event) => event.type === "age" && event.triggerAge > previousAge && event.triggerAge <= saveData.currentAge)
    .forEach((event) => {
      queuePendingEvent(saveData, {
        ...clone(event),
        instanceId: `${event.id}_${event.triggerAge}`,
      });
    });
}

function queuePendingEvent(saveData, queuedEvent) {
  const alreadyHandled = saveData.eventHistory?.some((item) => item.eventId === queuedEvent.instanceId);
  const alreadyQueued = saveData.pendingEvents?.some((item) => item.instanceId === queuedEvent.instanceId);

  if (alreadyHandled || alreadyQueued) {
    return;
  }

  saveData.pendingEvents.push(queuedEvent);
}

function recordEvent(saveData, eventId, title) {
  saveData.eventHistory.push({
    eventId,
    day: saveData.gameDays,
    title,
  });
  saveData.lifetimeStats.totalEvents = (saveData.lifetimeStats.totalEvents ?? 0) + 1;
}

function syncCareerProgress(saveData) {
  const professionalism = saveData.skills?.professionalism ?? 0;
  const educationRank = getEducationRank(saveData.education?.educationLevel);
  const currentLevel = saveData.currentJob?.level ?? 1;

  const unlockedJob = CAREER_JOBS
    .filter((job) => professionalism >= job.minProfessionalism && educationRank >= job.minEducationRank)
    .at(-1);

  if (!unlockedJob || unlockedJob.level <= currentLevel) {
    return "";
  }

  saveData.currentJob = {
    ...saveData.currentJob,
    ...unlockedJob,
    daysAtWork: saveData.currentJob.daysAtWork ?? 0,
  };

  return `Карьерный рост: новая должность «${unlockedJob.name}», ставка ${formatMoney(unlockedJob.salaryPerDay)} ₽ в день.`;
}

function getEducationRank(level) {
  const map = {
    "Среднее": 0,
    "Высшее": 1,
    MBA: 2,
  };

  return map[level] ?? 0;
}

function getEducationLabelByRank(rank) {
  const map = {
    0: "Среднее",
    1: "Высшее",
    2: "MBA",
  };

  return map[rank] ?? "Среднее";
}
