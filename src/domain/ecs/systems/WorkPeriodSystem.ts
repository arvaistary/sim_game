import {
  TIME_COMPONENT,
  STATS_COMPONENT,
  WORK_COMPONENT,
  WALLET_COMPONENT,
  CAREER_COMPONENT,
  SKILLS_COMPONENT,
  EDUCATION_COMPONENT,
  PLAYER_ENTITY,
} from '../components/index'
import { CAREER_JOBS } from '../../balance/career-jobs'
import { createWeeklyJobDismissalQueuedEvent } from '../../balance/game-events'
import { SkillsSystem } from './SkillsSystem'
import { summarizeStatChanges } from '../policies/stat-change-summary'
import type { ECSWorld } from '../world'
import type { StatChanges } from '@/domain/balance/types'

interface EventChoice {
  label?: string
  outcome?: string
  statChanges?: StatChanges
  salaryMultiplier?: number
  permanentSalaryMultiplier?: number
}

/**
 * Система обработки рабочих периодов
 */
export class WorkPeriodSystem {
  private world!: ECSWorld
  private skillsSystem!: SkillsSystem

  private baseStatChangesPerHour: Record<string, number> = {
    hunger: -2.2,
    energy: -2.7,
    stress: 1.9,
    mood: -1.0,
  }

  init(world: ECSWorld): void {
    this.world = world
    this.skillsSystem = new SkillsSystem()
    this.skillsSystem.init(world)
  }

  handleWeekRollover(newWeekNumber: number): void {
    const playerId = PLAYER_ENTITY
    const timeComponent = this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, unknown> | null
    const work = this.world.getComponent(playerId, WORK_COMPONENT) as Record<string, unknown> | null
    if (!timeComponent || !work) return

    const eventState = timeComponent.eventState as Record<string, unknown> | undefined
    if (!eventState || typeof eventState !== 'object') {
      timeComponent.eventState = {}
    }

    this._pruneExpiredJobRehireBlocks(timeComponent as Record<string, unknown>)

    const hasJob = Boolean(work.id && work.employed !== false)
    if (!hasJob) {
      work.workedHoursCurrentWeek = 0
      const careerEmpty = this.world.getComponent(playerId, CAREER_COMPONENT) as Record<string, unknown> | null
      if (careerEmpty) careerEmpty.workedHoursCurrentWeek = 0
      return
    }

    const required = Math.max(0, Number(work.requiredHoursPerWeek) || 40)
    const worked = Math.max(0, Number(work.workedHoursCurrentWeek) || 0)

    if (worked < required) {
      this._dismissForUnderwork({
        jobId: work.id as string,
        jobName: (work.name as string) || (work.id as string),
        newWeekNumber,
        worked,
        required,
        timeComponent: timeComponent as Record<string, unknown>,
      })
    }

    work.workedHoursCurrentWeek = 0
    const career = this.world.getComponent(playerId, CAREER_COMPONENT) as Record<string, unknown> | null
    if (career) career.workedHoursCurrentWeek = 0
  }

  _pruneExpiredJobRehireBlocks(timeComponent: Record<string, unknown>): void {
    const eventState = timeComponent.eventState as Record<string, unknown> | undefined
    const map = eventState?.jobRehireBlockedUntilWeekByJobId as Record<string, number> | undefined
    if (!map || typeof map !== 'object') return
    const currentWeek = (timeComponent.gameWeeks as number) ?? 1
    for (const jobId of Object.keys(map)) {
      const until = map[jobId]
      if (typeof until === 'number' && currentWeek >= until) {
        delete map[jobId]
      }
    }
  }

