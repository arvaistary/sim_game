import type { GameWorldJSON } from './game-world/GameWorld.types'
import { GameWorld } from './game-world/GameWorld'
import type { CareerJob } from './balance/types'
import { CAREER_JOBS } from './balance/constants/career-jobs'
import { getActionById, type BalanceAction } from './balance/actions'
import {
  executeActionCommand,
  resolveEventDecisionCommand,
  simulateWorkShiftCommand,
  endCareerWork,
  startCareerWork,
  divestFromWorld,
  processMonthlySettlementForWorld,
  investInWorld,
} from './game-world/commands'
import type {
  GameCommandExecution,
  PersistedCommandResult,
  PersistedGameCommand,
} from './game-command-executor.types'

export class GameCommandExecutor {
  public execute(state: GameWorldJSON, command: PersistedGameCommand): GameCommandExecution {
    const world: GameWorld = GameWorld.fromJSON(state)
    let result: PersistedCommandResult

    try {
      result = this.executeOnWorld(world, command)
    } catch (error) {
      return {
        state,
        result: { success: false, message: error instanceof Error ? error.message : 'Invalid command payload' },
      }
    }
    return { state: world.toJSON(), result }
  }

  private executeOnWorld(world: GameWorld, command: PersistedGameCommand): PersistedCommandResult {
    switch (command.type) {
      case 'action':
        return executeActionCommand(world, stringValue(command.payload.actionId, 'actionId'))
      case 'work':
        return simulateWorkShiftCommand(world, numberValue(command.payload.hours, 'hours'))
      case 'event':
        return resolveEventDecisionCommand(
          world,
          command.payload.event as Parameters<typeof resolveEventDecisionCommand>[1] ?? null,
          stringValue(command.payload.choiceId, 'choiceId'),
        )
      case 'career':
        return this.executeCareer(world, command.payload)
      case 'finance':
        return this.executeFinance(world, command.payload)
      case 'education':
        return this.executeEducation(world, command.payload)
      default:
        return { success: false, message: `Unknown command type: ${command.type}` }
    }
  }

  private executeCareer(world: GameWorld, payload: Record<string, unknown>): PersistedCommandResult {
    if (payload.operation === 'quit') {
      endCareerWork(world)
      return { success: true, message: 'Вы уволились' }
    }

    const jobId: string = stringValue(payload.jobId, 'jobId')
    const job: CareerJob | undefined = CAREER_JOBS.find(
      (candidate) => candidate.id === jobId,
    )

    if (!job) return { success: false, message: 'Вакансия не найдена' }

    const professionalismEntry: number | { level: number; xp: number } | undefined = world.skills.levels.professionalism
    const professionalism: number = professionalismEntry === undefined
      ? 0
      : typeof professionalismEntry === 'number' ? professionalismEntry : professionalismEntry.level


    if (professionalism < job.minProfessionalism) {
      return { success: false, message: `Требуется профессионализм ${job.minProfessionalism}+` }
    }

    startCareerWork(world, {
      id: job.id,
      name: job.name,
      schedule: job.schedule,
      employed: true,
      level: job.level,
      salaryPerHour: job.salaryPerHour,
      salaryPerDay: job.salaryPerDay,
      salaryPerWeek: job.salaryPerWeek,
      requiredHoursPerWeek: job.requiredHoursPerWeek,
      workedHoursCurrentWeek: 0,
      pendingSalaryWeek: 0,
      totalWorkedHours: 0,
      daysAtWork: 0,
    })
    return { success: true, message: `Вы устроились на ${job.name}` }
  }

  private executeFinance(world: GameWorld, payload: Record<string, unknown>): PersistedCommandResult {
    if (payload.action === 'collect') {
      const amount: number = divestFromWorld(world, stringValue(payload.investmentId, 'investmentId'))
      return amount > 0
        ? { success: true, message: `Получено ${amount} ₽` }
        : { success: false, message: 'Инвестиция не найдена' }
    }

    if (payload.action === 'monthly_settlement') {
      processMonthlySettlementForWorld(world)
      return { success: true, message: `Расчёт завершён. Баланс: ${world.wallet.money} ₽` }
    }

    if (payload.action === 'invest') {
      const amount: number = numberValue(payload.amount, 'amount')
      const investmentType: 'deposit' | 'stocks' | 'business' = payload.investmentType === 'stocks' || payload.investmentType === 'business'
        ? payload.investmentType
        : 'deposit'
      const success: boolean = investInWorld(
        world,
        investmentType,
        amount,
        typeof payload.returnRate === 'number' ? payload.returnRate : 5,
      )
      return success
        ? { success: true, message: 'Инвестиция успешна' }
        : { success: false, message: 'Недостаточно средств' }
    }
    const actionId: string = stringValue(payload.actionId, 'actionId')
    const action: BalanceAction | null = getActionById(actionId)

    if (!action) return { success: false, message: 'Действие не найдено' }

    if (action.price > world.wallet.money) return { success: false, message: 'Недостаточно средств' }
    world.wallet.money -= action.price
    world.wallet.totalSpent += action.price
    return { success: true, message: action.effect || 'Выполнено' }
  }

  private executeEducation(world: GameWorld, payload: Record<string, unknown>): PersistedCommandResult {
    const education: Record<string, unknown> = world.education as unknown as Record<string, unknown>

    if (payload.operation === 'advance') {
      const active: Record<string, unknown> | undefined = education.activeEducation as Record<string, unknown> | undefined

      if (!active) return { success: false, message: 'Нет активного обучения' }
      const remaining: number = Math.max(0, Number(active.hoursRemaining ?? 0) - 1)
      active.hoursRemaining = remaining
      active.progress = Math.min(100, Number(active.progress ?? 0) + 1)
      education.cognitiveLoad = Math.min(100, Number(education.cognitiveLoad ?? 0) + 10)

      if (remaining === 0) {
        const completed: unknown[] = Array.isArray(education.completedPrograms) ? education.completedPrograms as unknown[] : []
        completed.push({ id: String(active.id ?? ''), name: String(active.name ?? '') })
        education.completedPrograms = completed
        education.activeEducation = null
      }
      return { success: true, message: 'Обучение продвинуто' }
    }

    const programId: string = stringValue(payload.programId, 'programId')

    if (education.activeEducation) return { success: false, message: 'Уже учитесь' }
    education.activeEducation = { id: programId, name: programId, progress: 0, hoursTotal: 100, hoursRemaining: 100 }
    return { success: true, message: `Программа ${programId} начата` }
  }
}

function stringValue(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`Invalid ${field}`)
  return value
}

function numberValue(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) throw new Error(`Invalid ${field}`)
  return value
}
