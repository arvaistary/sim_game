import {
  WALLET_COMPONENT,
  EDUCATION_COMPONENT,
  SKILLS_COMPONENT,
  CAREER_COMPONENT,
  TIME_COMPONENT,
  STATS_COMPONENT,
  COGNITIVE_LOAD_COMPONENT,
  PLAYER_ENTITY,
} from '../../components/index'
import { EDUCATION_PROGRAMS } from '../../../balance/constants/education-programs'
import { SkillsSystem } from '../SkillsSystem'
import { TimeSystem } from '../TimeSystem'
import { StatsSystem } from '../StatsSystem'
import type { GameWorld } from '../../world'
import type { EducationProgram, StatChanges, ProgramStep } from '@/domain/balance/types'
import type { CanStartResult, StartResult, AdvanceResult, ActiveCourse } from './index.types'
import { AgeGroup, getAgeGroup } from '@/composables/useAgeRestrictions/age-constants'
import { calculateLearningEfficiencyV1, getNeedsStateFromComponents, type LearningInput } from './learning-efficiency'
import { calculateTimeEfficiencyModifiers } from './time-efficiency'
import type { CognitiveLoadComponent } from './cognitive-load'
import {
  createDefaultCognitiveLoadComponent,
  addStudyHours,
  calculateCognitiveLoadPenalty,
  getCognitiveLoadStatus,
} from './cognitive-load'

/**
 * Система управления образованием
 * Обрабатывает курсы, обучение и развитие навыков
 */
export class EducationSystem {
  private world!: GameWorld
  private skillsSystem!: SkillsSystem
  private timeSystem!: TimeSystem
  private statsSystem!: StatsSystem
  private educationPrograms: EducationProgram[]

  constructor() {
    this.educationPrograms = EDUCATION_PROGRAMS as EducationProgram[]
  }

  init(world: GameWorld): void {
    this.world = world
    this.skillsSystem = this._resolveSkillsSystem(world)
    this.statsSystem = this._resolveStatsSystem(world)
    this.timeSystem = this._resolveTimeSystem(world)
  }

  private _resolveTimeSystem(world: GameWorld): TimeSystem {
    const existing = world.getSystem(TimeSystem)
    if (existing) return existing
    const created = new TimeSystem()
    world.addSystem(created)
    return created
  }

  private _resolveSkillsSystem(world: GameWorld): SkillsSystem {
    const existing = world.getSystem(SkillsSystem)
    if (existing) return existing
    const created = new SkillsSystem()
    world.addSystem(created)
    return created
  }

  private _resolveStatsSystem(world: GameWorld): StatsSystem {
    const existing = world.getSystem(StatsSystem)
    if (existing) return existing
    const created = new StatsSystem()
    world.addSystem(created)
    return created
  }

