import {
  TIME_COMPONENT,
  STATS_COMPONENT,
  WORK_COMPONENT,
  WALLET_COMPONENT,
  CAREER_COMPONENT,
  SKILLS_COMPONENT,
  EDUCATION_COMPONENT,
  PLAYER_ENTITY,
} from '../../components/index'
import { CAREER_JOBS } from '../../../balance/constants/career-jobs'
import { createWeeklyJobDismissalQueuedEvent } from '../../../balance/constants/game-events'
import { SkillsSystem } from '../SkillsSystem'
import { StatsSystem } from '../StatsSystem'
import { TimeSystem } from '../TimeSystem'
import type { RuntimeTimeComponent } from '../TimeSystem/index.types'
import { summarizeStatChanges } from '../../utils/stat-change-summary'
import type { GameWorld } from '../../world'
import type { StatChanges } from '@/domain/balance/types'
import type { WorkEventChoice, WorkShiftSummaryParams } from './index.types'
import { BASE_STAT_CHANGES_PER_HOUR } from './index.constants'
import { resolveSalaryPerHour, formatMoney, getEducationRank, toFiniteNumber } from '../../utils/career-helpers'

/**
 * Система обработки рабочих периодов
 */
export class WorkPeriodSystem {
  private world!: GameWorld
  private skillsSystem!: SkillsSystem
  private statsSystem!: StatsSystem

  private baseStatChangesPerHour = BASE_STAT_CHANGES_PER_HOUR

