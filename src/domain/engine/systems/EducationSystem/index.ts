import {
  WALLET_COMPONENT,
  EDUCATION_COMPONENT,
  SKILLS_COMPONENT,
  CAREER_COMPONENT,
  TIME_COMPONENT,
  PLAYER_ENTITY,
} from '../../components/index'
import { EDUCATION_PROGRAMS } from '../../../balance/constants/education-programs'
import { SkillsSystem } from '../SkillsSystem'
import { TimeSystem } from '../TimeSystem'
import { StatsSystem } from '../StatsSystem'
import type { GameWorld } from '../../world'
import type { EducationProgram, StatChanges } from '@/domain/balance/types'
import type { CanStartResult, StartResult, AdvanceResult, ActiveCourse } from './index.types'

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
    this.skillsSystem = new SkillsSystem()
    this.skillsSystem.init(world)
    this.statsSystem = new StatsSystem()
    this.statsSystem.init(world)
    this.timeSystem = this._resolveTimeSystem(world)
  }

  private _resolveTimeSystem(world: GameWorld): TimeSystem {
    const existing = world.getSystem(TimeSystem)
    if (existing) return existing
    const created = new TimeSystem()
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

    // Возрастная проверка: minAge по умолчанию 13 (TEEN)
    const minAge = program.minAge ?? 13
    const time = this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, unknown> | null
    const currentAge = time?.currentAge as number | undefined
    if (typeof currentAge === 'number' && currentAge < minAge) {
      return { ok: false, reason: `Эта программа доступна с ${minAge} лет. Сейчас вам ${currentAge}.` }
    }

    if (wallet.money < program.cost) {
      return { ok: false, reason: `Недостаточно денег. Нужно ${this._formatMoney(program.cost)} ₽.` }
    }

    const activeCourses = education.activeCourses as ActiveCourse[] | undefined
    if (activeCourses && activeCourses.length > 0) {
      return { ok: false, reason: 'Сейчас уже идёт обучение. Сначала завершите активный курс.' }
    }

    if (program.educationLevel && education.educationLevel === program.educationLevel) {
      return { ok: false, reason: 'Этот уровень образования уже получен.' }
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

    const studyHours = 4
    this.timeSystem.advanceHours(studyHours, { actionType: 'education' })

    course.daysSpent += 1
    course.hoursSpent = (course.hoursSpent ?? 0) + studyHours
    const courseHoursRequired = course.hoursRequired ?? this._resolveCourseHours(program)
    const effectiveStudyHours = (course.hoursSpent ?? 0) * (modifiers.learningSpeedMultiplier ?? 1)
    course.progress = Math.max(0, Math.min(1, effectiveStudyHours / courseHoursRequired))

    this.statsSystem.applyStatChanges({
      energy: -10,
      stress: 8,
      mood: -3,
    })

    if (effectiveStudyHours < courseHoursRequired) {
      return {
        completed: false,
        summary: [
          `Учебный блок завершён: ${course.name}.`,
          `Прогресс: ${Math.round(course.progress * 100)}%.`,
          `Время: ${studyHours} ч. • Энергия -10 • Стресс +8 • Настроение -3`,
        ].join('\n'),
      }
    }

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
        `${program.title} завершён.`,
        program.rewardText,
        careerSummary || '',
        `Последний учебный блок тоже повлиял на ресурсы: ${studyHours} ч. • Энергия -10 • Стресс +8 • Настроение -3`,
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

