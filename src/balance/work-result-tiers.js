/** Уровни результата мини-игры рабочей смены (клики за 10 с). */
export const WORK_RESULT_TIERS = [
  {
    minClicks: 58,
    grade: 'Отличная смена',
    description: 'Высокий темп работы. День прошёл эффективно и без заметных потерь по качеству.',
    color: '#4EBF7A',
    salaryMultiplier: 0.18,
    statChanges: { hunger: -16, energy: -18, stress: 8, mood: 6 },
  },
  {
    minClicks: 40,
    grade: 'Стабильный результат',
    description: 'Нормальная продуктивность без перегрузки. Это надёжный базовый итог рабочей фазы.',
    color: '#6D9DC5',
    salaryMultiplier: 0,
    statChanges: { hunger: -18, energy: -24, stress: 12, mood: -2 },
  },
  {
    minClicks: 24,
    grade: 'Тяжёлая смена',
    description: 'Ритм просел. День закрыт, но с потерей темпа и более заметной усталостью.',
    color: '#E8B94A',
    salaryMultiplier: -0.12,
    statChanges: { hunger: -22, energy: -30, stress: 18, mood: -8, health: -3 },
  },
  {
    minClicks: 0,
    grade: 'Провальный темп',
    description: 'Смена прошла тяжело: ошибок больше, ресурсов меньше, а настроение проседает.',
    color: '#D14D4D',
    salaryMultiplier: -0.25,
    statChanges: { hunger: -26, energy: -36, stress: 24, mood: -14, health: -6 },
  },
];
