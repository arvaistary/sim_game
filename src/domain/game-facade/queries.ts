import { getSystemContext } from '@/domain/game-facade/system-context'
import type { AnyRecord } from '@/domain/game-facade/index.types'
import { GameWorld } from '@/domain/engine/world'

export const gameQueries = {
  getCareerTrack(world: GameWorld): Array<AnyRecord> {
    const ctx = getSystemContext(world)
    return ctx.careerProgress.getCareerTrack() as unknown as Array<AnyRecord>
  },
  getActivityLogEntries(world: GameWorld, count = 8): Array<AnyRecord> {
    const ctx = getSystemContext(world)
    return ctx.activityLog.getRecentEntries(count) as unknown as Array<AnyRecord>
  },
  canStartEducationProgram(world: GameWorld, programId: string): boolean {
    const ctx = getSystemContext(world)
    const programs = ctx.education.getEducationPrograms()
    const program = programs.find(p => p.id === programId)
    if (!program) return false
    return ctx.education.canStartEducationProgram(program).ok
  },
  canStartEducationProgramWithReason(world: GameWorld, programId: string): { ok: boolean; reason?: string } {
    const ctx = getSystemContext(world)
    const programs = ctx.education.getEducationPrograms()
    const program = programs.find(p => p.id === programId)
    if (!program) return { ok: false, reason: 'Программа не найдена' }
    return ctx.education.canStartEducationProgram(program)
  },
  getFinanceOverview(world: GameWorld) {
    const ctx = getSystemContext(world)
    return ctx.financeAction.getFinanceOverview()
  },
  getFinanceActions(world: GameWorld) {
    const ctx = getSystemContext(world)
    return ctx.financeAction.getFinanceActions()
  },
  getInvestments(world: GameWorld) {
    const ctx = getSystemContext(world)
    return ctx.investment.getAllInvestments()
  },
  canExecuteAction(world: GameWorld, actionId: string): { canExecute: boolean; reason?: string } {
    const ctx = getSystemContext(world)
    const check = ctx.action.canExecute(actionId)
    return { canExecute: check.available, reason: check.reason }
  },
  getNextEvent(world: GameWorld): AnyRecord | null {
    const ctx = getSystemContext(world)
    return ctx.eventQueue.getNextEvent()
  },
  getActivityLog(world: GameWorld, filter?: string, limit?: number) {
    const ctx = getSystemContext(world)
    return ctx.activityLog.getEntries({ limit: limit ?? 50, offset: 0, type: filter ?? undefined }).entries
  },
  getActivityLogWindow(world: GameWorld, count: number, beforeIndex?: number) {
    const ctx = getSystemContext(world)
    return ctx.activityLog.getEntriesWindowEndingAt({ limit: count, endBefore: beforeIndex })
  },
}
