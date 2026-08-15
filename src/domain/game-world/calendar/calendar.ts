import type { StatsData } from '@/domain/balance/constants/default-save'
import { GameWorld } from '@/domain/game-world/GameWorld'
import { planDayCommand } from '@/domain/game-world/commands/plan-day'
import type { DayPlanInput, DayPlanResult } from '@/domain/game-world/commands/commands.types'
import type {
  CalendarDayPlan,
  CalendarDayForecast,
  CalendarLockCopy,
  CalendarLockCopyInput,
  CalendarPlan,
  CalendarRunResult,
  CalendarValidationResult,
} from './calendar.types'

export type {
  CalendarDayPlan,
  CalendarDayForecast,
  CalendarLockCopy,
  CalendarLockCopyInput,
  CalendarPlan,
  CalendarRunResult,
  CalendarValidationResult,
} from './calendar.types'

const DEFAULT_SLEEP_HOURS: number = 7
const CALENDAR_UNLOCK_LEVELS: number[] = [0, 2, 4, 6, 6, 8, 8]

/**
 * Возвращает открытый горизонт календаря по уровню тайм-менеджмента.
 * @description [Domain] - применяет ступени GDD 15.2 и ограничивает результат диапазоном 1..7.
 * @return { number } число доступных дней
 */
export function getCalendarHorizon(timeManagementLevel: number): number {
  if (timeManagementLevel >= 8) return 7

  if (timeManagementLevel >= 6) return 5

  if (timeManagementLevel >= 4) return 3

  if (timeManagementLevel >= 2) return 2

  return 1
}

/**
 * Возвращает минимальный уровень тайм-менеджмента для колонки дня.
 * @description [Domain] - синхронизирует состояние locked-колонок с горизонтом календаря.
 * @return { number } требуемый уровень навыка
 */
export function getCalendarUnlockLevel(dayOffset: number): number {
  const normalizedOffset: number = Math.max(0, Math.min(CALENDAR_UNLOCK_LEVELS.length - 1, Math.floor(dayOffset)))
  return CALENDAR_UNLOCK_LEVELS[normalizedOffset]!
}

/**
 * Собирает подпись закрытого дня календаря.
 * @description [Domain] - называет навык тайм-менеджмента и текущий уровень, без «уровня персонажа».
 * @return { CalendarLockCopy } заголовок, требование и текущий прогресс навыка
 */
export function getCalendarLockCopy(data: CalendarLockCopyInput): CalendarLockCopy {
  return {
    title: 'День закрыт',
    requirement: `Нужен навык «${data.skillLabel}» ${data.unlockLevel}`,
    progress: `Сейчас: ${data.currentLevel}`,
  }
}

/**
 * Создаёт пустой план заданной длины.
 * @description [Domain] - каждый день начинается с семи часов сна и не содержит действий.
 * @return { CalendarPlan } пустой план периода
 */
export function createCalendarPlan(horizon: number): CalendarPlan {
  const dayCount: number = Math.max(1, Math.min(7, Math.floor(horizon)))
  const days: DayPlanInput[] = []

  for (let dayOffset: number = 0; dayOffset < dayCount; dayOffset += 1) {
    days.push({ sleepHours: DEFAULT_SLEEP_HOURS, workHours: 0, actionIds: [] })
  }

  return { days }
}

/**
 * Возвращает плановую длительность рабочей смены для дня периода.
 * @description [Domain] - интерпретирует циклические графики вида 5/2, 2/2 и 6/1.
 * @return { number } часы смены или 0 для выходного/свободного графика
 */
export function getScheduledWorkHours(world: GameWorld, dayOffset: number): number {
  const job: GameWorld['career']['currentJob'] = world.career.currentJob

  if (!job.employed) return 0

  const scheduleMatch: RegExpExecArray | null = /^(\d+)\/(\d+)$/.exec(job.schedule)

  if (!scheduleMatch) return 0

  const workDays: number = Number(scheduleMatch[1])
  const restDays: number = Number(scheduleMatch[2])
  const cycleDays: number = workDays + restDays

  if (workDays <= 0 || cycleDays <= 0) return 0

  const currentDay: number = Math.floor(world.time.totalHours / 24)
  const cycleDay: number = (currentDay + dayOffset) % cycleDays

  if (cycleDay >= workDays) return 0

  const derivedHours: number = job.salaryPerHour > 0
    ? job.salaryPerDay / job.salaryPerHour
    : 8

  return Math.max(0, Math.min(24, Math.round(derivedHours)))
}

function copyStats(stats: StatsData): StatsData {
  return { ...stats }
}

/**
 * Выполняет план периода последовательно.
 * @description [Domain] - использует ту же команду дня, что и однодневный планировщик, и останавливается на первом частичном дне.
 * @return { CalendarRunResult } траектория выполнения
 */
