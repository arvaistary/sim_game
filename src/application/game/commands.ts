/**
 * Pure application commands (ADR-0005, Фаза 4).
 *
 * Все команды принимают `world: GameWorld` первым аргументом.
 * Application layer НЕ импортирует Pinia — только domain и utils.
 * SPAExecutor (Фаза 4) отвечает за создание/синхронизацию мира.
 */
import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { BalanceAction } from '@/domain/balance/actions'
import type {
  ExecuteActionResult,
  GameEventPayload,
  ResolveEventResult,
  WorkShiftResult,
} from '@/domain/game-world/commands/commands.types'
import type { ExecuteActionCommandResult, JobCatalogEntry, ProgramCatalogEntry } from './command.types'
import type { CareerJob } from '@/domain/balance/types'
import { CAREER_JOBS } from '@/domain/balance/constants/career-jobs'
import { getActionById } from '@/domain/balance/actions'
import {
  executeActionCommand,
  resolveEventDecisionCommand,
  simulateWorkShiftCommand,
  advanceHours,
  divestFromWorld,
  endCareerWork,
  investInWorld,
  processMonthlySettlementForWorld,
  startCareerWork,
} from '@/domain/game-world/commands'

/**
 * Выполнить лайфстайл-действие (invest/sleep).
 * @description [Application] - чистая функция над world.
 * @return { string } сообщение для UI
 */
export function executeLifestyleAction(world: GameWorld, cardData: Record<string, unknown>): string {
  const actionType: string = cardData.type as string

  if (actionType === 'invest') {
    const amount: number = cardData.amount as number
    const returnRate: number = (cardData.returnRate as number) ?? 5
    const type: 'deposit' | 'stocks' | 'business' = (cardData.investmentType as 'deposit' | 'stocks' | 'business') ?? 'deposit'

    const success: boolean = investInWorld(world, type, amount, returnRate)
    return success ? 'Инвестиция успешна' : 'Недостаточно средств'
  }

  if (actionType === 'sleep') {
    const hours: number = (cardData.hours as number) ?? 8
    const energy: number = Math.min(100, world.stats.energy + hours * 10)
    world.stats.energy = energy
    return 'Вы поспали'
  }
  return 'Неизвестное действие'
}

/**
 * Отработать смену.
 * @description [Application] - делегирует в domain command.
 * @return { string } сообщение с заработком
 */
export function simulateWorkShift(world: GameWorld, hours: number): string {
  const result: WorkShiftResult = simulateWorkShiftCommand(world, hours)
  return result.message
}

/**
 * Сменить карьеру (с проверкой требований).
 * @description [Application] - валидация на skills, делегирование в domain.
 * @return { { success: boolean; message: string } } результат
 */