  canStartEducationProgram(program: EducationProgram): CanStartResult {
    const playerId = PLAYER_ENTITY
    const wallet = this.world.getComponent(playerId, WALLET_COMPONENT) as Record<string, number> | null
    const education = this.world.getComponent(playerId, EDUCATION_COMPONENT) as Record<string, unknown> | null

    if (!wallet || !education) {
      return { ok: false, reason: 'Не удалось загрузить данные персонажа' }
    }

    // Возрастная проверка: minAgeGroup по умолчанию TEEN (13+)
    const minAgeGroup = program.minAgeGroup ?? AgeGroup.TEEN
    const time = this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, unknown> | null
    const currentAge = time?.currentAge as number | undefined
    if (typeof currentAge === 'number') {
      const currentAgeGroup = getAgeGroup(currentAge)
      if (currentAgeGroup < minAgeGroup) {
        const ageLabels: Record<AgeGroup, string> = {
          [AgeGroup.INFANT]: '0–3',
          [AgeGroup.TODDLER]: '4–7',
          [AgeGroup.CHILD]: '8–12',
          [AgeGroup.KID]: '8–12',
          [AgeGroup.TEEN]: '13–15',
          [AgeGroup.YOUNG]: '16–18',
          [AgeGroup.ADULT]: '19+',
        }
        return {
          ok: false,
          reason: `Эта программа доступна с возраста ${ageLabels[minAgeGroup]}+. Сейчас вам ${currentAge} лет.`
        }
      }
    }

    if (wallet.money < program.cost) {
      const shortage = program.cost - wallet.money
      return {
        ok: false,
        reason: `💰 Недостаточно денег для записи на курс.\n\nСтоимость: ${this._formatMoney(program.cost)} ₽\nВаш баланс: ${this._formatMoney(wallet.money)} ₽\nНе хватает: ${this._formatMoney(shortage)} ₽\n\n💡 Подсказка: Попробуйте найти работу или подработку, чтобы заработать недостающую сумму.`
      }
    }

    const activeCourses = education.activeCourses as ActiveCourse[] | undefined
    if (activeCourses && activeCourses.length > 0) {
      const currentCourse = activeCourses[0]
      const progress = Math.round((currentCourse.progress || 0) * 100)
      return {
        ok: false,
        reason: `📚 Вы уже проходите курс: ${currentCourse.name}\n\nПрогресс: ${progress}%\nЗавершите текущий курс перед началом нового.\n\n💡 Подсказка: Продолжайте обучение, чтобы завершить курс и получить награду.`
      }
    }

    if (program.educationLevel && education.educationLevel === program.educationLevel) {
      return {
        ok: false,
        reason: `🎓 Этот уровень образования уже получен: ${program.educationLevel}\n\nВыберите другой курс для продолжения развития.\n\n💡 Подсказка: Попробуйте курсы более высокого уровня или смежные направления.`
      }
    }

    return { ok: true }
  }

  startEducationProgram(program: EducationProgram | string): StartResult {
    const resolvedProgram = typeof program === 'string'
      ? this.educationPrograms.find((item) => item.id === program)
      : program
    if (!resolvedProgram) {
      return { success: false, message: 'Образовательная программа не найдена' }
    }

    const playerId = PLAYER_ENTITY
    const wallet = this.world.getComponent(playerId, WALLET_COMPONENT) as Record<string, number> | null
    const education = this.world.getComponent(playerId, EDUCATION_COMPONENT) as Record<string, unknown> | null

    if (!wallet || !education) {
      return { success: false, message: 'Не удалось загрузить данные персонажа' }
    }

    const validation = this.canStartEducationProgram(resolvedProgram)
    if (!validation.ok) {
      return { success: false, message: validation.reason! }
    }

    wallet.money -= resolvedProgram.cost
    wallet.totalSpent += resolvedProgram.cost

    const activeCourse: ActiveCourse = {
      id: resolvedProgram.id,
      name: resolvedProgram.title,
      type: resolvedProgram.typeLabel,
      progress: 0,
      daysRequired: resolvedProgram.daysRequired,
      daysSpent: 0,
      hoursRequired: this._resolveCourseHours(resolvedProgram),
      hoursSpent: 0,
      costPaid: resolvedProgram.cost,
      currentStepIndex: 0,
      steps: this._generateProgramSteps(resolvedProgram),
    }

    if (!education.activeCourses) {
      education.activeCourses = []
    }
    education.activeCourses = [activeCourse]

    if (this.world && this.world.eventBus) {
      this.world.eventBus.dispatchEvent(new CustomEvent('activity:education', {
        detail: {
          category: 'enrollment',
          title: '📚 Записан на курс',
          description: `${resolvedProgram.title}. Стоимость: ${this._formatMoney(resolvedProgram.cost)} ₽. Длительность: ${this._resolveCourseHours(resolvedProgram)} ч.`,
          icon: null,
          metadata: {
            programId: resolvedProgram.id,
            programName: resolvedProgram.title,
            skillsGained: resolvedProgram.completionSkillChanges || {},
          },
        },
      }))
    }

    return {
      success: true,
      message: [
        `${resolvedProgram.title} начат.`,
        `Стоимость: ${this._formatMoney(resolvedProgram.cost)} ₽.`,
        `Понадобится ${this._resolveCourseHours(resolvedProgram)} игровых ч.`,
      ].join('\n'),
    }
  }