  init(world: GameWorld): void {
    this.world = world
    this.skillsSystem = new SkillsSystem()
    this.skillsSystem.init(world)
    this.statsSystem = new StatsSystem()
    this.statsSystem.init(world)
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
      work.pendingSalaryWeek = 0
      const careerEmpty = this.world.getComponent(playerId, CAREER_COMPONENT) as Record<string, unknown> | null
      if (careerEmpty) {
        careerEmpty.workedHoursCurrentWeek = 0
        careerEmpty.pendingSalaryWeek = 0
      }
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
    work.pendingSalaryWeek = 0
    const career = this.world.getComponent(playerId, CAREER_COMPONENT) as Record<string, unknown> | null
    if (career) {
      career.workedHoursCurrentWeek = 0
      career.pendingSalaryWeek = 0
    }
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
      pendingSalaryWeek: 0,
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
    this._syncCareerCurrentJob()

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

  applyWorkShift(workHours = 8, WorkEventChoice: WorkEventChoice | null = null): string {
    const playerId = PLAYER_ENTITY

    const workComponent = this._ensureWorkComponentFromCareer(playerId)
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

    const timeSystem = this._resolveTimeSystem()
    timeSystem.normalizeTimeComponent(timeComponent as unknown as RuntimeTimeComponent)

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
    const baseSalaryPerHour = resolveSalaryPerHour(workComponent)
    const salaryMultiplier = toFiniteNumber(modifiers.salaryMultiplier, 1)
    const workEfficiencyMultiplier = toFiniteNumber(modifiers.workEfficiencyMultiplier, 1)
    const effectiveSalaryPerHour = Math.round(baseSalaryPerHour * salaryMultiplier * workEfficiencyMultiplier)
    const totalSalary = Math.round(effectiveSalaryPerHour * workHours)

    const totalBaseStatChanges: Record<string, number> = {}
    Object.entries(this.baseStatChangesPerHour).forEach(([key, value]) => {
      totalBaseStatChanges[key] = Math.round(value * workHours)
    })
    totalBaseStatChanges.hunger = Math.round(totalBaseStatChanges.hunger * toFiniteNumber(modifiers.hungerDrainMultiplier, 1))
    totalBaseStatChanges.energy = Math.round(totalBaseStatChanges.energy * toFiniteNumber(modifiers.energyDrainMultiplier, 1))
    totalBaseStatChanges.stress = Math.round(totalBaseStatChanges.stress * toFiniteNumber(modifiers.stressGainMultiplier, 1))

    const eventStatChanges = WorkEventChoice?.statChanges ?? {}
    const combinedStatChanges = this._mergeStatChanges(totalBaseStatChanges, eventStatChanges as Record<string, number>)

    const eventSalaryBonus = Math.round(effectiveSalaryPerHour * workHours * toFiniteNumber(WorkEventChoice?.salaryMultiplier, 0))
    const accruedSalary = totalSalary + eventSalaryBonus

    const dailyHours = this._resolveDailyWorkHours(workComponent)
    const daysWorkedIncrement = Math.max(1, Math.round(workHours / dailyHours))
    const requiredHoursPerWeek = Math.max(0, Number(workComponent.requiredHoursPerWeek) || 0)
    const workedHoursCurrentWeek = ((workComponent.workedHoursCurrentWeek as number) ?? 0) + workHours
    const pendingSalaryBefore = Math.max(0, Number(workComponent.pendingSalaryWeek) || 0)
    const pendingSalaryAfterAccrual = Math.max(0, pendingSalaryBefore + accruedSalary)
    let payoutSalary = 0
    let pendingSalaryWeek = pendingSalaryAfterAccrual

    if (requiredHoursPerWeek === 0 || workedHoursCurrentWeek >= requiredHoursPerWeek) {
      payoutSalary = Math.max(0, pendingSalaryAfterAccrual)
      pendingSalaryWeek = 0
      walletComponent.money += payoutSalary
      walletComponent.totalEarnings += payoutSalary
    }

    workComponent.daysAtWork = ((workComponent.daysAtWork as number) ?? 0) + daysWorkedIncrement
    workComponent.workedHoursCurrentWeek = workedHoursCurrentWeek
    workComponent.pendingSalaryWeek = pendingSalaryWeek
    workComponent.totalWorkedHours = ((workComponent.totalWorkedHours as number) ?? 0) + workHours

    const careerComponent = this.world.getComponent(playerId, CAREER_COMPONENT) as Record<string, unknown> | null
    if (careerComponent) {
      careerComponent.workedHoursCurrentWeek = workComponent.workedHoursCurrentWeek
      careerComponent.pendingSalaryWeek = pendingSalaryWeek
      this._syncCareerCurrentJob()
    }

    const lifetimeStats = this.world.getComponent(playerId, 'lifetimeStats') as Record<string, number> | null
    if (lifetimeStats) {
      lifetimeStats.totalWorkDays = (lifetimeStats.totalWorkDays ?? 0) + daysWorkedIncrement
      lifetimeStats.totalWorkHours = (lifetimeStats.totalWorkHours ?? 0) + workHours
    }

    this.statsSystem.applyStatChanges(combinedStatChanges)

    if (WorkEventChoice?.permanentSalaryMultiplier) {
      workComponent.salaryPerHour = Math.round(baseSalaryPerHour * (1 + WorkEventChoice.permanentSalaryMultiplier))
      workComponent.salaryPerDay = Math.round((workComponent.salaryPerHour as number) * 8)
      workComponent.salaryPerWeek = Math.round((workComponent.salaryPerHour as number) * 40)
    }

    // Канонический путь: время продвигается ТОЛЬКО через TimeSystem.advanceHours.
    // Fallback-мутация totalHours удалена — см. Data Sync Remediation Plan Phase 2.
    timeSystem.advanceHours(workHours, { actionType: 'work_shift' })

    if (this.world && this.world.eventBus) {
      const statSummary = this._summarizeStatChanges(combinedStatChanges)
      const weeklyProgress = requiredHoursPerWeek > 0
        ? `${Math.min(workedHoursCurrentWeek, requiredHoursPerWeek)}/${requiredHoursPerWeek} ч`
        : `${workedHoursCurrentWeek} ч`

      const detailLines = [
        `Отработано ${workHours} ч.`,
        `Прогресс недели: ${weeklyProgress}.`,
        `Начислено: ${formatMoney(accruedSalary)} ₽.`,
        `Выплачено сейчас: ${formatMoney(payoutSalary)} ₽.`,
        pendingSalaryWeek > 0 ? `Ожидает выплаты: ${formatMoney(pendingSalaryWeek)} ₽.` : '',
        statSummary,
      ].filter(Boolean)

      this.world.eventBus.dispatchEvent(new CustomEvent('activity:action', {
        detail: {
          category: 'work',
          title: '💼 Отработана смена',
          description: detailLines.join('\n'),
          icon: null,
          metadata: {
            hoursWorked: workHours,
            accrued: accruedSalary,
            paid: payoutSalary,
            pendingSalaryWeek,
            workedHoursCurrentWeek,
            requiredHoursPerWeek,
            statChanges: combinedStatChanges,
            jobId: workComponent.id,
            jobName: workComponent.name,
          },
        },
      }))
    }

    return this._buildWorkPeriodSummary({
      workHours,
      accruedSalary,
      payoutSalary,
      pendingSalaryWeek,
      requiredHoursPerWeek,
      workedHoursCurrentWeek,
      statChanges: combinedStatChanges,
      WorkEventChoice,
    })
  }

  applyWorkPeriodResult(workDays: number, WorkEventChoice: WorkEventChoice | null = null): string {
    const days = Math.max(1, Number(workDays) || 1)
    return this.applyWorkShift(days * 8, WorkEventChoice)
  }

  _buildWorkPeriodSummary(params: WorkShiftSummaryParams): string {
    const {
      workHours,
      accruedSalary,
      payoutSalary,
      pendingSalaryWeek,
      requiredHoursPerWeek,
      workedHoursCurrentWeek,
      statChanges,
      WorkEventChoice,
    } = params

    const lines = [
      `Рабочая смена завершена: ${workHours} ч.`,
      `Начислено за смену: ${formatMoney(accruedSalary)} ₽.`,
      payoutSalary > 0
        ? `Выплата за неделю: ${formatMoney(payoutSalary)} ₽.`
        : requiredHoursPerWeek > 0
          ? `Выплата будет после закрытия недельной нормы (${Math.min(workedHoursCurrentWeek, requiredHoursPerWeek)}/${requiredHoursPerWeek} ч).`
          : 'Выплата будет после закрытия нормы вашей смены.',
      pendingSalaryWeek > 0
        ? `Накоплено к выплате: ${formatMoney(pendingSalaryWeek)} ₽.`
        : '',
      this._summarizeStatChanges(statChanges),
    ]

    if (WorkEventChoice) {
      lines.push(`Событие: ${WorkEventChoice.label} — ${WorkEventChoice.outcome}`)
    }

    return lines.filter(Boolean).join('\n')
  }

  _mergeStatChanges(...chunks: (Record<string, number> | null | undefined)[]): Record<string, number> {
    return chunks.reduce<Record<string, number>>((accumulator, chunk) => {
      Object.entries(chunk ?? {}).forEach(([key, value]) => {
        if (!Number.isFinite(value)) return
        accumulator[key] = (accumulator[key] ?? 0) + value
      })
      return accumulator
    }, {})
  }

  _summarizeStatChanges(statChanges: Record<string, number> = {}): string {
    return summarizeStatChanges(statChanges)
  }

  _resolveDailyWorkHours(workComponent: Record<string, unknown>): number {
    const salaryPerDay = Number(workComponent.salaryPerDay) || 0
    const salaryPerHour = Number(workComponent.salaryPerHour) || 0
    if (salaryPerDay > 0 && salaryPerHour > 0) {
      return Math.max(1, Math.round(salaryPerDay / salaryPerHour))
    }

    const requiredHoursPerWeek = Math.max(0, Number(workComponent.requiredHoursPerWeek) || 0)
    const scheduleRaw = typeof workComponent.schedule === 'string' ? workComponent.schedule : ''
    const [workDaysRaw] = scheduleRaw.split('/')
    const workDays = Math.max(1, Number(workDaysRaw) || 1)

    if (requiredHoursPerWeek > 0) {
      return Math.max(1, Math.round(requiredHoursPerWeek / workDays))
    }

    return 8
  }

  _ensureWorkComponentFromCareer(playerId: string): Record<string, unknown> | null {
    const existingWork = this.world.getComponent(playerId, WORK_COMPONENT) as Record<string, unknown> | null
    if (existingWork) return existingWork

    const careerComponent = this.world.getComponent(playerId, CAREER_COMPONENT) as Record<string, unknown> | null
    const legacyCurrentJob = (careerComponent?.currentJob as Record<string, unknown> | undefined) ?? null
    const source = legacyCurrentJob ?? careerComponent
    const sourceId = source?.id
    if (!source || !sourceId) return null

    const requiredHoursPerWeek = Math.max(0, Number(source.requiredHoursPerWeek) || 0)
    const workedHoursCurrentWeek = Math.max(0, Number(source.workedHoursCurrentWeek) || 0)
    const pendingSalaryWeek = Math.max(0, Number(source.pendingSalaryWeek) || 0)
    const totalWorkedHours = Math.max(0, Number(source.totalWorkedHours) || 0)
    const daysAtWork = Math.max(0, Number(source.daysAtWork) || 0)

    this.world.addComponent(playerId, WORK_COMPONENT, {
      id: sourceId,
      name: source.name ?? 'Безработный',
      schedule: source.schedule ?? '5/2',
      employed: source.employed ?? true,
      level: source.level ?? 1,
      salaryPerHour: source.salaryPerHour ?? 0,
      salaryPerDay: source.salaryPerDay ?? 0,
      salaryPerWeek: source.salaryPerWeek ?? 0,
      requiredHoursPerWeek,
      workedHoursCurrentWeek,
      pendingSalaryWeek,
      totalWorkedHours,
      daysAtWork,
    })

    if (careerComponent) {
      Object.assign(careerComponent, {
        id: sourceId,
        name: source.name ?? careerComponent.name ?? 'Безработный',
        schedule: source.schedule ?? careerComponent.schedule ?? '5/2',
        employed: source.employed ?? careerComponent.employed ?? true,
        level: source.level ?? careerComponent.level ?? 1,
        salaryPerHour: source.salaryPerHour ?? careerComponent.salaryPerHour ?? 0,
        salaryPerDay: source.salaryPerDay ?? careerComponent.salaryPerDay ?? 0,
        salaryPerWeek: source.salaryPerWeek ?? careerComponent.salaryPerWeek ?? 0,
        requiredHoursPerWeek,
        workedHoursCurrentWeek,
        pendingSalaryWeek,
        totalWorkedHours,
        daysAtWork,
      })
    }

    return this.world.getComponent(playerId, WORK_COMPONENT) as Record<string, unknown> | null
  }

  _syncCareerCurrentJob(): void {
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

  private _resolveTimeSystem(): TimeSystem {
    const existing = this.world.getSystem(TimeSystem)
    if (existing) return existing
    const created = new TimeSystem()
    this.world.addSystem(created)
    return created
  }
}

