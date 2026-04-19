/**
 * Единый источник истины для возрастных правил и ограничений.
 * Используется useAgeRestrictions и age-unlocks.
 */
import { AgeGroup } from '@/domain/balance/actions/types'

export { AgeGroup }

export interface AgeRestrictions {
  hiddenTabs: string[]
  hiddenStats: string[]
  label: string
  timeSpeed: number
  minAgeGroup: AgeGroup
}

/** Правила для каждой возрастной группы */
export const AGE_RULES: Record<AgeGroup, AgeRestrictions> = {
  [AgeGroup.INFANT]: {
    hiddenTabs: ['finance', 'career', 'home', 'car', 'actions', 'shop', 'education'],
    hiddenStats: ['money', 'salary', 'debt', 'investments'],
    label: 'Младенец',
    timeSpeed: 4,
    minAgeGroup: AgeGroup.INFANT,
  },
  [AgeGroup.TODDLER]: {
    hiddenTabs: ['finance', 'career', 'home', 'car', 'shop', 'education'],
    hiddenStats: ['money', 'salary', 'debt', 'investments'],
    label: 'Дошкольник',
    timeSpeed: 3,
    minAgeGroup: AgeGroup.TODDLER,
  },
  [AgeGroup.CHILD]: {
    hiddenTabs: ['finance', 'home', 'car'],
    hiddenStats: ['money', 'salary', 'debt'],
    label: 'Младший школьник',
    timeSpeed: 2,
    minAgeGroup: AgeGroup.CHILD,
  },
  [AgeGroup.KID]: {
    hiddenTabs: ['finance', 'home', 'car'],
    hiddenStats: ['money', 'salary', 'debt'],
    label: 'Школьник',
    timeSpeed: 1.75,
    minAgeGroup: AgeGroup.KID,
  },
  [AgeGroup.TEEN]: {
    hiddenTabs: ['home', 'mortgage'],
    hiddenStats: ['debt', 'investments'],
    label: 'Подросток',
    timeSpeed: 1.5,
    minAgeGroup: AgeGroup.TEEN,
  },
  [AgeGroup.YOUNG]: {
    hiddenTabs: ['mortgage'],
    hiddenStats: [],
    label: 'Молодёжь',
    timeSpeed: 1.25,
    minAgeGroup: AgeGroup.YOUNG,
  },
  [AgeGroup.ADULT]: {
    hiddenTabs: [],
    hiddenStats: [],
    label: 'Взрослый',
    timeSpeed: 1,
    minAgeGroup: AgeGroup.ADULT,
  },
}

/** Возраст, с которого вкладка становится доступна */
export const TAB_UNLOCK_AGE: Record<string, number> = {
  actions: 4,
  shop: 4,
  education: 8,  // CHILD (осознанное школьное обучение)
  career: 13,    // TEEN (было 8 — пустая страница для CHILD 8-12)
  car: 16,
  finance: 16,
  home: 16,
  mortgage: 19,
}

/** Сообщения при разблокировке вкладок */
export const UNLOCK_MESSAGES: Record<string, string> = {
  education: '📚 Теперь вам доступно Обучение! Вы можете изучать новые навыки и проходить курсы.',
  finance: '🎉 Теперь вам доступны Финансы! Вы можете управлять своими деньгами, открывать счета и делать инвестиции.',
  career: '💼 Теперь вам доступна Работа! Вы можете искать вакансии и устраиваться на работу.',
  home: '🏠 Теперь вам доступна Недвижимость! Вы можете покупать и арендовать жильё.',
  car: '🚗 Теперь вам доступна Машина! Вы можете покупать и обслуживать автомобиль.',
  actions: '🎭 Теперь вам доступны Действия! Вы можете развлекаться, заниматься хобби, заботиться о здоровье и общаться.',
  mortgage: '🏦 Теперь вам доступна Ипотека! Вы можете брать кредиты на покупку недвижимости.',
  shop: '🛒 Теперь вам доступен Магазин! Вы можете покупать товары и услуги.',
}

/** Диапазоны возрастов для каждой группы (единый источник) */
export const AGE_GROUP_RANGES: Record<AgeGroup, { min: number; max: number }> = {
  [AgeGroup.INFANT]:  { min: 0, max: 3 },
  [AgeGroup.TODDLER]: { min: 4, max: 7 },
  [AgeGroup.CHILD]:   { min: 8, max: 12 },
  [AgeGroup.KID]:     { min: 8, max: 12 },  // legacy — совпадает с CHILD
  [AgeGroup.TEEN]:    { min: 13, max: 15 },
  [AgeGroup.YOUNG]:   { min: 16, max: 18 },
  [AgeGroup.ADULT]:   { min: 19, max: 100 },
}

/**
 * Определить возрастную группу по точному возрасту.
 */
export function getAgeGroup(ageValue: number): AgeGroup {
  if (ageValue <= 3) return AgeGroup.INFANT
  if (ageValue <= 7) return AgeGroup.TODDLER
  if (ageValue <= 12) return AgeGroup.CHILD
  if (ageValue <= 15) return AgeGroup.TEEN
  if (ageValue <= 18) return AgeGroup.YOUNG
  return AgeGroup.ADULT
}
