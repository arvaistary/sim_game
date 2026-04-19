import {
  WALLET_COMPONENT,
  EDUCATION_COMPONENT,
  SKILLS_COMPONENT,
  CAREER_COMPONENT,
  TIME_COMPONENT,
  STATS_COMPONENT,
  FURNITURE_COMPONENT,
  COGNITIVE_LOAD_COMPONENT,
  PLAYER_ENTITY,
} from '../../components/index'
import { EDUCATION_PROGRAMS } from '../../../balance/constants/education-programs'
import { SkillsSystem } from '../SkillsSystem'
import { TimeSystem } from '../TimeSystem'
import { StatsSystem } from '../StatsSystem'
import type { GameWorld } from '../../world'
import type { EducationProgram, StatChanges, ProgramStep } from '@/domain/balance/types'
import type { CanStartResult, StartResult, AdvanceResult, ActiveCourse, CompletedProgramRecord } from './index.types'
import { AgeGroup, getAgeGroup } from '@/composables/useAgeRestrictions/age-constants'
import {
  calculateLearningEfficiencyV1,
  getNeedsStateFromComponents,
  type LearningInput,
  EDUCATION_LONG_STEP_ENERGY_BASE,
  ENERGY_EXHAUSTION_THRESHOLD_STUDY,
} from './learning-efficiency'
import { calculateTimeEfficiencyModifiers } from './time-efficiency'
import type { CognitiveLoadComponent } from './cognitive-load'
import {
  createDefaultCognitiveLoadComponent,
  addStudyHours,
  calculateCognitiveLoadPenalty,
  getCognitiveLoadStatus,
  canAddStudyHours,
  resetCognitiveLoad,
  EDUCATION_LONG_PROGRAM_STEP_HOURS,
  COGNITIVE_LOAD_CONSTANTS,
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
    this._repairActiveCourseStepsIfNeeded()
  }

  /**
   * Сейвы без массива steps оставляли активный курс «невидимым» для UI.
   * Восстанавливаем шаги из каталога программ по id курса.
   */
  private _repairActiveCourseStepsIfNeeded(): void {
    const education = this.world.getComponent(PLAYER_ENTITY, EDUCATION_COMPONENT) as Record<string, unknown> | null
    if (!education) return
    const courses = education.activeCourses as ActiveCourse[] | undefined
    if (!Array.isArray(courses) || courses.length === 0) return
    for (const course of courses) {
      if (!course || !course.id) continue
      if (course.steps && course.steps.length > 0) continue
      const program = this.educationPrograms.find(p => p.id === course.id)
      if (program) {
        course.steps = this._generateProgramSteps(program)
      }
    }
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

    if (program.requiresComputer && !this._hasAnyComputer()) {
      return {
        ok: false,
        reason: 'Для этой онлайн-программы нужен компьютер. Купите ноутбук в магазине.',
      }
    }

    if (program.requiresItemId && !this._hasFurnitureItem(program.requiresItemId)) {
      if (program.acquisition === 'shop_only') {
        return {
          ok: false,
          reason: 'Сначала купите этот материал в магазине, затем запускайте обучение из библиотеки.',
        }
      }
      return {
        ok: false,
        reason: `Нужен предмет: ${program.requiresItemId}`,
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

    if (program.preventRepeat) {
      const completed = education.completedPrograms as CompletedProgramRecord[] | undefined
      if (Array.isArray(completed) && completed.some(p => p.id === program.id)) {
        return {
          ok: false,
          reason: `📕 Программа «${program.title}» уже завершена.\n\nПовторное прохождение недоступно.`,
        }
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

    const studyHours = EDUCATION_LONG_PROGRAM_STEP_HOURS
    
    // Рассчитать time-based модификаторы эффективности
    const timeModifiers = calculateTimeEfficiencyModifiers(time as any)
    
    // Получить или создать компонент когнитивной нагрузки
    let cognitiveLoad = this.world.getComponent<CognitiveLoadComponent>(PLAYER_ENTITY, COGNITIVE_LOAD_COMPONENT)
    
    if (!cognitiveLoad) {
      cognitiveLoad = createDefaultCognitiveLoadComponent()
      this.world.addComponent(PLAYER_ENTITY, COGNITIVE_LOAD_COMPONENT, cognitiveLoad as unknown as Record<string, unknown>)
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

    const rawEnergy = stats?.energy ?? 0
    const energyCost = EDUCATION_LONG_STEP_ENERGY_BASE * learningResult.finalEfficiency

    if (rawEnergy < ENERGY_EXHAUSTION_THRESHOLD_STUDY) {
      return {
        completed: false,
        summary: [
          `\u26D4 \u041d\u0435\u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e \u043f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u0435: ${course.name}`,
          '',
          `\u042d\u043d\u0435\u0440\u0433\u0438\u044f \u0441\u043b\u0438\u0448\u043a\u043e\u043c \u043d\u0438\u0437\u043a\u0430\u044f (${Math.round(rawEnergy)}%). \u0414\u043b\u044f \u0437\u0430\u043d\u044f\u0442\u0438\u0439 \u043d\u0443\u0436\u043d\u043e \u043d\u0435 \u043c\u0435\u043d\u044c\u0448\u0435 ${ENERGY_EXHAUSTION_THRESHOLD_STUDY}%.`,
          '\u0418\u0441\u0442\u043e\u0449\u0435\u043d\u0438\u0435 \u043d\u0435 \u043f\u043e\u0437\u0432\u043e\u043b\u044f\u0435\u0442 \u043d\u043e\u0440\u043c\u0430\u043b\u044c\u043d\u043e \u0443\u0447\u0438\u0442\u044c\u0441\u044f.',
          '',
          '\u041e\u0442\u0434\u043e\u0445\u043d\u0438\u0442\u0435 \u0438\u043b\u0438 \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u0435 \u044d\u043d\u0435\u0440\u0433\u0438\u044e \u0434\u0440\u0443\u0433\u0438\u043c\u0438 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f\u043c\u0438.',
        ].join('\n'),
      }
    }

    if (rawEnergy - energyCost <= 0) {
      return {
        completed: false,
        summary: [
          `\u26D4 \u041d\u0435\u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e \u043f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u0435: ${course.name}`,
          '',
          `\u041d\u0435\u0434\u043e\u0441\u0442\u0430\u0442\u043e\u0447\u043d\u043e \u044d\u043d\u0435\u0440\u0433\u0438\u0438 \u0434\u043b\u044f \u044d\u0442\u043e\u0433\u043e \u0448\u0430\u0433\u0430: \u0441\u0435\u0439\u0447\u0430\u0441 ${Math.round(rawEnergy)}%, \u0440\u0430\u0441\u0445\u043e\u0434 ~${energyCost.toFixed(1)} - \u0437\u0430\u043f\u0430\u0441 \u0443\u0448\u0451\u043b \u0431\u044b \u0432 \u043d\u043e\u043b\u044c \u0438\u043b\u0438 \u043d\u0438\u0436\u0435.`,
          '',
          '\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u0435 \u044d\u043d\u0435\u0440\u0433\u0438\u044e.',
        ].join('\n'),
      }
    }

    // Продвинуть время с учётом эффективности
    this.timeSystem.advanceHours(studyHours, { actionType: 'education' })

    // Проверить, можно ли добавить учебные часы (накопительная модель)
    const canStudyCheck = canAddStudyHours(cognitiveLoad, studyHours)
    if (!canStudyCheck.canStudy) {
      const loadStatus = getCognitiveLoadStatus(cognitiveLoad)
      return {
        completed: false,
        summary: [
          `⛔ Невозможно продолжить обучение: ${course.name}`,
          '',
          canStudyCheck.reason,
          '',
          `Текущее состояние: ${loadStatus.label}`,
          loadStatus.description,
          loadStatus.advice,
          '',
          `Учёба в этом цикле: ${cognitiveLoad.studyHoursSinceLastSleep} ч. из ${COGNITIVE_LOAD_CONSTANTS.MAX_STUDY_HOURS_CYCLE} ч. макс.`,
        ].join('\n'),
      }
    }

    // Обновить когнитивную нагрузку
    addStudyHours(cognitiveLoad, studyHours)
    this.world.updateComponent(PLAYER_ENTITY, COGNITIVE_LOAD_COMPONENT, cognitiveLoad as unknown as Record<string, unknown>)

    const courseHoursCap = course.hoursRequired ?? program.hoursRequired ?? 0
    const prevHoursSpent = course.hoursSpent ?? 0
    course.hoursSpent =
      courseHoursCap > 0
        ? Math.min(courseHoursCap, prevHoursSpent + studyHours)
        : prevHoursSpent + studyHours

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
      energy: -energyCost,
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

        const completedPrograms: CompletedProgramRecord[] = Array.isArray(education.completedPrograms)
          ? [...(education.completedPrograms as CompletedProgramRecord[])]
          : []
        const record: CompletedProgramRecord = {
          id: program.id,
          name: program.title,
          typeLabel: program.typeLabel,
          completedAtGameDay: (time.gameDays as number) ?? 0,
        }
        const existingIdx = completedPrograms.findIndex(p => p.id === program.id)
        if (existingIdx >= 0) completedPrograms[existingIdx] = record
        else completedPrograms.unshift(record)
        education.completedPrograms = completedPrograms

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

  private _hasFurnitureItem(itemId: string): boolean {
    const items = this.world.getComponent(PLAYER_ENTITY, FURNITURE_COMPONENT) as Array<Record<string, unknown>> | null
    if (!Array.isArray(items)) return false
    return items.some(item => item?.id === itemId)
  }

  private _hasAnyComputer(): boolean {
    const computerIds = ['study_laptop', 'desktop_pc', 'computer']
    return computerIds.some(id => this._hasFurnitureItem(id))
  }
}