  _dismissForUnderwork(params: {
    jobId: string
    jobName: string
    newWeekNumber: number
    worked: number
    required: number
    timeComponent: Record<string, unknown>
  }): void {
    const { jobId, jobName, newWeekNumber, worked, required, timeComponent } = params
    const playerId = PLAYER_ENTITY
    const work = this.world.getComponent(playerId, WORK_COMPONENT) as Record<string, unknown>
    const career = this.world.getComponent(playerId, CAREER_COMPONENT) as Record<string, unknown> | null

    const eventState = timeComponent.eventState as Record<string, unknown>
    if (!(eventState.jobRehireBlockedUntilWeekByJobId as Record<string, number>) || typeof eventState.jobRehireBlockedUntilWeekByJobId !== 'object') {
      eventState.jobRehireBlockedUntilWeekByJobId = {}
    }
    ;(eventState.jobRehireBlockedUntilWeekByJobId as Record<string, number>)[jobId] = newWeekNumber + 1

    const preservedDays = (work?.daysAtWork as number) ?? 0
    const preservedTotal = (work?.totalWorkedHours as number) ?? 0

    const unemployed: Record<string, unknown> = {
      id: null,
      name: 'Безработный',
      schedule: '—',
      employed: false,
      level: 0,
      salaryPerHour: 0,
      salaryPerDay: 0,
      salaryPerWeek: 0,
      requiredHoursPerWeek: 0,
      workedHoursCurrentWeek: 0,
      daysAtWork: preservedDays,
      totalWorkedHours: preservedTotal,
    }

    Object.assign(work, unemployed)
    if (career) {
      Object.assign(career, {
        ...unemployed,
        daysAtWork: (career.daysAtWork as number) ?? preservedDays,
        totalWorkedHours: (career.totalWorkedHours as number) ?? preservedTotal,
      })
    }

    // Queue dismissal event
    const systems = this.world.systems as Array<Record<string, unknown>>
    const eventQueue = systems.find(s => typeof s.queuePendingEvent === 'function') as { queuePendingEvent: (event: unknown) => void } | undefined
    if (eventQueue) {
      eventQueue.queuePendingEvent(
        createWeeklyJobDismissalQueuedEvent({
          jobName,
          worked,
          required,
          newWeekNumber,
          jobId,
        }),
      )
    }

    if (this.world?.eventBus) {
      this.world.eventBus.dispatchEvent(new CustomEvent('activity:career', {
        detail: {
          category: 'dismissal',
          title: '📤 Увольнение',
          description: `Недобор часов (${worked}/${required} ч). Потеряна должность «${jobName}». Повторный найм на неё недоступен следующую неделю.`,
          icon: null,
          metadata: { jobId, jobName, worked, required, week: newWeekNumber },
        },
      }))
    }
  }

