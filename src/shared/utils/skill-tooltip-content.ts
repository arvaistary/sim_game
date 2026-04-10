import type { SkillDef } from '@/domain/balance/types'

const EFFECT_LABELS: Record<string, string> = {
  energyDrainMultiplier: 'Расход энергии',
  stressGainMultiplier: 'Рост стресса',
  workEfficiencyMultiplier: 'Эффективность работы',
  learningSpeedMultiplier: 'Скорость обучения',
  positiveEventChance: 'Шанс позитивных событий',
  positiveEventChanceBonus: 'Шанс позитивных событий',
  relationshipGainMultiplier: 'Рост отношений',
  salaryMultiplier: 'Зарплата',
  shopPriceMultiplier: 'Цены в магазине',
  investmentReturnMultiplier: 'Доходность инвестиций',
  passiveIncomeBonus: 'Пассивный доход',
  hungerDrainMultiplier: 'Расход сытости',
  healthDecayMultiplier: 'Ухудшение здоровья',
  recoveryEfficiency: 'Эффективность восстановления',
  negativeEventPenaltyReduction: 'Снижение штрафов от негатива',
  jobChangeCostReduction: 'Стоимость смены работы',
  workPeriodBonusChance: 'Шанс бонуса на работе',
  maxEnergyBonus: 'Максимум энергии',
  stressResistanceFromWork: 'Стресс от работы',
  moodRecoveryMultiplier: 'Восстановление настроения',
  negativeEventMitigation: 'Сила негативных событий',
  homeComfortMultiplier: 'Комфорт дома',
  dailyExpenseMultiplier: 'Повседневные расходы',
  hobbyIncomeMultiplier: 'Доход от хобби',
  stressEventImmunity: 'Иммунитет к стрессовым событиям',
  lowMoodPenaltyReduction: 'Штрафы от низкого настроения',
  autoRecoveryWeekly: 'Автовосстановление в неделю',
  randomSkillGainChance: 'Шанс случайного роста навыка',
  relationshipQualityMultiplier: 'Качество отношений',
  friendHelpChance: 'Помощь друзей',
  educationDecayReduction: 'Потеря прогресса обучения',
  relearningBonus: 'Бонус повторного обучения',
  promotionChance: 'Шанс повышения',
  teamEventBonus: 'Бонус командных событий',
  jobSalaryOnHire: 'Стартовая зарплата',
  investmentRiskReduction: 'Риск инвестиций',
  jobSpecificSalaryBonus: 'Зарплата по специализации',
  stressGainFromWork: 'Стресс от работы',
  overtimeImmunity: 'Иммунитет к переработкам',
  learningTechSpeed: 'Скорость техобучения',
  homeTechBonus: 'Бонус от техники дома',
  foodRecoveryMultiplier: 'Восстановление от еды',
  taxReduction: 'Снижение налогов',
  subordinateEfficiency: 'Эффективность сотрудников',
  salesSuccess: 'Успешность продаж',
  overallEfficiency: 'Общая эффективность',
  legalPenaltyReduction: 'Юридические штрафы',
  healthRecoveryMultiplier: 'Восстановление здоровья',
  agingSpeedMultiplier: 'Скорость старения',
  routinePenaltyReduction: 'Штрафы от рутины',
  allRecoveryMultiplier: 'Общее восстановление',
  negativeEventChance: 'Частота негативных событий',
  missedActionPenalty: 'Штрафы за пропуски',
  agingPenaltyReduction: 'Возрастные штрафы',
  giftQualityBonus: 'Качество подарков',
  eventChoiceHint: 'Подсказки в событиях',
  agePenaltyAfter50: 'Штрафы после 50 лет',
  lifeExpectancyBonus: 'Ожидаемая продолжительность жизни',
  socialEventBonus: 'Социальные события',
  healthBonus: 'Бонус к здоровью',
  repairCostReduction: 'Стоимость ремонта',
  energyRecoveryFromActivity: 'Восстановление энергии',
  publicEventSuccess: 'Успех публичных выступлений',
  furnitureComfortBonus: 'Комфорт от мебели',
  homeFoodRecovery: 'Домашняя еда',
}

function humanizeKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (char) => char.toUpperCase())
}

function formatPercent(delta: number): string {
  return `${delta > 0 ? '+' : ''}${Math.round(delta * 100)}%`
}

function formatEffectValue(key: string, value: number | ((...args: unknown[]) => unknown)): string {
  if (typeof value !== 'number') {
    return String(value)
  }

  if (key.includes('Multiplier')) {
    return formatPercent(value - 1)
  }

  if (
    key.includes('Chance') ||
    key.includes('Reduction') ||
    key.includes('Penalty') ||
    key.includes('Bonus') ||
    key.includes('Immunity')
  ) {
    if (Math.abs(value) <= 1) {
      return formatPercent(value)
    }
    return `${value > 0 ? '+' : ''}${Math.round(value)}`
  }

  if (Math.abs(value) < 1) {
    return formatPercent(value)
  }

  return `${value > 0 ? '+' : ''}${Math.round(value)}`
}

function formatEffectLine([key, effect]: [string, ((level: number) => number) | unknown], maxLevel: number): string {
  const label = EFFECT_LABELS[key] || humanizeKey(key)
  const value = typeof effect === 'function' ? (effect as (level: number) => number)(maxLevel) : effect
  return `• ${label}: ${formatEffectValue(key, value as number)}`
}

export function buildSkillTooltipText(skill: SkillDef | null | undefined): string {
  if (!skill) return ''

  const maxLevel = skill.maxLevel ?? 10
  const effectLines = Object.entries(skill.effects || {}).map((entry) => formatEffectLine(entry as [string, (level: number) => number], maxLevel))
  const milestoneLines = Object.entries(skill.milestones || {}).map(
    ([level, milestone]) => `• ${level} ур.: ${(milestone as { description: string }).description}`,
  )

  return [
    skill.label,
    skill.description,
    effectLines.length ? '' : null,
    effectLines.length ? 'Что даёт:' : null,
    ...effectLines,
    milestoneLines.length ? '' : null,
    milestoneLines.length ? 'Пороговые бонусы:' : null,
    ...milestoneLines,
  ].filter(Boolean).join('\n')
}
