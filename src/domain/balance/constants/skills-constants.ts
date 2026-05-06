import type { SkillDef } from '@domain/balance/types'
import type { SkillTab } from '@domain/balance/types'
import type { SkillCategory } from '@domain/balance/types'
export const SKILLS_TABS: SkillTab[] = [
  { id: 'basic', label: 'Базовые' },
  { id: 'professional', label: 'Профессиональные' },
  { id: 'social', label: 'Социальные' },
  { id: 'creative', label: 'Творческие' },
  { id: 'negative', label: 'Слабости' },
]

export const BASIC_SKILLS: SkillDef[] = [
  {
    key: 'resilience',
    label: 'Жизнестойкость',
    description: 'Способность быстро восстанавливаться после неудач',
    category: 'basic',
    color: 0x7ED9A0,
    maxLevel: 10,
    effects: {
      negativeEventMitigation: (lvl) => 1 - (lvl * 0.03),
      moodRecoveryMultiplier: (lvl) => 1 + (lvl * 0.04),
    },
    milestones: {
      10: { description: 'Почти не ломаешься от неудач' },
    },
  },
  {
    key: 'focus',
    label: 'Концентрация',
    description: 'Умение глубоко погружаться в задачу',
    category: 'basic',
    color: 0x6D9DC5,
    maxLevel: 10,
    effects: {
      workEfficiency: (lvl) => 1 + (lvl * 0.025),
      learningSpeedMultiplier: (lvl) => 1 + (lvl * 0.035),
    },
    milestones: {
      8: { description: 'Меньше отвлекаешься во время работы' },
    },
  },
  {
    key: 'timeManagement',
    label: 'Тайм-менеджмент',
    description: 'Умение планировать и распределять время',
    category: 'basic',
    color: 0x6D9DC5,
    maxLevel: 10,
    effects: {
      energyDrainMultiplier: (lvl) => 1 - (lvl * 0.025),
      stressGainMultiplier: (lvl) => 1 - (lvl * 0.02),
      workEfficiency: (lvl) => 1 + (lvl * 0.015),
      learningSpeedMultiplier: (lvl) => 1 + (lvl * 0.03),
    },
    milestones: {
      6: { description: '+1 возможный ход в неделю' },
      10: { description: 'Максимальная эффективность времени' },
    },
  },
  {
    key: 'communication',
    label: 'Коммуникация',
    description: 'Способность общаться и договариваться',
    category: 'basic',
    color: 0xE8B4A0,
    maxLevel: 10,
    effects: {
      positiveEventChance: (lvl) => 0.08 + (lvl * 0.012),
      relationshipGainMultiplier: (lvl) => 1 + (lvl * 0.04),
      salaryMultiplier: (lvl) => 1 + (lvl * 0.015),
    },
    milestones: {
      10: { description: '+15% ЗП при переговорах' },
    },
  },
  {
    key: 'financialLiteracy',
    label: 'Финансовая грамотность',
    description: 'Понимание основ управления деньгами',
    category: 'basic',
    color: 0xA8CABA,
    maxLevel: 10,
    effects: {
      shopPriceMultiplier: (lvl) => 1 - (lvl * 0.018),
      investmentReturnMultiplier: (lvl) => 1 + (lvl * 0.035),
      passiveIncomeBonus: (lvl) => lvl * 50,
    },
    milestones: {
      6: { description: '+500 руб пассивного дохода в месяц' },
    },
  },
  {
    key: 'healthyLifestyle',
    label: 'Здоровый образ жизни',
    description: 'Привычки, поддерживающие здоровье',
    category: 'basic',
    color: 0x7ED9A0,
    maxLevel: 10,
    effects: {
      hungerDrainMultiplier: (lvl) => 1 - (lvl * 0.022),
      healthDecayMultiplier: (lvl) => 1 - (lvl * 0.03),
      recoveryEfficiency: (lvl) => 1 + (lvl * 0.025),
    },
    milestones: {
      10: { description: '+25% эффективность восстановления' },
    },
  },
  {
    key: 'adaptability',
    label: 'Адаптивность',
    description: 'Способность быстро адаптироваться к изменениям',
    category: 'basic',
    color: 0xF4D95F,
    maxLevel: 10,
    effects: {
      negativeEventPenaltyReduction: (lvl) => lvl * 0.04,
      jobChangeCostReduction: (lvl) => 1 - (lvl * 0.033),
    },
    milestones: {
      6: { description: '-20% стоимость смены работы' },
    },
  },
  {
    key: 'discipline',
    label: 'Дисциплина',
    description: 'Способность следовать плану и правилам',
    category: 'basic',
    color: 0x9E9E9E,
    maxLevel: 10,
    effects: {
      learningSpeedMultiplier: (lvl) => 1 + (lvl * 0.025),
      workPeriodBonusChance: (lvl) => lvl * 0.015,
    },
    milestones: {
      10: { description: 'Можно пропускать 1 ход в неделю без штрафа' },
    },
  },
  {
    key: 'physicalFitness',
    label: 'Физическая форма',
    description: 'Общая физическая подготовка',
    category: 'basic',
    color: 0x7ED9A0,
    maxLevel: 10,
    effects: {
      maxEnergyBonus: (lvl) => lvl * 4,
      stressResistanceFromWork: (lvl) => 1 - (lvl * 0.018),
    },
    milestones: {
      6: { description: '-18% стресса от работы' },
    },
  },
  {
    key: 'emotionalIntelligence',
    label: 'Эмоциональный интеллект',
    description: 'Понимание собственных и чужих эмоций',
    category: 'basic',
    color: 0xE87D7D,
    maxLevel: 10,
    effects: {
      moodRecoveryMultiplier: (lvl) => 1 + (lvl * 0.045),
      negativeEventMitigation: (lvl) => 1 - (lvl * 0.025),
    },
    milestones: {
      10: { description: '-25% влияние негативных событий' },
    },
  },
  {
    key: 'meditation',
    label: 'Медитация',
    description: 'Практика осознанности и ментального покоя',
    category: 'basic',
    color: 0x9E9E9E,
    maxLevel: 10,
    effects: {
      stressGainMultiplier: (lvl) => 1 - (lvl * 0.04),
      moodRecoveryMultiplier: (lvl) => 1 + (lvl * 0.06),
    },
    milestones: {
      1: { description: 'Можете практиковать медитацию' },
      2: { description: 'Медитация сбрасывает когнитивную нагрузку (как короткий сон)' },
      5: { description: 'Медитация сбрасывает когнитивную нагрузку (как нормальный сон)' },
      10: { description: 'Мастер осознанности — полное ментальное восстановление' },
    },
  },
  {
    key: 'organization',
    label: 'Организованность',
    description: 'Умение поддерживать порядок в делах',
    category: 'basic',
    color: 0x6D9DC5,
    maxLevel: 10,
    effects: {
      homeComfortMultiplier: (lvl) => 1 + (lvl * 0.025),
      dailyExpenseMultiplier: (lvl) => 1 - (lvl * 0.015),
    },
    milestones: {
      6: { description: '+10% комфорта дома' },
    },
  },
  {
    key: 'basicCreativity',
    label: 'Базовая креативность',
    description: 'Способность мыслить нестандартно',
    category: 'basic',
    color: 0xF4D95F,
    maxLevel: 10,
    effects: {
      hobbyIncomeMultiplier: (lvl) => 1 + (lvl * 0.04),
      positiveEventChance: (lvl) => lvl * 0.01,
    },
    milestones: {
      10: { description: '+10% шанс редких позитивных событий' },
    },
  },
  {
    key: 'stressResistance',
    label: 'Стрессоустойчивость',
    description: 'Способность противостоять стрессу',
    category: 'basic',
    color: 0xE87D7D,
    maxLevel: 10,
    effects: {
      stressGainMultiplier: (lvl) => 1 - (lvl * 0.035),
      stressEventImmunity: (lvl) => lvl >= 6 ? 0.5 : 0,
    },
    milestones: {
      6: { description: 'Иммунитет к лёгким стрессовым событиям' },
    },
  },
  {
    key: 'selfControl',
    label: 'Самоконтроль',
    description: 'Контроль над эмоциями и действиями',
    category: 'basic',
    color: 0x9E9E9E,
    maxLevel: 10,
    effects: {
      lowMoodPenaltyReduction: (lvl) => 1 - (lvl * 0.02),
      autoRecoveryWeekly: (lvl) => lvl >= 10 ? 5 : 0,
    },
    milestones: {
      10: { description: 'Автоматическое небольшое восстановление шкал раз в неделю' },
    },
  },
  {
    key: 'curiosity',
    label: 'Любознательность',
    description: 'Интерес к новому и неизведанному',
    category: 'basic',
    color: 0x6D9DC5,
    maxLevel: 10,
    effects: {
      learningSpeedMultiplier: (lvl) => 1 + (lvl * 0.03),
      randomSkillGainChance: (lvl) => lvl >= 6 ? 0.02 : 0,
    },
    milestones: {
      6: { description: '+1 случайный уровень навыка каждые 50 дней' },
    },
  },
  {
    key: 'empathy',
    label: 'Эмпатия',
    description: 'Способность понимать чувства других',
    category: 'basic',
    color: 0xE8B4A0,
    maxLevel: 10,
    effects: {
      relationshipQualityMultiplier: (lvl) => 1 + (lvl * 0.05),
      friendHelpChance: (lvl) => lvl >= 10 ? 0.15 : 0,
    },
    milestones: {
      10: { description: 'Друзья иногда помогают деньгами или событиями' },
    },
  },
  {
    key: 'memory',
    label: 'Память',
    description: 'Способность запоминать информацию',
    category: 'basic',
    color: 0xA8CABA,
    maxLevel: 10,
    effects: {
      educationDecayReduction: (lvl) => 1 - (lvl * 0.015),
      relearningBonus: (lvl) => lvl >= 6 ? 0.1 : 0,
    },
    milestones: {
      6: { description: '+10% эффективность повторного обучения' },
    },
  },
]

