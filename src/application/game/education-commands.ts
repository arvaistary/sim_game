import type {
  CanStartEducationProgramReturn,
  StartEducationContext,
  StartEducationResult,
} from './index.types'

import { EDUCATION_PROGRAMS } from '@domain/balance/constants/education-programs'

/**
 * @description [Application/Game] - проверяет возможность начала обучения
 * @return { CanStartEducationProgramReturn } результат проверки
 */
export function canStartEducationProgram(isEmployed: boolean, hasActiveProgram: boolean): CanStartEducationProgramReturn {
  if (isEmployed) return { ok: false, reason: 'Сначала нужно уволиться' }

  if (hasActiveProgram) return { ok: false, reason: 'У вас уже есть активная программа обучения' }

  return { ok: true }
}

/**
 * @description [Application/Game] - начинает программу обучения по ID
 * @return { StartEducationResult } результат начала обучения
 */
export function startEducationProgram(
  programId: string,
  context: StartEducationContext
): StartEducationResult {
  const checkAvailability: CanStartEducationProgramReturn = canStartEducationProgram(context.isEmployed, context.hasActiveProgram)

  if (!checkAvailability.ok) {
    return { success: false, message: checkAvailability.reason ?? 'Нельзя начать программу' }
  }

  const program = context.getProgramById
    ? context.getProgramById(programId)
    : EDUCATION_PROGRAMS.find((p) => p.id === programId)

  if (!program) {
    return { success: false, message: 'Программа не найдена' }
  }

  return {
    success: true,
    message: `Начато обучение: ${program.title}`,
    programId: program.id,
    programName: program.title,
    hoursRequired: program.hoursRequired,
  }
}
