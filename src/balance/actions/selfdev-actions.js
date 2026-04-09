/**
 * Баланс: Действия саморазвития
 *
 * Категория: selfdev
 * ActionType: 'selfdev' — для всех действий
 */

export const SELFDEV_ACTIONS = [
  // ─── Саморазвитие ─────────────────────────────────────────
  {
    id: 'self_morning_routine',
    category: 'selfdev',
    title: 'Утренняя рутина — зарядка + планирование',
    hourCost: 1,
    price: 0,
    statChanges: { energy: 5 },
    skillChanges: { discipline: 1, organization: 1 },
    actionType: 'selfdev',
    effect: 'Энергия +5, Дисциплина +1, Организованность +1',
  },
  {
    id: 'self_evening_routine',
    category: 'selfdev',
    title: 'Вечерняя рутина — рефлексия + подготовка',
    hourCost: 1,
    price: 0,
    statChanges: { stress: -8 },
    skillChanges: { wisdom: 1, emotionalIntelligence: 1 },
    actionType: 'selfdev',
    effect: 'Стресс -8, Мудрость +1, Эмоциональный интеллект +1',
  },
  {
    id: 'self_digital_detox',
    category: 'selfdev',
    title: 'Цифровой детокс — день без гаджетов',
    hourCost: 8,
    price: 0,
    statChanges: { stress: -18, mood: 10 },
    skillChanges: { patience: 1 },
    actionType: 'selfdev',
    effect: 'Стресс -18, Настроение +10, Терпение +1',
  },
  {
    id: 'self_gratitude',
    category: 'selfdev',
    title: 'Практика благодарности',
    hourCost: 0.5,
    price: 0,
    statChanges: { mood: 8 },
    skillChanges: { optimism: 1 },
    actionType: 'selfdev',
    effect: 'Настроение +8, Оптимизм +1',
  },
  {
    id: 'self_personality_test',
    category: 'selfdev',
    title: 'Пройти личностный тест',
    hourCost: 1.5,
    price: 500,
    statChanges: {},
    skillChanges: { intuition: 1 },
    actionType: 'selfdev',
    effect: 'Самопознание, Интуиция +1',
    oneTime: true,
  },
  {
    id: 'self_coaching',
    category: 'selfdev',
    title: 'Личное коучинг-занятие',
    hourCost: 2,
    price: 4000,
    statChanges: { stress: -8 },
    skillChanges: { discipline: 2 },
    actionType: 'selfdev',
    effect: 'Дисциплина +2, Мотивация +, Стресс -8',
  },
];
