import type { EducationProgram, ProgramStep } from '@/domain/balance/types'
import { AgeGroup } from '@/domain/balance/actions/types'

/**
 * Upgrades saves created before books used one-hour chapters.
 * Old saves stored five broad stages; completed hours are preserved exactly.
 * @description [Balance] - converts legacy book progress to chapter-level progress.
 * @return { ProgramStep[] | null } upgraded steps or null when upgrade is unnecessary
 */
export function upgradeBookChapterSteps(
  program: EducationProgram | undefined,
  storedSteps: Array<{ hoursRequired?: unknown; progressPercent?: unknown }>,
): ProgramStep[] | null {
  const chapters: ProgramStep[] | undefined = program?.steps

  if (program?.track !== 'book' || !chapters?.length || !storedSteps.length || storedSteps.length === chapters.length) return null

  const completedHours: number = storedSteps.reduce(
    (total, step) => {
    const hours: number = Math.max(1, Number(step.hoursRequired ?? 1))
    const progress: number = Math.max(0, Math.min(1, Number(step.progressPercent ?? 0)))
    return total + hours * progress
    },
    0,
  )

  return chapters.map((chapter, index) => ({
    ...chapter,
    progressPercent: Math.max(0, Math.min(1, completedHours - index)),
  }))
}

export const EDUCATION_PROGRAMS: EducationProgram[] = [
  {
    id: 'time_management_book',
    title: 'Книга «Как управлять временем»',
    subtitle: 'Простой и недорогой способ навести порядок в голове и делах.',
    track: 'book',
    acquisition: 'shop_only',
    requiresItemId: 'book_time_management',
    purchaseActionId: 'shop_time_management_book',
    typeLabel: 'Книга',
    cost: 0,
    daysRequired: 2,
    hoursRequired: 9,
    accentKey: 'accent',
    rewardText: 'Тайм-менеджмент +2 • Стресс -6 • Дисциплина +1',
    completionStatChanges: { stress: -6, mood: 4 },
    completionSkillChanges: { timeManagement: 2, discipline: 1 },
    description: 'Короткая, но очень практичная книга, которая помогает перестать тратить время впустую.',
    minAgeGroup: AgeGroup.TEEN,
    ageReason: 'Осознанный навык самоорганизации, книга про self-management',
    maxRepeats: 3,
    repeatRewardMultiplier: 0.5,
    steps: [
      { id: 'time_management_book_chapter_1', title: 'Глава 1. Инвентаризация времени', hoursRequired: 1, progressPercent: 0, content: 'Отметьте, куда действительно уходит ваш день, без самокритики и оправданий.' },
      { id: 'time_management_book_chapter_2', title: 'Глава 2. Главное и срочное', hoursRequired: 1, progressPercent: 0, content: 'Отделите важные дела от срочных: не всё, что шумит, заслуживает первого места.' },
      { id: 'time_management_book_chapter_3', title: 'Глава 3. Реалистичный план', hoursRequired: 1, progressPercent: 0, content: 'Соберите короткий план дня, оставив в нём время на обычные непредвиденные дела.' },
      { id: 'time_management_book_chapter_4', title: 'Глава 4. Границы внимания', hoursRequired: 1, progressPercent: 0, content: 'Уберите один отвлекающий фактор и выделите непрерывный отрезок для главной задачи.' },
      { id: 'time_management_book_chapter_5', title: 'Глава 5. Маленькие шаги', hoursRequired: 1, progressPercent: 0, content: 'Разбейте большую задачу на первый простой шаг, который можно сделать прямо сейчас.' },
      { id: 'time_management_book_chapter_6', title: 'Глава 6. Ритм и паузы', hoursRequired: 1, progressPercent: 0, content: 'Чередуйте сосредоточенную работу и короткий отдых, чтобы не истощать внимание.' },
      { id: 'time_management_book_chapter_7', title: 'Глава 7. Делегирование', hoursRequired: 1, progressPercent: 0, content: 'Найдите задачу, которую разумно передать, автоматизировать или вообще не делать.' },
      { id: 'time_management_book_chapter_8', title: 'Глава 8. Обзор недели', hoursRequired: 1, progressPercent: 0, content: 'Посмотрите на прошедшую неделю и выберите один принцип для следующей.' },
      { id: 'time_management_book_chapter_9', title: 'Глава 9. Система на каждый день', hoursRequired: 1, progressPercent: 0, content: 'Закрепите личную систему: главное дело, ясные границы и короткий вечерний обзор.' },
    ],
  },
  {
    id: 'meditation_foundations_book',
    title: 'Книга «Основы медитации»',
    subtitle: 'Четырнадцать коротких глав — от введения до устойчивой практики в жизни.',
    track: 'book',
    acquisition: 'shop_only',
    requiresItemId: 'book_meditation_foundations',
    purchaseActionId: 'shop_meditation_foundations_book',
    typeLabel: 'Книга',
    cost: 0,
    daysRequired: 2,
    hoursRequired: 14,
    accentKey: 'sage',
    rewardText: 'Медитация +1 • Эмоциональный интеллект +0.5',
    completionStatChanges: { hunger: 6.5, energy: -9, stress: -20, mood: 16, health: 1.2, physical: -1 },
    completionSkillChanges: { meditation: 1, emotionalIntelligence: 0.5 },
    description:
      'Книга состоит из четырнадцати коротких глав: от намерения и дыхания до работы с мыслями, эмоциями и устойчивой практики в жизни. После полного прохождения открывается действие «Медитация» в развлечениях.',
    minAgeGroup: AgeGroup.TEEN,
    ageReason: 'Самостоятельная практика осознанности, книга для подростков и старше',
    maxRepeats: 3,
    repeatRewardMultiplier: 0.5,
    steps: [
      { id: 'meditation_foundations_book_chapter_1', title: 'Глава 1. Намерение', hoursRequired: 1, progressPercent: 0, content: 'Определите, зачем вам нужна практика. Сядьте удобно и сделайте три спокойных вдоха.' },
      { id: 'meditation_foundations_book_chapter_2', title: 'Глава 2. Опора тела', hoursRequired: 1, progressPercent: 0, content: 'Почувствуйте опору тела: стопы, сиденье или спину. Устойчивость не требует напряжения.' },
      { id: 'meditation_foundations_book_chapter_3', title: 'Глава 3. Спокойное дыхание', hoursRequired: 1, progressPercent: 0, content: 'Наблюдайте вдох и выдох, не пытаясь специально менять их длину или ритм.' },
      { id: 'meditation_foundations_book_chapter_4', title: 'Глава 4. Возвращение внимания', hoursRequired: 1, progressPercent: 0, content: 'Когда внимание отвлеклось, мягко верните его к следующему вдоху — без оценки себя.' },
      { id: 'meditation_foundations_book_chapter_5', title: 'Глава 5. Наблюдение мыслей', hoursRequired: 1, progressPercent: 0, content: 'Замечайте возникающие мысли и позволяйте им уходить, не продолжая внутренний разговор.' },
      { id: 'meditation_foundations_book_chapter_6', title: 'Глава 6. Пауза перед реакцией', hoursRequired: 1, progressPercent: 0, content: 'Перед привычной реакцией сделайте короткую паузу и отметьте, что происходит в теле.' },
      { id: 'meditation_foundations_book_chapter_7', title: 'Глава 7. Приятные ощущения', hoursRequired: 1, progressPercent: 0, content: 'Отметьте приятное ощущение без стремления удержать его или сделать сильнее.' },
      { id: 'meditation_foundations_book_chapter_8', title: 'Глава 8. Сложные ощущения', hoursRequired: 1, progressPercent: 0, content: 'Назовите напряжение, тяжесть или тревогу ощущением и дайте ему немного пространства.' },
      { id: 'meditation_foundations_book_chapter_9', title: 'Глава 9. Эмоции', hoursRequired: 1, progressPercent: 0, content: 'Заметьте эмоцию как сочетание мыслей и телесных сигналов, не споря с её появлением.' },
      { id: 'meditation_foundations_book_chapter_10', title: 'Глава 10. Доброжелательность', hoursRequired: 1, progressPercent: 0, content: 'Попробуйте отнестись к себе так же бережно, как к уставшему близкому человеку.' },
      { id: 'meditation_foundations_book_chapter_11', title: 'Глава 11. Осознанная прогулка', hoursRequired: 1, progressPercent: 0, content: 'Во время короткой прогулки отмечайте шаги, звуки и ощущения, возвращаясь в настоящий момент.' },
      { id: 'meditation_foundations_book_chapter_12', title: 'Глава 12. Обычные дела', hoursRequired: 1, progressPercent: 0, content: 'Выберите привычное дело — чай, душ или ожидание — и выполните его без спешки.' },
      { id: 'meditation_foundations_book_chapter_13', title: 'Глава 13. Личный ритм', hoursRequired: 1, progressPercent: 0, content: 'Подберите короткую практику, которую реально повторять в обычный день.' },
      { id: 'meditation_foundations_book_chapter_14', title: 'Глава 14. Закрепление', hoursRequired: 1, progressPercent: 0, content: 'Соберите простое намерение на завтра: одна короткая осознанная пауза уже поддерживает навык.', milestoneReward: { message: '📘 Последняя глава пройдена — книга полностью освоена.' } },
    ],
  },
  {
    id: 'online_productivity_course',
    title: 'Онлайн-курс «Личная эффективность»',
    subtitle: 'Системный подход к продуктивности с заданиями и обратной связью.',
    track: 'online',
    acquisition: 'purchase_on_education_page',
    requiresComputer: true,
    requiresItemId: 'study_laptop',
    typeLabel: 'Онлайн-курс',
    cost: 6900,
    daysRequired: 6,
    hoursRequired: 28,
    accentKey: 'blue',
    rewardText: 'Профессионализм +2 • Тайм-менеджмент +2 • Настроение +10',
    completionStatChanges: { mood: 10, stress: -7, energy: 5 },
    completionSkillChanges: { professionalism: 2, timeManagement: 2, discipline: 1 },
    description: 'Практический курс с видео, заданиями и чек-листами. Даёт ощутимый прирост организованности.',
    minAgeGroup: AgeGroup.YOUNG,
    ageReason: 'Уже заметно adult-coded продукт, системный подход к продуктивности',
  },
  {
    id: 'institute_retraining',
    title: 'Профессиональная переподготовка в институте',
    subtitle: 'Серьёзное долгосрочное обучение для перехода на новый карьерный уровень.',
    track: 'institute',
    acquisition: 'purchase_on_education_page',
    typeLabel: 'Институт',
    cost: 135000,
    daysRequired: 10,
    hoursRequired: 180,
    accentKey: 'sage',
    rewardText: 'Профессионализм +4 • Зарплата +8% • Образование: Высшее',
    completionStatChanges: { mood: 8, stress: -5 },
    completionSkillChanges: { professionalism: 4, analyticalThinking: 2 },
    salaryMultiplierDelta: 0.08,
    educationLevel: 'Высшее',
    description: 'Полноценная переподготовка с дипломом. Долгий, но надёжный путь к более высокой должности и зарплате.',
    minAgeGroup: AgeGroup.ADULT,
    ageReason: 'Формальное карьерное обучение, даёт образование: Высшее, повышает зарплату',
  },

  // ───── Новые осознанные образовательные программы ─────
  {
    id: 'foreign_language_intensive',
    title: 'Интенсив по иностранному языку',
    subtitle: 'Погружение в язык с ежедневными занятиями и разговорной практикой.',
    track: 'intensive',
    acquisition: 'purchase_on_education_page',
    typeLabel: 'Интенсив',
    cost: 18500,
    daysRequired: 7,
    hoursRequired: 45,
    accentKey: 'blue',
    rewardText: 'Коммуникация +3 • Харизма +1 • Настроение +9',
    completionStatChanges: { mood: 9, stress: -6 },
    completionSkillChanges: { communication: 3, charisma: 1 },
    description: 'Интенсивный курс с носителем языка. Значительно улучшает навык общения.',
    minAgeGroup: AgeGroup.TEEN,
    ageReason: 'Реалистично с подросткового возраста, языковые интенсивы распространены',
  },
  {
    id: 'public_speaking_course',
    title: 'Курс ораторского мастерства',
    subtitle: 'Учимся уверенно выступать перед аудиторией.',
    track: 'course',
    acquisition: 'purchase_on_education_page',
    typeLabel: 'Курс',
    cost: 12400,
    daysRequired: 5,
    hoursRequired: 22,
    accentKey: 'accent',
    rewardText: 'Харизма +3 • Коммуникация +2 • Стресс от публичных выступлений -30%',
    completionStatChanges: { stress: -8, mood: 11 },
    completionSkillChanges: { charisma: 3, communication: 2 },
    description: 'Практический курс с выступлениями, разбором и обратной связью.',
    minAgeGroup: AgeGroup.TEEN,
    ageReason: 'Подходит подросткам и взрослым',
  },
  {
    id: 'financial_literacy_intensive',
    title: 'Интенсив «Финансовая свобода»',
    subtitle: 'Глубокое погружение в личные финансы и инвестиции.',
    track: 'intensive',
    acquisition: 'purchase_on_education_page',
    typeLabel: 'Интенсив',
    cost: 9800,
    daysRequired: 4,
    hoursRequired: 18,
    accentKey: 'sage',
    rewardText: 'Финансовая грамотность +4 • Аналитическое мышление +2',
    completionStatChanges: { stress: -10, mood: 7 },
    completionSkillChanges: { financialLiteracy: 4, analyticalThinking: 2 },
    description: 'Практический курс, после которого вы перестаёте бояться денег и начинаете ими управлять.',
    minAgeGroup: AgeGroup.YOUNG,
    ageReason: 'Уже ближе к личным финансам взрослого уровня, инвестиционный фокус',
  },
]