export const PROFESSIONAL_SKILLS: SkillDef[] = [
  {
    key: 'projectManagement',
    label: 'Управление проектами',
    description: 'Организация и контроль сложных проектов',
    category: 'professional',
    color: 0x6D9DC5,
    maxLevel: 10,
    effects: {
      workEfficiencyMultiplier: (lvl) => 1 + (lvl * 0.04),
      teamEventBonus: (lvl) => 1 + (lvl * 0.05),
    },
    milestones: {
      10: { description: 'Можно вести крупные проекты' },
    },
  },
  {
    key: 'professionalism',
    label: 'Профессионализм',
    description: 'Качественное выполнение рабочих задач',
    category: 'professional',
    color: 0xE8B4A0,
    maxLevel: 10,
    effects: {
      salaryMultiplier: (lvl) => 1 + (lvl * 0.04),
      workEfficiencyMultiplier: (lvl) => 1 + (lvl * 0.02),
    },
    milestones: {
      10: { description: '+20% шанс повышения' },
    },
  },
  {
    key: 'leadership',
    label: 'Лидерство',
    description: 'Способность вести за собой других',
    category: 'professional',
    color: 0x6D9DC5,
    maxLevel: 10,
    effects: {
      promotionChance: (lvl) => lvl * 0.035,
      teamEventBonus: (lvl) => 1 + (lvl * 0.05),
    },
    milestones: {
      6: { description: 'Открывает руководящие должности' },
    },
  },
  {
    key: 'negotiations',
    label: 'Переговоры',
    description: 'Умение договариваться и убеждать',
    category: 'professional',
    color: 0xE87D7D,
    maxLevel: 10,
    effects: {
      jobSalaryOnHire: (lvl) => 1 + (lvl * 0.06),
      shopPriceMultiplier: (lvl) => 1 - (lvl * 0.008),
    },
    milestones: {
      10: { description: 'Можно торговаться за условия работы' },
    },
  },
  {
    key: 'analyticalThinking',
    label: 'Аналитическое мышление',
    description: 'Способность анализировать информацию',
    category: 'professional',
    color: 0x6D9DC5,
    maxLevel: 10,
    effects: {
      investmentReturnMultiplier: (lvl) => 1 + (lvl * 0.04),
      investmentRiskReduction: (lvl) => 1 - (lvl * 0.04),
    },
    milestones: {
      6: { description: 'Лучше предсказываются события' },
    },
  },
  {
    key: 'specialization',
    label: 'Специализация',
    description: 'Глубокие знания в конкретной области',
    category: 'professional',
    color: 0xA8CABA,
    maxLevel: 10,
    effects: {
      jobSpecificSalaryBonus: (lvl) => 1 + (lvl * 0.07),
    },
    milestones: {
      10: { description: 'Разблокирует топовые позиции' },
    },
  },
  {
    key: 'stressResistancePro',
    label: 'Стрессоустойчивость (проф)',
    description: 'Профессиональная устойчивость к стрессу',
    category: 'professional',
    color: 0xE87D7D,
    maxLevel: 10,
    effects: {
      stressGainFromWork: (lvl) => 1 - (lvl * 0.035),
      overtimeImmunity: (lvl) => lvl >= 6 ? 1 : 0,
    },
    milestones: {
      6: { description: 'Можно работать сверхурочно без штрафа' },
    },
  },
  {
    key: 'technicalLiteracy',
    label: 'Техническая грамотность',
    description: 'Работа с технологиями',
    category: 'professional',
    color: 0x6D9DC5,
    maxLevel: 10,
    effects: {
      learningTechSpeed: (lvl) => 1 + (lvl * 0.06),
      homeTechBonus: (lvl) => 1 + (lvl * 0.04),
    },
    milestones: {
      10: { description: '+15% ЗП в IT/инженерных профессиях' },
    },
  },
  {
    key: 'cooking',
    label: 'Кулинария',
    description: 'Умение готовить',
    category: 'professional',
    color: 0xF4D95F,
    maxLevel: 10,
    effects: {
      foodRecoveryMultiplier: (lvl) => 1 + (lvl * 0.07),
      dailyExpenseMultiplier: (lvl) => 1 - (lvl * 0.02),
    },
    milestones: {
      6: { description: 'Можно готовить дома с бонусом' },
    },
  },
  {
    key: 'marketing',
    label: 'Маркетинг',
    description: 'Продвижение и продажи',
    category: 'professional',
    color: 0xE87D7D,
    maxLevel: 10,
    effects: {
      hobbyIncomeMultiplier: (lvl) => 1 + (lvl * 0.09),
      passiveIncomeBonus: (lvl) => lvl * 120,
    },
    milestones: {
      10: { description: 'Пассивный доход от личного бренда' },
    },
  },
  {
    key: 'financialAnalysis',
    label: 'Финансовый анализ',
    description: 'Анализ финансовых инструментов',
    category: 'professional',
    color: 0xA8CABA,
    maxLevel: 10,
    effects: {
      investmentReturnMultiplier: (lvl) => 1 + (lvl * 0.05),
      taxReduction: (lvl) => lvl >= 6 ? 0.1 : 0,
    },
    milestones: {
      6: { description: 'Снижает налоги' },
    },
  },
  {
    key: 'personnelManagement',
    label: 'Управление персоналом',
    description: 'Управление подчинёнными',
    category: 'professional',
    color: 0x6D9DC5,
    maxLevel: 10,
    effects: {
      subordinateEfficiency: (lvl) => 1 + (lvl * 0.04),
    },
    milestones: {
      10: { description: 'Можно нанимать сотрудников' },
    },
  },
  {
    key: 'sales',
    label: 'Продажи',
    description: 'Навыки продаж и торговли',
    category: 'professional',
    color: 0xE8B4A0,
    maxLevel: 10,
    effects: {
      salesSuccess: (lvl) => 1 + (lvl * 0.055),
      shopPriceMultiplier: (lvl) => 1 - (lvl * 0.01),
    },
    milestones: {
      6: { description: 'Лучше условия в магазине' },
    },
  },
  {
    key: 'strategicPlanning',
    label: 'Стратегическое планирование',
    description: 'Долгосрочное планирование',
    category: 'professional',
    color: 0x6D9DC5,
    maxLevel: 10,
    effects: {
      overallEfficiency: (lvl) => 1 + (lvl * 0.03),
    },
    milestones: {
      10: { description: 'Раз в год можно перепланировать жизнь' },
    },
  },
  {
    key: 'legalLiteracy',
    label: 'Юридическая грамотность',
    description: 'Знание законов и прав',
    category: 'professional',
    color: 0xA8CABA,
    maxLevel: 10,
    effects: {
      legalPenaltyReduction: (lvl) => 1 - (lvl * 0.03),
    },
    milestones: {
      6: { description: 'Лучше контракты' },
    },
  },
  {
    key: 'medicalKnowledge',
    label: 'Медицинские знания',
    description: 'Знания о здоровье и лечении',
    category: 'professional',
    color: 0x7ED9A0,
    maxLevel: 10,
    effects: {
      healthRecoveryMultiplier: (lvl) => 1 + (lvl * 0.08),
      agingSpeedMultiplier: (lvl) => 1 - (lvl * 0.04),
    },
    milestones: {
      10: { description: 'Замедляет старение на 40%' },
    },
  },
]