  advanceEducationCourseDay(courseId: string): AdvanceResult {
    const playerId = PLAYER_ENTITY
    const education = this.world.getComponent(playerId, EDUCATION_COMPONENT) as Record<string, unknown> | null
    const time = this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, unknown> | null
    const stats = this.world.getComponent(playerId, STATS_COMPONENT) as Record<string, number> | null

    if (!education || !time) {
      return { completed: false, summary: 'Не удалось загрузить данные' }
    }

    const activeCourses = education.activeCourses as ActiveCourse[] | undefined
    const course = activeCourses?.find(item => item.id === courseId)
    const program = this.educationPrograms.find(item => item.id === courseId)
    const modifiers = this.skillsSystem.getModifiers()

    if (!course || !program) {
      return { completed: false, summary: 'Активный курс не найден.' }
    }

    // Получить текущий шаг
    const currentStepIndex = course.currentStepIndex ?? 0
    const currentStep = course.steps?.[currentStepIndex]
    
    if (!currentStep) {
      return { completed: false, summary: 'Шаг программы не найден.' }
    }

    const studyHours = 4
    
    // Рассчитать time-based модификаторы эффективности
    const timeModifiers = calculateTimeEfficiencyModifiers(time as any)
    
    // Получить или создать компонент когнитивной нагрузки
    let cognitiveLoad = this.world.getComponent<CognitiveLoadComponent>(PLAYER_ENTITY, COGNITIVE_LOAD_COMPONENT)
    const currentDay = time.gameDays as number
    
    if (!cognitiveLoad) {
      cognitiveLoad = createDefaultCognitiveLoadComponent(currentDay)
      this.world.addComponent(PLAYER_ENTITY, COGNITIVE_LOAD_COMPONENT, cognitiveLoad as unknown as Record<string, unknown>)
    }
    
    // Проверить ограничение на учебные часы в день
    if (cognitiveLoad.studyHoursToday >= cognitiveLoad.maxStudyHours) {
      const loadStatus = getCognitiveLoadStatus(cognitiveLoad)
      return {
        completed: false,
        summary: [
          `⛔ Невозможно продолжить обучение: ${course.name}`,
          '',
          'Лимит учебных часов на сегодня исчерпан.',
          `Учебные часы сегодня: ${cognitiveLoad.studyHoursToday} / ${cognitiveLoad.maxStudyHours}`,
          '',
          `Состояние: ${loadStatus.label}`,
          loadStatus.description,
          '',
          '💡 Рекомендации:',
          '  • Отдохните и восстановитесь',
          '  • Продолжите обучение завтра',
        ].join('\n'),
      }
    }
    
    // Рассчитать эффективность усвоения перед выполнением шага
    const needsState = getNeedsStateFromComponents(stats)
    const cognitiveLoadPenalty = calculateCognitiveLoadPenalty(cognitiveLoad)
    
    const learningInput: LearningInput = {
      baseEffect: 1.0,
      baseEfficiency: 1.0,
      skillMultiplier: modifiers.learningSpeedMultiplier ?? 1.0,
      antiGrindMultiplier: 1.0,
      timeMultiplier: timeModifiers.combinedMultiplier * cognitiveLoadPenalty,
      needs: needsState,
      isLongProgramStep: true,
    }
    
    const learningResult = calculateLearningEfficiencyV1(learningInput)
    
    // Если заблокировано из-за критического состояния потребностей
    if (learningResult.blocked) {
      const energyLow = needsState.energy < 10
      const hungerHigh = needsState.hunger < 10
      
      const issues: string[] = []
      if (energyLow) issues.push('⚡ Энергия критически низкая')
      if (hungerHigh) issues.push('🍽️ Сильный голод')
      
      return {
        completed: false,
        summary: [
          `⛔ Невозможно продолжить обучение: ${course.name}`,
          '',
          'Критическое состояние персонажа:',
          ...issues.map(issue => `  • ${issue}`),
          '',
          '💡 Рекомендации:',
          '  • Отдохните и восстановите энергию',
          '  • Поешьте, чтобы утолить голод',
          '  • Попробуйте продолжить обучение позже',
        ].join('\n'),
      }
    }
    
    // Продвинуть время с учётом эффективности
    this.timeSystem.advanceHours(studyHours, { actionType: 'education' })

    // Обновить когнитивную нагрузку
    addStudyHours(cognitiveLoad, studyHours, currentDay)
    this.world.updateComponent(PLAYER_ENTITY, COGNITIVE_LOAD_COMPONENT, cognitiveLoad as unknown as Record<string, unknown>)

    course.daysSpent += 1
    
    // Обновить прогресс текущего шага
    const effectiveHours = studyHours * learningResult.finalEfficiency
    const stepHoursSpent = (currentStep.hoursRequired * currentStep.progressPercent) + effectiveHours
    currentStep.progressPercent = Math.min(1, stepHoursSpent / currentStep.hoursRequired)
    
    // Обновить общий прогресс курса
    const totalSteps = course.steps?.length || 1
    const completedSteps = course.steps?.filter(s => s.progressPercent >= 1).length || 0
    const currentStepProgress = currentStep.progressPercent
    course.progress = (completedSteps + currentStepProgress) / totalSteps

    // Применить изменения статов (базовые, модифицированные эффективностью)
    this.statsSystem.applyStatChanges({
      energy: -10 * learningResult.finalEfficiency,
      stress: 8 * learningResult.finalEfficiency,
      mood: -3 * learningResult.finalEfficiency,
    })

    // Проверить, завершён ли текущий шаг
    if (currentStep.progressPercent >= 1) {
      // Применить milestone-награду, если есть
      if (currentStep.milestoneReward) {
        if (currentStep.milestoneReward.statChanges) {
          this.statsSystem.applyStatChanges(currentStep.milestoneReward.statChanges)
        }
        if (currentStep.milestoneReward.skillChanges) {
          this._applySkillChanges(currentStep.milestoneReward.skillChanges)
        }
      }

      // Отправить событие о завершении шага
      if (this.world && this.world.eventBus) {
        this.world.eventBus.dispatchEvent(new CustomEvent('activity:education', {
          detail: {
            category: 'step_complete',
            title: `✅ ${currentStep.title} завершён`,
            description: `Прогресс курса: ${Math.round(course.progress * 100)}%. Шаг ${currentStepIndex + 1} из ${totalSteps}.`,
            icon: null,
            metadata: {
              programId: course.id,
              programName: course.name,
              stepId: currentStep.id,
              stepTitle: currentStep.title,
              stepIndex: currentStepIndex,
              totalSteps,
              progressPercent: Math.round(course.progress * 100),
              efficiencyPercent: Math.round(learningResult.finalEfficiency * 100),
            },
          },
        }))
      }

      // Проверить, есть ли следующий шаг
      const nextStepIndex = currentStepIndex + 1
      if (nextStepIndex < (course.steps?.length || 0)) {
        // Перейти к следующему шагу
        course.currentStepIndex = nextStepIndex
        const nextStep = course.steps[nextStepIndex]
        
        const efficiencyPercent = Math.round(learningResult.finalEfficiency * 100)
        const timeInfo = timeModifiers.combinedMultiplier !== 1.0
          ? `\n⏰ ${timeModifiers.timeOfDayLabel}\n📅 ${timeModifiers.dayOfWeekLabel}`
          : ''
        
        const loadStatus = getCognitiveLoadStatus(cognitiveLoad)
        const cognitiveInfo = cognitiveLoad.currentLoad > 50
          ? `\n🧠 Когнитивная нагрузка: ${loadStatus.label} (${Math.round(cognitiveLoad.currentLoad)}%)`
          : ''
        
        return {
          completed: false,
          summary: [
            `✅ ${currentStep.title} завершён!`,
            `Переходим к следующему модулю...`,
            `Текущий шаг: ${nextStep.title} (${nextStepIndex + 1} из ${totalSteps})`,
            `Общий прогресс: ${Math.round(course.progress * 100)}%`,
            `Эффективность усвоения: ${efficiencyPercent}%`,
            `Время: ${studyHours} ч. • Энергия -${Math.round(10 * learningResult.finalEfficiency)} • Стресс +${Math.round(8 * learningResult.finalEfficiency)} • Настроение -${Math.round(3 * learningResult.finalEfficiency)}`,
            timeInfo,
            cognitiveInfo,
            ...(currentStep.milestoneReward?.message && [`\n${currentStep.milestoneReward.message}`]),
          ].filter(Boolean).join('\n'),
        }
      } else {
        // Все шаги завершены — завершить программу
        this._applyCompletionRewards(program)
        const careerSummary = this._syncCareerProgress()
        education.activeCourses = (education.activeCourses as ActiveCourse[]).filter(item => item.id !== courseId)

        if (this.world && this.world.eventBus) {
          this.world.eventBus.dispatchEvent(new CustomEvent('activity:education', {
            detail: {
              category: 'course_complete',
              title: '🎓 Обучение завершено',
              description: `${program.title} завершён. ${program.rewardText || ''}`.trim(),
              icon: null,
              metadata: {
                programId: program.id,
                programName: program.title,
                skillsGained: program.completionSkillChanges || {},
              },
            },
          }))
        }

        return {
          completed: true,
          summary: [
            `🎓 ${program.title} завершён!`,
            program.rewardText || '',
            careerSummary || '',
          ].filter(Boolean).join('\n'),
        }
      }
    }

    // Шаг ещё не завершён
    const efficiencyPercent = Math.round(learningResult.finalEfficiency * 100)
    const stepProgressPercent = Math.round(currentStep.progressPercent * 100)
    const timeInfo = timeModifiers.combinedMultiplier !== 1.0
      ? `\n⏰ ${timeModifiers.timeOfDayLabel}\n📅 ${timeModifiers.dayOfWeekLabel}`
      : ''

    // Отправить событие о ежедневном прогрессе
    if (this.world && this.world.eventBus) {
      this.world.eventBus.dispatchEvent(new CustomEvent('activity:education', {
        detail: {
          category: 'daily_progress',
          title: `📖 Прогресс обучения: ${course.name}`,
          description: `Шаг: ${currentStep.title} (${currentStepIndex + 1} из ${totalSteps}). Прогресс шага: ${stepProgressPercent}%. Общий прогресс: ${Math.round(course.progress * 100)}%.`,
          icon: null,
          metadata: {
            programId: course.id,
            programName: course.name,
            stepId: currentStep.id,
            stepTitle: currentStep.title,
            stepIndex: currentStepIndex,
            totalSteps,
            stepProgressPercent,
            overallProgressPercent: Math.round(course.progress * 100),
            efficiencyPercent,
            timeMultiplier: timeModifiers.combinedMultiplier,
          },
        },
      }))
    }

    const loadStatus = getCognitiveLoadStatus(cognitiveLoad)
    const cognitiveInfo = cognitiveLoad.currentLoad > 50
      ? `\n🧠 Когнитивная нагрузка: ${loadStatus.label} (${Math.round(cognitiveLoad.currentLoad)}%)`
      : ''
    
    return {
      completed: false,
      summary: [
        `Учебный блок завершён: ${course.name}.`,
        `Текущий шаг: ${currentStep.title} (${currentStepIndex + 1} из ${totalSteps})`,
        `Прогресс шага: ${stepProgressPercent}%`,
        `Общий прогресс: ${Math.round(course.progress * 100)}%`,
        `Эффективность усвоения: ${efficiencyPercent}%`,
        `Время: ${studyHours} ч. • Энергия -${Math.round(10 * learningResult.finalEfficiency)} • Стресс +${Math.round(8 * learningResult.finalEfficiency)} • Настроение -${Math.round(3 * learningResult.finalEfficiency)}`,
        timeInfo,
        cognitiveInfo,
      ].filter(Boolean).join('\n'),
    }
  }

