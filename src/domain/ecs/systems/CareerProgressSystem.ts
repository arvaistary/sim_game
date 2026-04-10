import {
  CAREER_COMPONENT,
  WORK_COMPONENT,
  SKILLS_COMPONENT,
  EDUCATION_COMPONENT,
  TIME_COMPONENT,
  PLAYER_ENTITY,
} from '../components/index'
import { CAREER_JOBS } from '../../balance/career-jobs'
import { SkillsSystem } from './SkillsSystem'
import type { ECSWorld } from '../world'
import type { CareerJob } from '@/domain/balance/types'

interface CareerTrackEntry extends CareerJob {
  current: boolean
  unlocked: boolean
  missingProfessionalism: number
  educationRequiredLabel: string
  effectiveSalaryPerHour: number
  effectiveSalaryPerDay: number
}

interface ChangeCareerResult {
  success: boolean
  reason?: string
  message?: string
}

/**
 * Система управления карьерным прогрессом
 * Отслеживает требования и автоматически повышает при достижении условий
 */
export class CareerProgressSystem {
  private world!: ECSWorld
  private skillsSystem!: SkillsSystem
  private careerJobs: CareerJob[]

  constructor() {
    this.careerJobs = CAREER_JOBS as CareerJob[]
  }

  init(world: ECSWorld): void {
    this.world = world
    this.skillsSystem = new SkillsSystem()
    this.skillsSystem.init(world)
  }

  getCareerTrack(): CareerTrackEntry[] {
    const playerId = PLAYER_ENTITY
    const skills = this.world.getComponent(playerId, SKILLS_COMPONENT) as Record<string, number> | null
    const education = this.world.getComponent(playerId, EDUCATION_COMPONENT) as Record<string, unknown> | null
    const career = this.world.getComponent(playerId, CAREER_COMPONENT) as Record<string, unknown> | null

    if (!skills || !education || !career) {
      return []
    }

    const professionalism = skills.professionalism ?? 0
    const modifiers = this.skillsSystem.getModifiers()
    const educationRank = this._getEducationRank(education.educationLevel as string)
    const currentJobId = career.id

    return this.careerJobs.map(job => ({
      ...job,
      current: currentJobId === job.id,
      unlocked: professionalism >= job.minProfessionalism && educationRank >= job.minEducationRank,
      missingProfessionalism: Math.max(0, job.minProfessionalism - professionalism),
      educationRequiredLabel: this._getEducationLabelByRank(job.minEducationRank),
      effectiveSalaryPerHour: Math.round((job.salaryPerHour ?? Math.round((job.salaryPerDay ?? 0) / 8)) * (modifiers.salaryMultiplier ?? 1)),
      effectiveSalaryPerDay: Math.round((job.salaryPerDay ?? ((job.salaryPerHour ?? 0) * 8)) * (modifiers.salaryMultiplier ?? 1)),
    }))
  }

  syncCareerProgress(): string {
    const playerId = PLAYER_ENTITY
    const skills = this.world.getComponent(playerId, SKILLS_COMPONENT) as Record<string, number> | null
    const education = this.world.getComponent(playerId, EDUCATION_COMPONENT) as Record<string, unknown> | null
    const career = this.world.getComponent(playerId, CAREER_COMPONENT) as Record<string, unknown> | null
    const work = this.world.getComponent(playerId, WORK_COMPONENT) as Record<string, unknown> | null

    if (!skills || !education || !career) {
      return ''
    }

    const professionalism = skills.professionalism ?? 0
    const educationRank = this._getEducationRank(education.educationLevel as string)
    const currentLevel = (career.level as number) ?? 1
    const oldPosition = (career.name as string) ?? 'Неизвестно'

    const unlocked = this.careerJobs
      .filter(job => professionalism >= job.minProfessionalism && educationRank >= job.minEducationRank)
    const unlockedJob = unlocked.length > 0 ? unlocked[unlocked.length - 1] : undefined

    if (!unlockedJob || unlockedJob.level <= currentLevel) {
      return ''
    }

    if (this.world && this.world.eventBus) {
      this.world.eventBus.dispatchEvent(new CustomEvent('activity:career', {
        detail: {
          category: 'promotion',
          title: '📈 Повышение!',
          description: `${oldPosition} → ${unlockedJob.name}. Новая ставка: ${this._formatMoney(unlockedJob.salaryPerHour)} ₽/ч`,
          icon: null,
          metadata: {
            oldPosition,
            newPosition: unlockedJob.name,
            newSalary: unlockedJob.salaryPerHour,
          },
        },
      }))
    }

    Object.assign(career, {
      id: unlockedJob.id,
      name: unlockedJob.name,
      level: unlockedJob.level,
      salaryPerHour: unlockedJob.salaryPerHour,
      salaryPerDay: unlockedJob.salaryPerDay,
      salaryPerWeek: unlockedJob.salaryPerWeek,
      daysAtWork: (career.daysAtWork as number) ?? 0,
    })
    if (work) {
      Object.assign(work, {
        id: unlockedJob.id,
        name: unlockedJob.name,
        level: unlockedJob.level,
        salaryPerHour: unlockedJob.salaryPerHour,
        salaryPerDay: unlockedJob.salaryPerDay,
        salaryPerWeek: unlockedJob.salaryPerWeek,
        schedule: unlockedJob.schedule ?? (work.schedule as string) ?? '5/2',
      })
    }

    return `Карьерный рост: новая должность «${unlockedJob.name}», ставка ${this._formatMoney(unlockedJob.salaryPerHour)} ₽ в час.`
  }