export function changeCareer(world: GameWorld, jobId: string): { success: boolean; message: string } {
  let job: CareerJob | undefined
  for (const candidate of CAREER_JOBS) {

    if (candidate.id === jobId) {
      job = candidate
      break
    }
  }

  if (!job) return { success: false, message: 'Вакансия не найдена' }

  const professionalism: number = getProfessionalismLevel(world)

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

/**
 * Уволиться с работы.
 * @description [Application] - делегирует в domain.
 * @return { { success: boolean; message: string } }
 */
export function quitCareer(world: GameWorld): { success: boolean; message: string } {
  endCareerWork(world)
  return { success: true, message: 'Вы уволились' }
}

/**
 * Выполнить игровое действие (каталог balance/actions).
 * @description [Application] - делегирует в domain command.
 * @return { ExecuteActionCommandResult }
 */
export function executeAction(world: GameWorld, actionId: string): ExecuteActionCommandResult {
  const result: ExecuteActionResult = executeActionCommand(world, actionId)
  return { success: result.success, message: result.message }
}

/**
 * Применить выбор события.
 * @description [Application] - делегирует в domain command.
 * @return { { success: boolean; message: string } }
 */
export function resolveEventDecision(
  world: GameWorld,
  _eventId: string,
  event: GameEventPayload | null,
  choiceId: string,
): { success: boolean; message: string } {
  const result: ResolveEventResult = resolveEventDecisionCommand(world, event, choiceId)
  return { success: result.success, message: result.message }
}

/**
 * Снять инвестицию.
 * @description [Application] - делегирует в domain.
 * @return { string } сообщение с суммой
 */
export function collectInvestment(world: GameWorld, investmentId: string): string {
  const amount: number = divestFromWorld(world, investmentId)
  return amount > 0 ? `Получено ${amount} ₽` : 'Инвестиция не найдена'
}

/**
 * Продвинуть время.
 * @description [Application] - делегирует в domain.
 * @return { void }
 */
export function advanceTime(world: GameWorld, hours: number): void {
  advanceHours(world, hours)
}

/**
 * Применить месячный расчёт (investment returns + expenses).
 * @description [Application] - делегирует в domain.
 * @return { string } сообщение с балансом
 */
export function applyMonthlySettlement(world: GameWorld): string {
  processMonthlySettlementForWorld(world)
  return `Расчёт завершён. Баланс: ${world.wallet.money} ₽`
}

/**
 * Оплатить финансовое действие (legacy catalog price).
 * @description [Application] - списывает цену если хватает денег.
 * @return { string } сообщение
 */
export function executeFinanceDecision(world: GameWorld, actionId: string): string {
  const action: BalanceAction | null = getActionById(actionId)

  if (!action) return 'Действие не найдено'

  if (action.price > world.wallet.money) return 'Недостаточно средств'

  world.wallet.money -= action.price
  world.wallet.totalSpent += action.price
  return action.effect || 'Выполнено'
}

/**
 * @description Начать обучение. Education state пока хранит migration-compatible shape, поэтому mutation остаётся application command до выделения отдельного domain aggregate.
 * @return { string } Status of started education program.
 */
export function startEducationProgram(world: GameWorld, programId: string): string {
  const education: Record<string, unknown> = world.education as unknown as Record<string, unknown>

  if (education.activeEducation) throw new Error('Уже учитесь')

  education.activeEducation = {
    id: programId,
    name: programId,
    progress: 0,
    hoursTotal: 100,
    hoursRemaining: 100,
  }
  return `Программа ${programId} начата`
}

/**
 * @description Продвинуть активную учебную программу на один час.
 * @return { string } Status of education progress.
 */
export function advanceEducation(world: GameWorld): string {
  const education: Record<string, unknown> = world.education as unknown as Record<string, unknown>
  const active: Record<string, unknown> | null = (education.activeEducation as Record<string, unknown> | undefined) ?? null

  if (!active) return 'Нет активного обучения'

  const remaining: number = Math.max(0, Number(active.hoursRemaining ?? 0) - 1)
  active.hoursRemaining = remaining
  active.progress = Math.min(100, Number(active.progress ?? 0) + 1)
  education.cognitiveLoad = Math.min(100, Number(education.cognitiveLoad ?? 0) + 10)

  if (remaining === 0) {
    const completed: Array<Record<string, unknown>> = Array.isArray(education.completedPrograms)
      ? education.completedPrograms as Array<Record<string, unknown>>
      : []
    completed.push({ id: String(active.id ?? ''), name: String(active.name ?? '') })
    education.completedPrograms = completed
    education.activeEducation = null
  }

  return 'Обучение продвинуто'
}

/**
 * Получить уровень professionalism из мира.
 * @description [Application] - локальный helper для changeCareer checks.
 * @return { number }
 */
function getProfessionalismLevel(world: GameWorld): number {
  const entry: number | { level: number; xp: number } | undefined = world.skills.levels.professionalism

  if (entry === undefined) return 0
  return typeof entry === 'number' ? entry : (entry.level ?? 0)
}

/**
 * Дескриптор каталога job (для UI-презентаций, legacy JobCatalogEntry).
 * @description [Application] - helper для совместимости со старым API.
 * @return { JobCatalogEntry | undefined }
 */
export function findJobCatalogEntry(jobId: string): JobCatalogEntry | undefined {
  let found: CareerJob | undefined
  for (const candidate of CAREER_JOBS) {

    if (candidate.id === jobId) {
      found = candidate
      break
    }
  }

  if (!found) return undefined
  return {
    name: found.name,
    salaryPerHour: found.salaryPerHour,
    requiredHoursPerWeek: found.requiredHoursPerWeek,
  }
}

/**
 * Дескриптор каталога education program (для UI-презентаций, legacy).
 * @description [Application] - helper для совместимости со старым API.
 * @return { ProgramCatalogEntry | undefined }
 */
export function findProgramCatalogEntry(programId: string): ProgramCatalogEntry | undefined {
  const PROGRAMS: Record<string, ProgramCatalogEntry> = {
    'high-school': { name: 'Среднее образование', duration: 1000, cost: 0 },
    'university': { name: 'Университет', duration: 3000, cost: 50000 },
    'courses': { name: 'Курсы', duration: 200, cost: 10000 },
  }
  return PROGRAMS[programId]
}
