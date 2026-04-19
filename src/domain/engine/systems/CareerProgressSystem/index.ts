import {
  CAREER_COMPONENT,
  WORK_COMPONENT,
  EDUCATION_COMPONENT,
  TIME_COMPONENT,
  PLAYER_ENTITY,
} from '../../components/index'
import { CAREER_JOBS } from '../../../balance/constants/career-jobs'
import { SkillsSystem } from '../SkillsSystem'
import type { GameWorld } from '../../world'
import type { CareerJob } from '@/domain/balance/types'
import type { CareerTrackEntry, ChangeCareerResult } from './index.types'
import { getEducationRank, getEducationLabelByRank, formatMoney, toFiniteNumber } from '../../utils/career-helpers'
import type { SystemContext } from '@/domain/game-facade/index.types'
import { telemetryInc } from '../../utils/telemetry'

/**
 * Система управления карьерным прогрессом
 * Отслеживает требования и автоматически повышает при достижении условий
 */
export class CareerProgressSystem {
  private world!: GameWorld
  private skillsSystem!: SkillsSystem
  private careerJobs: CareerJob[]

  constructor() {
    this.careerJobs = CAREER_JOBS as CareerJob[]
  }

  init(world: GameWorld): void {
    this.world = world
  }

  /** Вызывается из getSystemContext после сборки контекста */
  wireFromContext(ctx: SystemContext): void {
    this.skillsSystem = ctx.skills
  }

  getCareerTrack(): CareerTrackEntry[] {
    const playerId = PLAYER_ENTITY
    const education = this.world.getComponent(playerId, EDUCATION_COMPONENT) as Record<string, unknown> | null
    const career = this.world.getComponent(playerId, CAREER_COMPONENT) as Record<string, unknown> | null

    if (!education || !career) {
      return []
    }

    const professionalism = this.skillsSystem.getSkillLevel('professionalism')
    const modifiers = this.skillsSystem.getModifiers()
    const educationRank = getEducationRank(education.educationLevel as string)
    const currentJobId = career.id

    return this.careerJobs.map(job => {
      const salaryMultiplier = toFiniteNumber(modifiers.salaryMultiplier, 1)
      const baseSalaryPerHour = toFiniteNumber(job.salaryPerHour, Math.round(toFiniteNumber(job.salaryPerDay, 0) / 8))
      const baseSalaryPerDay = toFiniteNumber(job.salaryPerDay, baseSalaryPerHour * 8)

      return {
        ...job,
        current: currentJobId === job.id,
        unlocked: professionalism >= job.minProfessionalism && educationRank >= job.minEducationRank,
        missingProfessionalism: Math.max(0, job.minProfessionalism - professionalism),
        educationRequiredLabel: getEducationLabelByRank(job.minEducationRank),
        effectiveSalaryPerHour: Math.round(baseSalaryPerHour * salaryMultiplier),
        effectiveSalaryPerDay: Math.round(baseSalaryPerDay * salaryMultiplier),
      }
    })
  }