export const SOCIAL_SKILLS: SkillDef[] = [
  {
    key: 'networking',
    label: 'Нетворкинг',
    description: 'Умение заводить и поддерживать полезные знакомства',
    category: 'social',
    color: 0xE8B4A0,
    maxLevel: 10,
    effects: {
      relationshipGainMultiplier: (lvl) => 1 + (lvl * 0.05),
      positiveEventChance: (lvl) => 0.05 + (lvl * 0.01),
    },
    milestones: {
      10: { description: 'Широкий круг полезных контактов' },
    },
  },
  {
    key: 'charisma',
    label: 'Харизма',
    description: 'Привлекательность и обаяние',
    category: 'social',
    color: 0xE8B4A0,
    maxLevel: 10,
    effects: {
      relationshipGainMultiplier: (lvl) => 1 + (lvl * 0.06),
    },
    milestones: {
      10: { description: 'NPC чаще помогают' },
    },
  },
  {
    key: 'humor',
    label: 'Юмор',
    description: 'Чувство юмора',
    category: 'social',
    color: 0xF4D95F,
    maxLevel: 10,
    effects: {
      moodRecoveryMultiplier: (lvl) => 1 + (lvl * 0.05),
      positiveEventChance: (lvl) => lvl >= 6 ? 0.2 : 0,
    },
    milestones: {
      6: { description: '+20% шанс позитивных случайных событий' },
    },
  },
  {
    key: 'patience',
    label: 'Терпение',
    description: 'Способность ждать и терпеть',
    category: 'social',
    color: 0x9E9E9E,
    maxLevel: 10,
    effects: {
      routinePenaltyReduction: (lvl) => 1 - (lvl * 0.03),
    },
    milestones: {
      10: { description: 'Иммунитет к скуке' },
    },
  },
  {
    key: 'optimism',
    label: 'Оптимизм',
    description: 'Позитивный взгляд на жизнь',
    category: 'social',
    color: 0xF4D95F,
    maxLevel: 10,
    effects: {
      allRecoveryMultiplier: (lvl) => 1 + (lvl * 0.025),
      negativeEventChance: (lvl) => 1 - (lvl >= 6 ? 0.15 : 0),
    },
    milestones: {
      6: { description: 'Реже негативные события' },
    },
  },
  {
    key: 'responsibility',
    label: 'Ответственность',
    description: 'Надёжность и обязательность',
    category: 'social',
    color: 0x6D9DC5,
    maxLevel: 10,
    effects: {
      missedActionPenalty: (lvl) => 1 - (lvl * 0.025),
    },
    milestones: {
      10: { description: 'Бонус к репутации' },
    },
  },
  {
    key: 'flexibleThinking',
    label: 'Гибкость мышления',
    description: 'Адаптивность мышления',
    category: 'social',
    color: 0xA8CABA,
    maxLevel: 10,
    effects: {
      agingPenaltyReduction: (lvl) => 1 - (lvl * 0.035),
    },
    milestones: {
      6: { description: 'Меньше штрафов от старения' },
    },
  },
  {
    key: 'generosity',
    label: 'Щедрость',
    description: 'Готовность делиться',
    category: 'social',
    color: 0xE8B4A0,
    maxLevel: 10,
    effects: {
      giftQualityBonus: (lvl) => 1 + (lvl * 0.04),
    },
    milestones: {
      10: { description: 'Иногда получают ответные подарки' },
    },
  },
  {
    key: 'selfDisciplineExtended',
    label: 'Самодисциплина (расш.)',
    description: 'Устойчивость к рутине и умение держать курс',
    category: 'social',
    color: 0x6D9DC5,
    maxLevel: 10,
    effects: {
      autoRecoveryWeekly: (lvl) => lvl >= 10 ? 5 : lvl * 0.5,
      workPeriodBonusChance: (lvl) => lvl * 0.01,
    },
    milestones: {
      10: { description: 'Автоматическое небольшое восстановление каждую неделю' },
    },
  },
  {
    key: 'intuition',
    label: 'Интуиция',
    description: 'Способность чувствовать правильное решение',
    category: 'social',
    color: 0xE87D7D,
    maxLevel: 10,
    effects: {
      eventChoiceHint: (lvl) => lvl * 0.03,
    },
    milestones: {
      6: { description: 'Подсказки в сложных событиях' },
    },
  },
  {
    key: 'wisdom',
    label: 'Мудрость',
    description: 'Глубокое понимание жизни',
    category: 'social',
    color: 0x9E9E9E,
    maxLevel: 10,
    effects: {
      agePenaltyAfter50: (lvl) => 1 - (lvl * 0.05),
      lifeExpectancyBonus: (lvl) => lvl >= 10 ? 1 : 0,
    },
    milestones: {
      10: { description: '+1 год к ожидаемой продолжительности жизни' },
    },
  },
]