export function runCalendarPlan(world: GameWorld, plan: CalendarPlan): CalendarRunResult {
  const days: CalendarDayForecast[] = []
  let currentPlan: CalendarPlan = { days: plan.days.map(cloneDayPlan) }

  for (let dayIndex: number = 0; dayIndex < currentPlan.days.length; dayIndex += 1) {
    const dayPlan: CalendarDayPlan = currentPlan.days[0]!
    const startStats: StatsData = copyStats(world.stats)
    const result: DayPlanResult = planDayCommand(world, dayPlan)
    const day: CalendarDayForecast = {
      dayOffset: dayIndex,
      startStats,
      endStats: copyStats(world.stats),
      result,
    }

    days.push(day)

    if (!result.success) {
      return { success: false, completedDays: days.length, days }
    }

    currentPlan = advanceCalendarPlan(currentPlan)
  }

  return { success: true, completedDays: days.length, days }
}

/**
 * Строит детерминированный прогноз периода.
 * @description [Domain] - запускает общий исполнитель на копии мира; случайные события и внешние эффекты в прогноз не входят.
 * @return { CalendarRunResult } прогноз траектории
 */
export function forecastCalendarPlan(world: GameWorld, plan: CalendarPlan): CalendarRunResult {
  const previewWorld: GameWorld = GameWorld.fromJSON(world.toJSON())

  return runCalendarPlan(previewWorld, plan)
}

function cloneDayPlan(day: CalendarDayPlan): CalendarDayPlan {
  const pinnedActionIndexes: number[] = [...(day.pinnedActionIndexes ?? [])]
    .filter((index: number) => index >= 0 && index < day.actionIds.length)

  return pinnedActionIndexes.length > 0
    ? { ...day, actionIds: [...day.actionIds], pinnedActionIndexes }
    : { ...day, actionIds: [...day.actionIds] }
}

/**
 * Переносит календарь на следующий день, сохраняя только закреплённые действия.
 * @description [Domain] - единое правило очистки прожитого дня для прогноза, исполнения и хранилища.
 * @return { CalendarPlan } обновлённый план периода
 */
export function advanceCalendarPlan(
  plan: CalendarPlan,
  dayCount: number = plan.days.length,
  replacementDay?: CalendarDayPlan,
): CalendarPlan {
  const completedDay: CalendarDayPlan | undefined = plan.days[0]

  if (!completedDay) return { days: [] }

  const targetDayCount: number = Math.max(1, Math.min(7, Math.floor(dayCount)))
  const nextDays: CalendarDayPlan[] = plan.days.slice(1).map(cloneDayPlan)

  while (nextDays.length < targetDayCount) {
    nextDays.push(cloneDayPlan(replacementDay ?? createCalendarPlan(1).days[0]!))
  }

  const pinnedActionIds: string[] = (completedDay.pinnedActionIndexes ?? [])
    .map((index: number) => completedDay.actionIds[index])
    .filter((actionId: string | undefined): actionId is string => actionId !== undefined)
  const nextDay: CalendarDayPlan = nextDays[0]!

  if (pinnedActionIds.length > 0) {
    const existingPinnedIndexes: number[] = [...(nextDay.pinnedActionIndexes ?? [])]
    nextDay.actionIds = [...pinnedActionIds, ...nextDay.actionIds]
    nextDay.pinnedActionIndexes = [
      ...pinnedActionIds.map((_actionId: string, index: number) => index),
      ...existingPinnedIndexes.map((index: number) => index + pinnedActionIds.length),
    ]
  }

  return { days: nextDays.slice(0, targetDayCount) }
}

/**
 * Проверяет план дня с учётом предыдущих дней календаря.
 * @description [Domain] - единая проверка часов, денег, требований и разовых действий перед добавлением.
 * @return { CalendarValidationResult } результат проверки
 */
export function validateCalendarDay(
  world: GameWorld,
  plan: CalendarPlan,
  dayOffset: number,
  day: DayPlanInput,
): CalendarValidationResult {
  if (dayOffset < 0 || dayOffset >= plan.days.length) {
    return { success: false, message: 'День недоступен' }
  }

  const candidateDays: DayPlanInput[] = plan.days
    .slice(0, dayOffset + 1)
    .map(cloneDayPlan)
  candidateDays[dayOffset] = cloneDayPlan(day)

  const result: CalendarRunResult = forecastCalendarPlan(world, { days: candidateDays })
  const failedDay: CalendarDayForecast | undefined = result.days.find(
    (forecastDay: CalendarDayForecast) => !forecastDay.result.success,
  )

  return result.success
    ? { success: true, message: '' }
    : { success: false, message: failedDay?.result.message ?? 'План недоступен' }
}

/**
 * Проверяет добавление одной карточки в день.
 * @description [Domain] - строит кандидат без изменения исходного плана.
 * @return { CalendarValidationResult } результат проверки
 */
export function validateCalendarAction(
  world: GameWorld,
  plan: CalendarPlan,
  dayOffset: number,
  actionId: string,
): CalendarValidationResult {
  const day: DayPlanInput | undefined = plan.days[dayOffset]

  if (!day || !actionId) return { success: false, message: 'Действие недоступно' }

  return validateCalendarDay(world, plan, dayOffset, {
    ...day,
    actionIds: [...day.actionIds, actionId],
  })
}