  getEducationPrograms(): EducationProgram[] {
    return this.educationPrograms
  }

  getActiveCourses(): ActiveCourse[] {
    const playerId = PLAYER_ENTITY
    const education = this.world.getComponent(playerId, EDUCATION_COMPONENT) as Record<string, unknown> | null

    if (!education) {
      return []
    }

    return (education.activeCourses as ActiveCourse[]) || []
  }

  getEducationLevel(): string | null {
    const playerId = PLAYER_ENTITY
    const education = this.world.getComponent(playerId, EDUCATION_COMPONENT) as Record<string, unknown> | null

    if (!education) {
      return null
    }

    return education.educationLevel as string
  }

  _applyCompletionRewards(program: EducationProgram): void {
    const playerId = PLAYER_ENTITY
    const education = this.world.getComponent(playerId, EDUCATION_COMPONENT) as Record<string, unknown> | null
    const career = this.world.getComponent(playerId, CAREER_COMPONENT) as Record<string, unknown> | null

    if (program.completionSkillChanges) {
      this._applySkillChanges(program.completionSkillChanges)
    }

    if (program.completionStatChanges) {
      this.statsSystem.applyStatChanges(program.completionStatChanges)
    }

    if (program.educationLevel && education) {
      education.educationLevel = program.educationLevel
      education.institute = 'completed'
    }

    if (program.salaryMultiplierDelta && career) {
      const basePerHour = this._resolveSalaryPerHour(career)
      career.salaryPerHour = Math.round(basePerHour * (1 + program.salaryMultiplierDelta))
      career.salaryPerDay = Math.round((career.salaryPerHour as number) * 8)
      career.salaryPerWeek = Math.round((career.salaryPerHour as number) * 40)
    }
  }