  changeCareer(jobId: string): ChangeCareerResult {
    const playerId = PLAYER_ENTITY
    const career = this.world.getComponent(playerId, CAREER_COMPONENT) as Record<string, unknown> | null
    const work = this.world.getComponent(playerId, WORK_COMPONENT) as Record<string, unknown> | null
    const skills = this.world.getComponent(playerId, SKILLS_COMPONENT) as Record<string, number> | null
    const education = this.world.getComponent(playerId, EDUCATION_COMPONENT) as Record<string, unknown> | null

    if (!career || !skills || !education) {
      return { success: false, reason: 'Не удалось загрузить данные персонажа' }
    }

    const job = this.careerJobs.find(j => j.id === jobId)
    if (!job) {
      return { success: false, reason: 'Работа не найдена' }
    }

    const time = this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, unknown> | null
    const eventState = time?.eventState as Record<string, unknown> | undefined
    const blockedMap = eventState?.jobRehireBlockedUntilWeekByJobId as Record<string, number> | undefined
    const blockedUntil = blockedMap?.[jobId]
    if (typeof blockedUntil === 'number' && typeof (time?.gameWeeks as number) === 'number' && (time!.gameWeeks as number) < blockedUntil) {
      return {
        success: false,
        reason: `Эту должность пока нельзя взять снова: недоступна до начала ${blockedUntil}-й игровой недели (сейчас неделя ${time!.gameWeeks}).`,
      }
    }

    const professionalism = skills.professionalism ?? 0
    const educationRank = this._getEducationRank(education.educationLevel as string)

    if (professionalism < job.minProfessionalism) {
      return {
        success: false,
        reason: `Недостаточно профессионализма. Нужно ${job.minProfessionalism}, сейчас ${professionalism}.`
      }
    }

    if (educationRank < job.minEducationRank) {
      return {
        success: false,
        reason: `Недостаточно образования. Нужно ${this._getEducationLabelByRank(job.minEducationRank)}.`
      }
    }

    const oldPosition = (career.name as string) ?? 'Неизвестно'
    const isDemotion = job.level < ((career.level as number) ?? 1)

    Object.assign(career, {
      id: job.id,
      name: job.name,
      level: job.level,
      salaryPerHour: job.salaryPerHour,
      salaryPerDay: job.salaryPerDay,
      salaryPerWeek: job.salaryPerWeek,
      daysAtWork: 0,
      workedHoursCurrentWeek: 0,
    })
    if (work) {
      Object.assign(work, {
        id: job.id,
        name: job.name,
        level: job.level,
        salaryPerHour: job.salaryPerHour,
        salaryPerDay: job.salaryPerDay,
        salaryPerWeek: job.salaryPerWeek,
        schedule: job.schedule ?? '5/2',
        daysAtWork: 0,
        workedHoursCurrentWeek: 0,
      })
    }

    if (this.world && this.world.eventBus) {
      this.world.eventBus.dispatchEvent(new CustomEvent('activity:career', {
        detail: {
          category: isDemotion ? 'demotion' : 'promotion',
          title: isDemotion ? '📉 Понижение' : '📈 Смена должности',
          description: `${oldPosition} → ${job.name}. Ставка: ${this._formatMoney(job.salaryPerHour)} ₽/ч`,
          icon: null,
          metadata: {
            oldPosition,
            newPosition: job.name,
            newSalary: job.salaryPerHour,
          },
        },
      }))
    }

    return {
      success: true,
      message: `Вы устроились на должность «${job.name}», ставка ${this._formatMoney(job.salaryPerHour)} ₽ в час.`
    }
  }

  getCurrentJob(): Record<string, unknown> | null {
    const playerId = PLAYER_ENTITY
    const career = this.world.getComponent(playerId, CAREER_COMPONENT) as Record<string, unknown> | null
    return career || null
  }

  _getEducationRank(level: string): number {
    const map: Record<string, number> = {
      'Среднее': 0,
      'Высшее': 1,
      'MBA': 2,
    }
    return map[level] ?? 0
  }

  _getEducationLabelByRank(rank: number): string {
    const map: Record<number, string> = {
      0: 'Среднее',
      1: 'Высшее',
      2: 'MBA',
    }
    return map[rank] ?? 'Среднее'
  }

  _formatMoney(value: number): string {
    return new Intl.NumberFormat('ru-RU').format(value)
  }
}

