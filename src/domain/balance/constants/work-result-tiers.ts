import type { WorkResultTier } from '@/domain/balance/types'

export const WORK_RESULT_TIERS: WorkResultTier[] = [
  {
    minClicks: 58,
    grade: 'Отличная смена',
    description: 'Высокий темп, отличная концентрация и минимум ошибок. День прошёл максимально продуктивно.',
    color: '#4EBF7A',
    salaryMultiplier: 0.18,
    statChanges: { hunger: 14.5, energy: -19.5, stress: 6.5, mood: 9.5, health: 1.2, physical: -2.5 },
  },
  {
    minClicks: 40,
    grade: 'Стабильный результат',
    description: 'Ровная, уверенная работа без сильных провалов и перегрузок. Хороший, надёжный день.',
    color: '#6D9DC5',
    salaryMultiplier: 0,
    statChanges: { hunger: 16.5, energy: -23.5, stress: 9.5, mood: 3.5, health: -0.8, physical: -3.2 },
  },
  {
    minClicks: 24,
    grade: 'Тяжёлая смена',
    description: 'Темп заметно просел, было много усталости и мелких ошибок. День закрыт, но дался нелегко.',
    color: '#E8B94A',
    salaryMultiplier: -0.12,
    statChanges: { hunger: 19.5, energy: -29.5, stress: 15.5, mood: -7.5, health: -3.5, physical: -4.8 },
  },
  {
    minClicks: 0,
    grade: 'Провальный темп',
    description: 'Смена прошла тяжело: низкая концентрация, много ошибок, сильная усталость и раздражение.',
    color: '#D14D4D',
    salaryMultiplier: -0.25,
    statChanges: { hunger: 23.5, energy: -37.5, stress: 22.5, mood: -14.5, health: -7.5, physical: -6.5 },
  },
]