  _syncCareerProgress(): string {
    return ''
  }

  _applySkillChanges(skillChanges: Record<string, number> = {}): void {
    this.skillsSystem.applySkillChanges(skillChanges, 'education')
  }

  _formatMoney(value: number): string {
    return new Intl.NumberFormat('ru-RU').format(value)
  }

  /**
   * Генерирует шаги программы автоматически, если они не определены явно
   * @param program - образовательная программа
   * @returns массив шагов программы
   */
  _generateProgramSteps(program: EducationProgram): ProgramStep[] {
    // Если шаги определены явно, возвращаем их
    if (program.steps && program.steps.length > 0) {
      return program.steps.map(step => ({
        ...step,
        progressPercent: 0,
      }))
    }

    // Генерируем шаги автоматически
    const totalHours = this._resolveCourseHours(program)
    const stepHours = 4 // Каждый шаг занимает 4 часа
    const numSteps = Math.ceil(totalHours / stepHours)
    const steps: ProgramStep[] = []

    for (let i = 0; i < numSteps; i++) {
      const isLastStep = i === numSteps - 1
      const stepHoursActual = isLastStep
        ? totalHours - (stepHours * (numSteps - 1))
        : stepHours

      steps.push({
        id: `${program.id}_step_${i + 1}`,
        title: `Модуль ${i + 1} из ${numSteps}`,
        hoursRequired: stepHoursActual,
        progressPercent: 0,
        // Добавляем milestone-награду для последнего шага
        ...(isLastStep && {
          milestoneReward: {
            message: '🎉 Финальный модуль завершён!',
          },
        }),
      })
    }

    return steps
  }

  _resolveCourseHours(program: Partial<EducationProgram> = {}): number {
    if (typeof program.hoursRequired === 'number' && program.hoursRequired > 0) {
      return program.hoursRequired
    }
    const legacyDays = Math.max(1, Number(program.daysRequired) || 1)
    return legacyDays * 4
  }

  _resolveSalaryPerHour(career: Record<string, unknown> = {}): number {
    if (typeof career.salaryPerHour === 'number' && career.salaryPerHour > 0) {
      return career.salaryPerHour
    }
    if (typeof career.salaryPerDay === 'number' && career.salaryPerDay > 0) {
      return Math.round(career.salaryPerDay / 8)
    }
    if (typeof career.salaryPerWeek === 'number' && career.salaryPerWeek > 0) {
      return Math.round(career.salaryPerWeek / 40)
    }
    return 0
  }
}