export const CREATIVE_SKILLS: SkillDef[] = [
  {
    key: 'artisticMastery',
    label: 'Художественное мастерство',
    description: 'Создание произведений искусства',
    category: 'creative',
    color: 0xE87D7D,
    maxLevel: 10,
    effects: {
      hobbyIncomeMultiplier: (lvl) => 1 + (lvl * 0.08),
    },
    milestones: {
      10: { description: 'Разблокирует выставки' },
    },
  },
  {
    key: 'musicalAbility',
    label: 'Музыкальные способности',
    description: 'Игра на инструментах и вокал',
    category: 'creative',
    color: 0x6D9DC5,
    maxLevel: 10,
    effects: {
      moodRecoveryMultiplier: (lvl) => 1 + (lvl * 0.07),
    },
    milestones: {
      6: { description: 'Можно зарабатывать на выступлениях' },
    },
  },
  {
    key: 'writing',
    label: 'Писательское мастерство',
    description: 'Написание текстов и книг',
    category: 'creative',
    color: 0xA8CABA,
    maxLevel: 10,
    effects: {
      hobbyIncomeMultiplier: (lvl) => 1 + (lvl * 0.06),
      passiveIncomeBonus: (lvl) => lvl >= 10 ? lvl * 100 : 0,
    },
    milestones: {
      10: { description: 'Пассивный доход от royalties' },
    },
  },
  {
    key: 'photography',
    label: 'Фотография',
    description: 'Фотографирование и обработка',
    category: 'creative',
    color: 0x9E9E9E,
    maxLevel: 10,
    effects: {
      socialEventBonus: (lvl) => 1 + (lvl * 0.05),
    },
    milestones: {
      6: { description: 'Улучшает отношения' },
    },
  },
  {
    key: 'gardening',
    label: 'Садоводство',
    description: 'Выращивание растений',
    category: 'creative',
    color: 0x7ED9A0,
    maxLevel: 10,
    effects: {
      homeComfortMultiplier: (lvl) => 1 + (lvl * 0.04),
      healthBonus: (lvl) => lvl * 0.5,
    },
    milestones: {
      10: { description: 'Бесплатная еда из сада' },
    },
  },
  {
    key: 'handiness',
    label: 'Ремесло',
    description: 'Работа руками и ремонт',
    category: 'creative',
    color: 0xF4D95F,
    maxLevel: 10,
    effects: {
      repairCostReduction: (lvl) => 1 - (lvl * 0.03),
    },
    milestones: {
      6: { description: 'Можно чинить вещи самостоятельно' },
    },
  },
  {
    key: 'dance',
    label: 'Танец',
    description: 'Танцевальное искусство',
    category: 'creative',
    color: 0xE8B4A0,
    maxLevel: 10,
    effects: {
      energyRecoveryFromActivity: (lvl) => 1 + (lvl * 0.055),
    },
    milestones: {},
  },
  {
    key: 'acting',
    label: 'Актёрское мастерство',
    description: 'Игра на сцене и в кино',
    category: 'creative',
    color: 0xE87D7D,
    maxLevel: 10,
    effects: {
      publicEventSuccess: (lvl) => 1 + (lvl * 0.04),
    },
    milestones: {
      10: { description: 'Разблокирует медиа-карьеру' },
    },
  },
  {
    key: 'interiorDesign',
    label: 'Дизайн интерьера',
    description: 'Оформление пространства',
    category: 'creative',
    color: 0x6D9DC5,
    maxLevel: 10,
    effects: {
      furnitureComfortBonus: (lvl) => 1 + (lvl * 0.06),
    },
    milestones: {
      6: { description: 'Скидки на мебель' },
    },
  },
  {
    key: 'culinaryArt',
    label: 'Кулинарное искусство',
    description: 'Высокая кухня',
    category: 'creative',
    color: 0xF4D95F,
    maxLevel: 10,
    effects: {
      homeFoodRecovery: (lvl) => 1 + (lvl * 0.1),
    },
    milestones: {
      10: { description: 'Можно открыть небольшой бизнес' },
    },
  },
]

