import type { GameWorldJSON } from './game-world/GameWorld.types'
import { GameWorld } from './game-world/GameWorld'
import type { CareerJob, EducationProgram, ProgramStep } from './balance/types'
import { CAREER_JOBS } from './balance/constants/career-jobs'
import { EDUCATION_PROGRAMS, upgradeBookChapterSteps } from './balance/constants/education-programs'
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
  advanceHours,
  applyDayEndHookEffects,
} from './game-world/commands'
import type { GameEventPayload } from './game-world/commands/commands.types'
import { findPendingEventPayload } from './game-world/pending-event'
import type { DayEndHookEffectsPayload } from './game-world/commands/apply-day-end-hook-effects.types'
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
        return this.executeEvent(world, command.payload)
      case 'career':
        return this.executeCareer(world, command.payload)
      case 'finance':
        return this.executeFinance(world, command.payload)
      case 'education':
        return this.executeEducation(world, command.payload)
      case 'time':
        advanceHours(world, numberValue(command.payload.hours, 'hours'), 'idle')
        world.player.currentAge = world.player.startAge + Math.floor(world.time.totalHours / (365 * 24))
        return { success: true, message: 'Время прошло' }
      case 'day_end_hooks':
        return this.executeDayEndHooks(world, command.payload)
      default:
        return { success: false, message: `Unknown command type: ${command.type}` }
    }
  }

  private executeEvent(world: GameWorld, payload: Record<string, unknown>): PersistedCommandResult {
    const choiceId: string = stringValue(payload.choiceId, 'choiceId')
    const explicitEvent: GameEventPayload | null =
      payload.event && typeof payload.event === 'object'
        ? (payload.event as GameEventPayload)
        : null
    const templateId: string | undefined = typeof payload.eventId === 'string'
      ? payload.eventId
      : explicitEvent?.id
    const event: GameEventPayload | null = explicitEvent
      ?? (templateId ? findPendingEventPayload(world, templateId) : null)

    return resolveEventDecisionCommand(world, event, choiceId)
  }

  private executeDayEndHooks(world: GameWorld, payload: Record<string, unknown>): PersistedCommandResult {
    try {
      const effects: DayEndHookEffectsPayload = {
        dayNumber: nonNegativeInteger(payload.dayNumber, 'dayNumber'),
        events: payload.events as DayEndHookEffectsPayload['events'],
        wallet: payload.wallet as DayEndHookEffectsPayload['wallet'],
        finance: payload.finance as DayEndHookEffectsPayload['finance'],
        career: payload.career as DayEndHookEffectsPayload['career'],
      }
      applyDayEndHookEffects(world, effects)
      return { success: true, message: 'Эффекты конца дня применены' }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Не удалось применить эффекты конца дня',
      }
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

      if (Number(education.studyHoursSinceLastSleep ?? 0) >= 8) {
        return { success: false, message: 'Лимит учёбы исчерпан. Поспите для восстановления.' }
      }

      if (Number(education.cognitiveLoad ?? 0) >= 80) {
        return { success: false, message: 'Когнитивная нагрузка слишком высока. Поспите для восстановления.' }
      }
      const program: EducationProgram | undefined = EDUCATION_PROGRAMS.find(candidate => candidate.id === String(active.id ?? ''))
      const storedSteps: Array<Record<string, unknown>> = Array.isArray(active.steps) ? active.steps as Array<Record<string, unknown>> : []
      const upgradedBookSteps: ProgramStep[] | null = upgradeBookChapterSteps(program, storedSteps)
      const sourceSteps: Array<Record<string, unknown> | ProgramStep> = storedSteps.length > 0
        ? (upgradedBookSteps ?? storedSteps)
        : (program?.steps ?? [{ id: `${String(active.id ?? 'program')}_step_1`, title: String(active.name ?? active.id ?? 'Обучение'), hoursRequired: Number(active.hoursTotal ?? 100) }])
      const steps: ProgramStep[] = sourceSteps.map(
        (step, index) => ({
        ...step,
        id: String(step.id ?? `${String(active.id ?? 'program')}_step_${index + 1}`),
        title: String(step.title ?? active.name ?? active.id ?? 'Обучение'),
        ...(typeof step.content === 'string' ? { content: step.content } : {}),
        hoursRequired: Math.max(1, Number(step.hoursRequired ?? 1)),
        progressPercent: Math.max(0, Math.min(1, Number(step.progressPercent ?? 0))),
        }),
      )
      let currentStepIndex: number = Math.max(0, Math.min(steps.length - 1, Number(active.currentStepIndex ?? 0)))
      while (currentStepIndex < steps.length - 1 && steps[currentStepIndex]!.progressPercent >= 1) currentStepIndex += 1

      const currentStep: ProgramStep = steps[currentStepIndex]!
      currentStep.progressPercent = Math.min(1, currentStep.progressPercent + (1 / currentStep.hoursRequired))
      while (currentStepIndex < steps.length - 1 && steps[currentStepIndex]!.progressPercent >= 1) currentStepIndex += 1

      const totalHours: number = steps.reduce(
        (total, step) => total + step.hoursRequired,
        0,
      )
      const remaining: number = steps.reduce(
        (total, step) => total + step.hoursRequired * (1 - step.progressPercent),
        0,
      )
      active.steps = steps
      active.currentStepIndex = currentStepIndex
      active.hoursTotal = totalHours
      active.hoursRemaining = remaining
      active.progress = totalHours > 0 ? (totalHours - remaining) / totalHours : 1
      education.cognitiveLoad = Math.min(100, Number(education.cognitiveLoad ?? 0) + 10)
      education.studyHoursSinceLastSleep = Math.min(8, Number(education.studyHoursSinceLastSleep ?? 0) + 1)

      if (remaining <= 0.0001) {
        const completed: unknown[] = Array.isArray(education.completedPrograms) ? education.completedPrograms as unknown[] : []
        const completionNumber: number = Number(active.completionNumber ?? completed.filter(completed => {
          return typeof completed === 'object' && completed !== null && (completed as Record<string, unknown>).id === active.id
        }).length + 1)
        const rewardMultiplier: number = Math.max(0, Number(active.rewardMultiplier ?? 1))
        completed.push({
          id: String(active.id ?? ''),
          name: String(active.name ?? program?.title ?? active.id ?? ''),
          typeLabel: program?.typeLabel,
          completedAtGameDay: Math.floor(world.time.totalHours / 24),
          completionNumber,
          rewardMultiplier,
        })

        if (program?.completionStatChanges) {
          const statChanges: Record<string, number> = Object.fromEntries(
            Object.entries(program.completionStatChanges)
              .filter(([, value]) => typeof value === 'number')
              .map(([key, value]) => [key, (value as number) * rewardMultiplier]),
          ) as Record<string, number>
          applyStatChangesRaw(world, statChanges)
        }

        if (program?.completionSkillChanges) {
          applySkillChanges(world, Object.fromEntries(
            Object.entries(program.completionSkillChanges).map(([key, value]) => [key, value * rewardMultiplier]),
          ))
        }
        education.completedPrograms = completed
        education.activeEducation = null
      }
      return { success: true, message: 'Обучение продвинуто' }
    }

    const programId: string = stringValue(payload.programId, 'programId')

    if (education.activeEducation) return { success: false, message: 'Уже учитесь' }

    const program: EducationProgram | undefined = EDUCATION_PROGRAMS.find(candidate => candidate.id === programId)
    const completedPrograms: unknown[] = Array.isArray(education.completedPrograms) ? education.completedPrograms as unknown[] : []
    const completionNumber: number = completedPrograms.filter(completed => {
      return typeof completed === 'object' && completed !== null && (completed as Record<string, unknown>).id === programId
    }).length + 1
    const maxCompletions: number = 1 + (program?.maxRepeats ?? 0)

    if (program?.track === 'book' && completionNumber > maxCompletions) {
      return { success: false, message: `Достигнут лимит повторного чтения: ${maxCompletions} прохождения` }
    }

    const rewardMultiplier: number = completionNumber === 1 ? 1 : (program?.repeatRewardMultiplier ?? 0.5)
    const steps: ProgramStep[] = (program?.steps ?? [{ id: `${programId}_step_1`, title: program?.title ?? programId, hoursRequired: program?.hoursRequired ?? 100 }]).map(
      step => {
      const milestoneReward: unknown = (step as { milestoneReward?: unknown }).milestoneReward
      return {
        id: step.id,
        title: step.title,
        ...(typeof (step as { content?: unknown }).content === 'string'
          ? { content: (step as { content: string }).content }
          : {}),
        hoursRequired: step.hoursRequired,
        progressPercent: 0,
        ...(milestoneReward ? { milestoneReward } : {}),
      }
      },
    )
    const hoursTotal: number = steps.reduce(
      (total, step) => total + step.hoursRequired,
      0,
    )
    education.activeEducation = {
      id: programId,
      name: program?.title ?? programId,
      type: program?.typeLabel ?? 'Программа',
      progress: 0,
      hoursTotal,
      hoursRemaining: hoursTotal,
      currentStepIndex: 0,
      completionNumber,
      rewardMultiplier,
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

function nonNegativeInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error(`Invalid ${field}`)
  return Math.floor(value)
}
