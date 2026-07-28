import type { GameWorldJSON } from './game-world/GameWorld.types'
import { GameWorld } from './game-world/GameWorld'
import type { CareerJob } from './balance/types'
import { CAREER_JOBS } from './balance/constants/career-jobs'
import { EDUCATION_PROGRAMS } from './balance/constants/education-programs'
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
  applySkillChanges,
  applyStatChangesRaw,
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

    if (payload.operation === 'advance' || payload.action === 'advance') {
      const active: Record<string, unknown> | undefined = education.activeEducation as Record<string, unknown> | undefined

      if (!active) return { success: false, message: 'Нет активного обучения' }
      const program = EDUCATION_PROGRAMS.find(candidate => candidate.id === String(active.id ?? ''))
      const storedSteps = Array.isArray(active.steps) ? active.steps as Array<Record<string, unknown>> : []
      const sourceSteps = storedSteps.length > 0
        ? storedSteps
        : (program?.steps ?? [{ id: `${String(active.id ?? 'program')}_step_1`, title: String(active.name ?? active.id ?? 'Обучение'), hoursRequired: Number(active.hoursTotal ?? 100) }])
      const steps = sourceSteps.map((step, index) => ({
        ...step,
        id: String(step.id ?? `${String(active.id ?? 'program')}_step_${index + 1}`),
        title: String(step.title ?? active.name ?? active.id ?? 'Обучение'),
        hoursRequired: Math.max(1, Number(step.hoursRequired ?? 1)),
        progressPercent: Math.max(0, Math.min(1, Number(step.progressPercent ?? 0))),
      }))
      let currentStepIndex = Math.max(0, Math.min(steps.length - 1, Number(active.currentStepIndex ?? 0)))
      while (currentStepIndex < steps.length - 1 && steps[currentStepIndex]!.progressPercent >= 1) currentStepIndex += 1

      const currentStep = steps[currentStepIndex]!
      currentStep.progressPercent = Math.min(1, currentStep.progressPercent + (1 / currentStep.hoursRequired))
      while (currentStepIndex < steps.length - 1 && steps[currentStepIndex]!.progressPercent >= 1) currentStepIndex += 1

      const totalHours: number = steps.reduce((total, step) => total + step.hoursRequired, 0)
      const remaining: number = steps.reduce((total, step) => total + step.hoursRequired * (1 - step.progressPercent), 0)
      active.steps = steps
      active.currentStepIndex = currentStepIndex
      active.hoursTotal = totalHours
      active.hoursRemaining = remaining
      active.progress = totalHours > 0 ? (totalHours - remaining) / totalHours : 1
      education.cognitiveLoad = Math.min(100, Number(education.cognitiveLoad ?? 0) + 10)

      if (remaining <= 0.0001) {
        const completed: unknown[] = Array.isArray(education.completedPrograms) ? education.completedPrograms as unknown[] : []
        completed.push({
          id: String(active.id ?? ''),
          name: String(active.name ?? program?.title ?? active.id ?? ''),
          typeLabel: program?.typeLabel,
          completedAtGameDay: Math.floor(world.time.totalHours / 24),
        })
        if (program?.completionStatChanges) {
          const statChanges = Object.fromEntries(
            Object.entries(program.completionStatChanges).filter(([, value]) => typeof value === 'number'),
          ) as Record<string, number>
          applyStatChangesRaw(world, statChanges)
        }
        if (program?.completionSkillChanges) applySkillChanges(world, program.completionSkillChanges)
        education.completedPrograms = completed
        education.activeEducation = null
      }
      return { success: true, message: 'Обучение продвинуто' }
    }

    const programId: string = stringValue(payload.programId, 'programId')

    if (education.activeEducation) return { success: false, message: 'Уже учитесь' }
    const program = EDUCATION_PROGRAMS.find(candidate => candidate.id === programId)
    const steps = (program?.steps ?? [{ id: `${programId}_step_1`, title: program?.title ?? programId, hoursRequired: program?.hoursRequired ?? 100 }]).map(step => {
      const milestoneReward = (step as { milestoneReward?: unknown }).milestoneReward
      return {
        id: step.id,
        title: step.title,
        hoursRequired: step.hoursRequired,
        progressPercent: 0,
        ...(milestoneReward ? { milestoneReward } : {}),
      }
    })
    const hoursTotal = steps.reduce((total, step) => total + step.hoursRequired, 0)
    education.activeEducation = {
      id: programId,
      name: program?.title ?? programId,
      type: program?.typeLabel ?? 'Программа',
      progress: 0,
      hoursTotal,
      hoursRemaining: hoursTotal,
      currentStepIndex: 0,
      steps,
    }
    return { success: true, message: `Программа ${program?.title ?? programId} начата` }
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