export const NEGATIVE_SKILLS: SkillDef[] = [
  {
    key: 'forgetfulness',
    label: 'Забывчивость',
    description: 'Частая забывчивость и рассеянность',
    category: 'negative',
    color: 0xD14D4D,
    maxLevel: 10,
    effects: {
      learningSpeedMultiplier: (lvl) => 1 - (lvl * 0.025),
      memoryDecaySpeed: (lvl) => 1 + (lvl * 0.04),
      negativeEventChance: (lvl) => 0.03 + (lvl * 0.008),
    },
    milestones: {
      5: { description: 'Иногда забываешь важные вещи' },
      10: { description: 'Серьёзные проблемы с памятью' },
    },
  },
  {
    key: 'procrastination',
    label: 'Прокрастинация',
    description: 'Склонность откладывать дела на потом',
    category: 'negative',
    color: 0xD14D4D,
    maxLevel: 10,
    effects: {
      workEfficiency: (lvl) => 1 - (lvl * 0.03),
      stressGainMultiplier: (lvl) => 1 + (lvl * 0.025),
    },
    milestones: {
      10: { description: 'Сильная прокрастинация, постоянный стресс' },
    },
  },
  {
    key: 'perfectionism',
    label: 'Перфекционизм',
    description: 'Стремление делать всё идеально',
    category: 'negative',
    color: 0xE8B94A,
    maxLevel: 10,
    effects: {
      workEfficiency: (lvl) => 1 - (lvl * 0.02),        // тратит больше времени
      stressGainMultiplier: (lvl) => 1 + (lvl * 0.03),
      positiveEventChance: (lvl) => lvl >= 8 ? -0.1 : 0, // иногда мешает
    },
    milestones: {
      7: { description: 'Сильно повышает стресс от работы' },
    },
  },
  {
    key: 'impulsiveness',
    label: 'Импульсивность',
    description: 'Склонность действовать не подумав',
    category: 'negative',
    color: 0xD14D4D,
    maxLevel: 10,
    effects: {
      shopPriceMultiplier: (lvl) => 1 + (lvl * 0.015),   // чаще переплачиваешь
      negativeEventChance: (lvl) => 0.04 + (lvl * 0.01),
    },
    milestones: {
      10: { description: 'Частые импульсивные покупки и решения' },
    },
  },
  {
    key: 'laziness',
    label: 'Лень',
    description: 'Низкая мотивация к действию',
    category: 'negative',
    color: 0x9E9E9E,
    maxLevel: 10,
    effects: {
      learningSpeedMultiplier: (lvl) => 1 - (lvl * 0.04),
      workEfficiency: (lvl) => 1 - (lvl * 0.035),
    },
    milestones: {
      10: { description: 'Очень трудно заставить себя работать' },
    },
  },
]

export const ALL_SKILLS: SkillDef[] = [
  ...BASIC_SKILLS,
  ...PROFESSIONAL_SKILLS,
  ...SOCIAL_SKILLS,
  ...CREATIVE_SKILLS,
  ...NEGATIVE_SKILLS,
]

export const SKILLS_BY_CATEGORY: Record<SkillCategory, SkillDef[]> = {
  basic: BASIC_SKILLS,
  professional: PROFESSIONAL_SKILLS,
  social: SOCIAL_SKILLS,
  creative: CREATIVE_SKILLS,
  negative: NEGATIVE_SKILLS,
}

export const SKILL_KEYS: string[] = ALL_SKILLS.map(s => s.key)

export function getSkillByKey(key: string): SkillDef | undefined {
  return ALL_SKILLS.find(s => s.key === key)
}

export function getSkillsByCategory(category: SkillCategory): SkillDef[] {
  return SKILLS_BY_CATEGORY[category] || []
}

