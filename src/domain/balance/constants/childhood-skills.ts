import type { ChildhoodSkillDef } from '../types/childhood-skill'

/**
 * 27 детских навыков, каждый прокачивается только в определённом возрасте.
 *
 * Критически важная механика: если навык не прокачан до определённого возраста —
 * его никогда нельзя будет прокачать до максимума.
 * Можно довести до 70%, но никогда не до 100%.
 */
export const CHILDHOOD_SKILLS: ChildhoodSkillDef[] = [
  // === Раннее развитие (0-7 лет) ===
  {
    key: 'trustInPeople',
    label: 'Доверие к людям',
    bestAgeStart: 0,
    bestAgeEnd: 7,
    maxPotential: 1.0,
    adultBenefit: 'По умолчанию веришь или не веришь людям',
  },
  {
    key: 'capacityToLove',
    label: 'Способность любить',
    bestAgeStart: 0,
    bestAgeEnd: 5,
    maxPotential: 1.0,
    adultBenefit: 'Максимальная глубина близких отношений',
  },
  {
    key: 'languageAptitude',
    label: 'Языковые способности',
    bestAgeStart: 2,
    bestAgeEnd: 10,
    maxPotential: 1.0,
    adultBenefit: 'Любой иностранный язык изучается в 3 раза быстрее',
  },
  {
    key: 'musicalEar',
    label: 'Музыкальный слух',
    bestAgeStart: 3,
    bestAgeEnd: 7,
    maxPotential: 1.0,
    adultBenefit: 'Можно развить любой музыкальный навык',
  },
  {
    key: 'empathy',
    label: 'Эмпатия',
    bestAgeStart: 3,
    bestAgeEnd: 9,
    maxPotential: 1.0,
    adultBenefit: 'Все отношения развиваются на 50% быстрее',
  },

  // === Дошкольное развитие (4-8 лет) ===
  {
    key: 'curiosity',
    label: 'Любопытство',
    bestAgeStart: 4,
    bestAgeEnd: 8,
    maxPotential: 1.0,
    adultBenefit: 'Все навыки прокачиваются на 20% быстрее',
  },
  {
    key: 'honesty',
    label: 'Честность',
    bestAgeStart: 4,
    bestAgeEnd: 10,
    maxPotential: 1.0,
    adultBenefit: 'Твоей лжи всегда верят если ты редко лжёшь',
  },
  {
    key: 'creativity',
    label: 'Креативность',
    bestAgeStart: 5,
    bestAgeEnd: 12,
    maxPotential: 1.0,
    adultBenefit: 'Можно придумывать уникальные решения',
  },
  {
    key: 'attention',
    label: 'Внимательность',
    bestAgeStart: 5,
    bestAgeEnd: 11,
    maxPotential: 1.0,
    adultBenefit: 'Видишь скрытые варианты выбора',
  },
  {
    key: 'learningAbility',
    label: 'Способность к обучению',
    bestAgeStart: 5,
    bestAgeEnd: 14,
    maxPotential: 1.0,
    adultBenefit: 'Базовый множитель опыта на всю жизнь',
  },

  // === Младшая школа (6-12 лет) ===
  {
    key: 'smartness',
    label: 'Сообразительность',
    bestAgeStart: 6,
    bestAgeEnd: 11,
    maxPotential: 1.0,
    adultBenefit: '+3 ко всем проверкам интеллекта',
  },
  {
    key: 'agility',
    label: 'Ловкость',
    bestAgeStart: 6,
    bestAgeEnd: 14,
    maxPotential: 1.0,
    adultBenefit: 'Все физические проверки +2',
  },
  {
    key: 'forgiveness',
    label: 'Способность прощать',
    bestAgeStart: 6,
    bestAgeEnd: 12,
    maxPotential: 1.0,
    adultBenefit: 'Никогда не получаешь отрицательных модификаторов от старых обид',
  },
  {
    key: 'confidence',
    label: 'Уверенность в себе',
    bestAgeStart: 7,
    bestAgeEnd: 14,
    maxPotential: 1.0,
    adultBenefit: 'Никогда не получаешь дебафф от отказа',
  },
  {
    key: 'spatialThinking',
    label: 'Пространственное мышление',
    bestAgeStart: 7,
    bestAgeEnd: 13,
    maxPotential: 1.0,
    adultBenefit: 'Отлично ориентируешься, хорошо в математике',
  },
  {
    key: 'memory',
    label: 'Память',
    bestAgeStart: 7,
    bestAgeEnd: 13,
    maxPotential: 1.0,
    adultBenefit: 'Запоминаешь абсолютно все разговоры',
  },
  {
    key: 'selfControl',
    label: 'Самоконтроль',
    bestAgeStart: 8,
    bestAgeEnd: 16,
    maxPotential: 1.0,
    adultBenefit: 'Никогда не делаешь импульсивные выборы',
  },
  {
    key: 'logic',
    label: 'Логика',
    bestAgeStart: 9,
    bestAgeEnd: 15,
    maxPotential: 1.0,
    adultBenefit: 'Все математические проверки с преимуществом',
  },
  {
    key: 'humor',
    label: 'Чувство юмора',
    bestAgeStart: 8,
    bestAgeEnd: 15,
    maxPotential: 1.0,
    adultBenefit: 'Можно разрядить любую ситуацию',
  },

  // === Средняя и старшая школа (10-18 лет) ===
  {
    key: 'endurance',
    label: 'Выносливость',
    bestAgeStart: 10,
    bestAgeEnd: 17,
    maxPotential: 1.0,
    adultBenefit: 'Никогда не устаёшь раньше других',
  },
  {
    key: 'persistence',
    label: 'Упорство',
    bestAgeStart: 10,
    bestAgeEnd: 17,
    maxPotential: 1.0,
    adultBenefit: 'Можно перепробовать любую проверку 3 раза',
  },
  {
    key: 'selfEsteem',
    label: 'Самооценка',
    bestAgeStart: 10,
    bestAgeEnd: 18,
    maxPotential: 1.0,
    adultBenefit: 'Базовый уровень счастья на всю жизнь',
  },
  {
    key: 'responsibility',
    label: 'Ответственность',
    bestAgeStart: 11,
    bestAgeEnd: 18,
    maxPotential: 1.0,
    adultBenefit: 'Доверяют тебе важные вещи',
  },
  {
    key: 'grudge',
    label: 'Злопамятность',
    bestAgeStart: 12,
    bestAgeEnd: 16,
    maxPotential: 1.0,
    adultBenefit: 'Запоминаешь всех кто тебя предал',
  },
  {
    key: 'charisma',
    label: 'Харизма',
    bestAgeStart: 12,
    bestAgeEnd: 16,
    maxPotential: 1.0,
    adultBenefit: 'Люди изначально относятся к тебе хорошо',
  },
  {
    key: 'riskTolerance',
    label: 'Склонность к риску',
    bestAgeStart: 13,
    bestAgeEnd: 17,
    maxPotential: 1.0,
    adultBenefit: 'Все опасные варианты имеют удвоенную награду',
  },
  {
    key: 'physicalStrength',
    label: 'Физическая сила',
    bestAgeStart: 14,
    bestAgeEnd: 18,
    maxPotential: 1.0,
    adultBenefit: 'Базовый показатель силы на всю жизнь',
  },
]

/**
 * Множество ключей детских навыков для быстрой проверки
 */
export const CHILDHOOD_SKILL_KEYS = new Set(CHILDHOOD_SKILLS.map(s => s.key))

/**
 * Map ключ → определение детского навыка
 */
export const CHILDHOOD_SKILL_BY_KEY = new Map(CHILDHOOD_SKILLS.map(s => [s.key, s]))

/**
 * Проверить является ли навык детским
 */
export function isChildhoodSkill(key: string): boolean {
  return CHILDHOOD_SKILL_KEYS.has(key)
}

/**
 * Получить определение детского навыка по ключу
 */
export function getChildhoodSkill(key: string): ChildhoodSkillDef | undefined {
  return CHILDHOOD_SKILL_BY_KEY.get(key)
}