  applyWorkShift(workHours = 8, eventChoice: EventChoice | null = null): string {
    const playerId = PLAYER_ENTITY

    const workComponent = this.world.getComponent(playerId, WORK_COMPONENT) as Record<string, unknown> | null
    const walletComponent = this.world.getComponent(playerId, WALLET_COMPONENT) as Record<string, number> | null
    const statsComponent = this.world.getComponent(playerId, STATS_COMPONENT) as Record<string, number> | null
    const timeComponent = this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, unknown> | null

    if (!workComponent || !walletComponent || !statsComponent || !timeComponent) {
      console.error('Missing required components for work period')
      return ''
    }

    if (!workComponent.id || workComponent.employed === false) {
      return ''
    }

    const systems = this.world.systems as Array<Record<string, unknown>>
    const timeSystem = systems.find((system) => typeof system.advanceHours === 'function') as Record<string, unknown> | undefined
    if (timeSystem?.normalizeTimeComponent) {
      ;(timeSystem.normalizeTimeComponent as (tc: Record<string, unknown>) => void)(timeComponent)
    }

    const jobRequired = Math.max(0, Number(workComponent.requiredHoursPerWeek) || 0)
    const jobWorked = Math.max(0, Number(workComponent.workedHoursCurrentWeek) || 0)
    const jobHoursLeft = jobRequired > 0 ? Math.max(0, jobRequired - jobWorked) : Number.POSITIVE_INFINITY

    if (jobRequired > 0 && workHours > jobHoursLeft) {
      return [
        'Смена не проведена.',
        `По договору на этой неделе по работе осталось ${jobHoursLeft} ч. из нормы ${jobRequired} ч.`,
      ].join('\n')
    }

    const weekLeft = (timeComponent.weekHoursRemaining as number) ?? 168
    if (workHours > weekLeft) {
      return ['Смена не проведена.', `В текущей неделе осталось ${weekLeft} ч. свободного времени.`].join('\n')
    }

    const modifiers = this.skillsSystem.getModifiers()
    const baseSalaryPerHour = this._resolveSalaryPerHour(workComponent)
    const effectiveSalaryPerHour = Math.round(baseSalaryPerHour * (modifiers.salaryMultiplier ?? 1) * (modifiers.workEfficiencyMultiplier ?? 1))
    const totalSalary = Math.round(effectiveSalaryPerHour * workHours)

    const totalBaseStatChanges: Record<string, number> = {}
    Object.entries(this.baseStatChangesPerHour).forEach(([key, value]) => {
      totalBaseStatChanges[key] = Math.round(value * workHours)
    })
    totalBaseStatChanges.hunger = Math.round(totalBaseStatChanges.hunger * (modifiers.hungerDrainMultiplier ?? 1))
    totalBaseStatChanges.energy = Math.round(totalBaseStatChanges.energy * (modifiers.energyDrainMultiplier ?? 1))
    totalBaseStatChanges.stress = Math.round(totalBaseStatChanges.stress * (modifiers.stressGainMultiplier ?? 1))

    const eventStatChanges = eventChoice?.statChanges ?? {}
    const combinedStatChanges = this._mergeStatChanges(totalBaseStatChanges, eventStatChanges as Record<string, number>)

    const eventSalaryBonus = Math.round(effectiveSalaryPerHour * workHours * (eventChoice?.salaryMultiplier ?? 0))
    const totalSalaryWithBonus = totalSalary + eventSalaryBonus

    walletComponent.money += totalSalaryWithBonus
    walletComponent.totalEarnings += totalSalaryWithBonus

    workComponent.daysAtWork = ((workComponent.daysAtWork as number) ?? 0) + Math.max(1, Math.round(workHours / 8))
    workComponent.workedHoursCurrentWeek = ((workComponent.workedHoursCurrentWeek as number) ?? 0) + workHours
    workComponent.totalWorkedHours = ((workComponent.totalWorkedHours as number) ?? 0) + workHours

    const careerComponent = this.world.getComponent(playerId, CAREER_COMPONENT) as Record<string, unknown> | null
    if (careerComponent) {
      careerComponent.workedHoursCurrentWeek = workComponent.workedHoursCurrentWeek
    }

    const lifetimeStats = this.world.getComponent(playerId, 'lifetimeStats') as Record<string, number> | null
    if (lifetimeStats) {
      lifetimeStats.totalWorkDays = (lifetimeStats.totalWorkDays ?? 0) + Math.max(1, Math.round(workHours / 8))
      lifetimeStats.totalWorkHours = (lifetimeStats.totalWorkHours ?? 0) + workHours
    }

    this._applyStatChanges(statsComponent, combinedStatChanges)

    if (eventChoice?.permanentSalaryMultiplier) {
      workComponent.salaryPerHour = Math.round(baseSalaryPerHour * (1 + eventChoice.permanentSalaryMultiplier))
      workComponent.salaryPerDay = Math.round((workComponent.salaryPerHour as number) * 8)
      workComponent.salaryPerWeek = Math.round((workComponent.salaryPerHour as number) * 40)
    }

    if (timeSystem) {
      ;(timeSystem.advanceHours as (h: number, opts: Record<string, unknown>) => void)(workHours, { actionType: 'work_shift' })
    } else {
      timeComponent.totalHours = ((timeComponent.totalHours as number) ?? ((timeComponent.gameDays as number) ?? 0) * 24) + workHours
    }

    const careerUpdateSummary = this._syncCareerProgress()

    if (this.world && this.world.eventBus) {
      this.world.eventBus.dispatchEvent(new CustomEvent('activity:action', {
        detail: {
          category: 'work',
          title: '💼 Отработана смена',
          description: `Отработано ${workHours} ч. Заработано ${this._formatMoney(totalSalaryWithBonus)} ₽`,
          icon: null,
          metadata: {
            hoursWorked: workHours,
            earned: totalSalaryWithBonus,
            jobId: workComponent.id,
            jobName: workComponent.name,
          },
        },
      }))
    }

    return this._buildWorkPeriodSummary(workHours, totalSalaryWithBonus, combinedStatChanges, eventChoice, careerUpdateSummary)
  }

  applyWorkPeriodResult(workDays: number, eventChoice: EventChoice | null = null): string {
    const days = Math.max(1, Number(workDays) || 1)
    return this.applyWorkShift(days * 8, eventChoice)
  }

  _buildWorkPeriodSummary(workHours: number, salary: number, statChanges: Record<string, number>, eventChoice: EventChoice | null, careerUpdateSummary: string): string {
    const lines = [
      `Рабочая смена завершена: ${workHours} ч.`,
      `Выплата: ${this._formatMoney(salary)} ₽.`,
      this._summarizeStatChanges(statChanges),
    ]

    if (eventChoice) {
      lines.push(`Событие: ${eventChoice.label} — ${eventChoice.outcome}`)
    }

    if (careerUpdateSummary) {
      lines.push(careerUpdateSummary)
    }

    return lines.filter(Boolean).join('\n')
  }