  syncCareerProgress(): string {
    const playerId = PLAYER_ENTITY
    const education = this.world.getComponent(playerId, EDUCATION_COMPONENT) as Record<string, unknown> | null
    const career = this.world.getComponent(playerId, CAREER_COMPONENT) as Record<string, unknown> | null
    const work = this.world.getComponent(playerId, WORK_COMPONENT) as Record<string, unknown> | null

    if (!education || !career) {
      return ''
    }

    const professionalism = this.skillsSystem.getSkillLevel('professionalism')
    const educationRank = getEducationRank(education.educationLevel as string)
    const currentLevel = (career.level as number) ?? 1
    const oldPosition = (career.name as string) ?? 'Неизвестно'

    const unlocked = this.careerJobs
      .filter(job => professionalism >= job.minProfessionalism && educationRank >= job.minEducationRank)
    const unlockedJob = unlocked.length > 0 ? unlocked[unlocked.length - 1] : undefined

    if (!unlockedJob || unlockedJob.level <= currentLevel) {
      return ''
    }

    telemetryInc('career_promotion')

    if (this.world && this.world.eventBus) {
      this.world.eventBus.dispatchEvent(new CustomEvent('activity:career', {
        detail: {
          category: 'promotion',
          title: '📈 Повышение!',
          description: `${oldPosition} → ${unlockedJob.name}. Новая ставка: ${formatMoney(unlockedJob.salaryPerHour)} ₽/ч`,
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
    this.syncCurrentJob()

    return `Карьерный рост: новая должность «${unlockedJob.name}», ставка ${formatMoney(unlockedJob.salaryPerHour)} ₽ в час.`
  }

  changeCareer(jobId: string): ChangeCareerResult {
    const playerId = PLAYER_ENTITY
    const career = this.world.getComponent(playerId, CAREER_COMPONENT) as Record<string, unknown> | null
    const work = this.world.getComponent(playerId, WORK_COMPONENT) as Record<string, unknown> | null
    const education = this.world.getComponent(playerId, EDUCATION_COMPONENT) as Record<string, unknown> | null

    if (!career || !education) {
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

    const professionalism = this.skillsSystem.getSkillLevel('professionalism')
    const educationRank = getEducationRank(education.educationLevel as string)

    if (professionalism < job.minProfessionalism) {
      return {
        success: false,
        reason: `Недостаточно профессионализма. Нужно ${job.minProfessionalism}, сейчас ${professionalism}.`
      }
    }

    if (educationRank < job.minEducationRank) {
      return {
        success: false,
        reason: `Недостаточно образования. Нужно ${getEducationLabelByRank(job.minEducationRank)}.`
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
      employed: true,
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
        employed: true,
      })
    }
    this.syncCurrentJob()

    telemetryInc('career_change')
    if (isDemotion) {
      telemetryInc('career_demotion')
    }

    if (this.world && this.world.eventBus) {
      this.world.eventBus.dispatchEvent(new CustomEvent('activity:career', {
        detail: {
          category: isDemotion ? 'demotion' : 'promotion',
          title: isDemotion ? '📉 Понижение' : '📈 Смена должности',
          description: `${oldPosition} → ${job.name}. Ставка: ${formatMoney(job.salaryPerHour)} ₽/ч`,
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
      message: `Вы устроились на должность «${job.name}», ставка ${formatMoney(job.salaryPerHour)} ₽ в час.`
    }
  }

  getCurrentJob(): Record<string, unknown> | null {
    const playerId = PLAYER_ENTITY
    const career = this.world.getComponent(playerId, CAREER_COMPONENT) as Record<string, unknown> | null
    return career || null
  }

  /** Единственный владелец синхронизации currentJob в career-компоненте */
  syncCurrentJob(): void {
    const playerId = PLAYER_ENTITY
    const career = this.world.getComponent(playerId, CAREER_COMPONENT) as Record<string, unknown> | null
    if (!career) return

    career.currentJob = {
      id: career.id,
      name: career.name,
      schedule: career.schedule ?? '5/2',
      employed: career.employed ?? Boolean(career.id),
      level: career.level ?? 1,
      salaryPerHour: career.salaryPerHour ?? 0,
      salaryPerDay: career.salaryPerDay ?? 0,
      salaryPerWeek: career.salaryPerWeek ?? 0,
      requiredHoursPerWeek: career.requiredHoursPerWeek ?? 0,
      workedHoursCurrentWeek: career.workedHoursCurrentWeek ?? 0,
      pendingSalaryWeek: career.pendingSalaryWeek ?? 0,
      totalWorkedHours: career.totalWorkedHours ?? 0,
      daysAtWork: career.daysAtWork ?? 0,
    }
  }

  quitCareer(): { success: boolean; message: string } {
    const playerId = PLAYER_ENTITY
    const career = this.world.getComponent(playerId, CAREER_COMPONENT) as Record<string, unknown> | null
    const work = this.world.getComponent(playerId, WORK_COMPONENT) as Record<string, unknown> | null

    if (!career || !career.id) {
      return { success: false, message: 'Вы и так без работы' }
    }

    const oldPosition = (career.name as string) ?? 'Неизвестно'

    Object.assign(career, {
      id: null,
      name: 'Безработный',
      level: 0,
      salaryPerHour: 0,
      salaryPerDay: 0,
      salaryPerWeek: 0,
      daysAtWork: 0,
      workedHoursCurrentWeek: 0,
      employed: false,
    })

    if (work) {
      Object.assign(work, {
        id: null,
        name: 'Безработный',
        level: 0,
        salaryPerHour: 0,
        salaryPerDay: 0,
        salaryPerWeek: 0,
        schedule: '5/2',
        daysAtWork: 0,
        workedHoursCurrentWeek: 0,
        employed: false,
      })
    }

    this.syncCurrentJob()

    telemetryInc('career_quit')

    if (this.world && this.world.eventBus) {
      this.world.eventBus.dispatchEvent(new CustomEvent('activity:career', {
        detail: {
          category: 'quit',
          title: '🚪 Увольнение',
          description: `Вы уволились с должности "${oldPosition}"`,
          icon: null,
          metadata: {
            oldPosition,
          },
        },
      }))
    }

    return {
      success: true,
      message: `Вы уволились с должности "${oldPosition}". Теперь вы безработный.`,
    }
  }
}