  _syncCareerProgress(): string {
    const playerId = PLAYER_ENTITY
    const skillsComponent = this.world.getComponent(playerId, SKILLS_COMPONENT) as Record<string, number> | null
    const educationComponent = this.world.getComponent(playerId, EDUCATION_COMPONENT) as Record<string, unknown> | null
    const careerComponent = this.world.getComponent(playerId, CAREER_COMPONENT) as Record<string, unknown> | null

    if (!skillsComponent || !educationComponent || !careerComponent) {
      return ''
    }

    const professionalism = skillsComponent.professionalism ?? 0
    const educationRank = this._getEducationRank(educationComponent.educationLevel as string)
    const currentLevel = (careerComponent.level as number) ?? 1

    const eligibleJobs = CAREER_JOBS
      .filter(job => professionalism >= job.minProfessionalism && educationRank >= job.minEducationRank)
    const unlockedJob = eligibleJobs[eligibleJobs.length - 1]

    if (!unlockedJob || unlockedJob.level <= currentLevel) {
      return ''
    }

    Object.assign(careerComponent, {
      id: unlockedJob.id,
      name: unlockedJob.name,
      level: unlockedJob.level,
      salaryPerHour: unlockedJob.salaryPerHour,
      salaryPerDay: unlockedJob.salaryPerDay,
      salaryPerWeek: unlockedJob.salaryPerWeek,
      daysAtWork: careerComponent.daysAtWork ?? 0,
      workedHoursCurrentWeek: careerComponent.workedHoursCurrentWeek ?? 0,
    })

    const workComponent = this.world.getComponent(PLAYER_ENTITY, WORK_COMPONENT) as Record<string, unknown> | null
    if (workComponent) {
      Object.assign(workComponent, {
        id: unlockedJob.id,
        name: unlockedJob.name,
        level: unlockedJob.level,
        salaryPerHour: unlockedJob.salaryPerHour,
        salaryPerDay: unlockedJob.salaryPerDay,
        salaryPerWeek: unlockedJob.salaryPerWeek,
        schedule: unlockedJob.schedule ?? workComponent.schedule ?? '5/2',
      })
    }

    return `Карьерный рост: новая должность «${unlockedJob.name}», ставка ${this._formatMoney(unlockedJob.salaryPerHour)} ₽ в час.`
  }

  _getEducationRank(level: string): number {
    const map: Record<string, number> = {
      'Среднее': 0,
      'Высшее': 1,
      'MBA': 2,
    }
    return map[level] ?? 0
  }

  _mergeStatChanges(...chunks: (Record<string, number> | null | undefined)[]): Record<string, number> {
    return chunks.reduce<Record<string, number>>((accumulator, chunk) => {
      Object.entries(chunk ?? {}).forEach(([key, value]) => {
        accumulator[key] = (accumulator[key] ?? 0) + value
      })
      return accumulator
    }, {})
  }

  _applyStatChanges(stats: Record<string, number>, statChanges: Record<string, number> = {}): void {
    for (const [key, value] of Object.entries(statChanges)) {
      stats[key] = this._clamp((stats[key] ?? 0) + value)
    }
  }

  _summarizeStatChanges(statChanges: Record<string, number> = {}): string {
    return summarizeStatChanges(statChanges)
  }

  _clamp(value: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, value))
  }

  _formatMoney(value: number): string {
    return new Intl.NumberFormat('ru-RU').format(value)
  }

  _resolveSalaryPerHour(workComponent: Record<string, unknown>): number {
    if (typeof workComponent.salaryPerHour === 'number' && workComponent.salaryPerHour > 0) {
      return workComponent.salaryPerHour
    }
    if (typeof workComponent.salaryPerDay === 'number' && workComponent.salaryPerDay > 0) {
      return Math.round(workComponent.salaryPerDay / 8)
    }
    if (typeof workComponent.salaryPerWeek === 'number' && workComponent.salaryPerWeek > 0) {
      return Math.round(workComponent.salaryPerWeek / 40)
    }
    if (workComponent?.id) {
      const job = CAREER_JOBS.find((item) => item.id === workComponent.id)
      if (job?.salaryPerHour) {
        return job.salaryPerHour
      }
    }
    return 0
  }
}

