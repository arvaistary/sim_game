import { getSystemContext } from '@/domain/game-facade/system-context'
import { ECSWorld } from '@/domain/ecs/world'

type AnyRecord = Record<string, unknown>

export const gameQueries = {
  getCareerTrack(world: ECSWorld): Array<AnyRecord> {
    const ctx = getSystemContext(world)
    return ctx.careerProgress.getCareerTrack() as unknown as Array<AnyRecord>
  },
  getActivityLogEntries(world: ECSWorld, count = 8): Array<AnyRecord> {
    const ctx = getSystemContext(world)
    return ctx.activityLog.getRecentEntries(count) as unknown as Array<AnyRecord>
  },
  canStartEducationProgram(world: ECSWorld, programId: string): boolean {
    const ctx = getSystemContext(world)
    const programs = ctx.education.getEducationPrograms()
    const program = programs.find(p => p.id === programId)
    if (!program) return false
    return ctx.education.canStartEducationProgram(program).ok
  },
  getFinanceOverview(world: ECSWorld) {
    const ctx = getSystemContext(world)
    return ctx.financeAction.getFinanceOverview()
  },
  getInvestments(world: ECSWorld) {
    const ctx = getSystemContext(world)
    return ctx.investment.getAllInvestments()
  },
  canExecuteAction(world: ECSWorld, actionId: string): { canExecute: boolean; reason?: string } {
    const ctx = getSystemContext(world)
    const check = ctx.action.canExecute(actionId)
    return { canExecute: check.available, reason: check.reason }
  },
  getNextEvent(world: ECSWorld): AnyRecord | null {
    const ctx = getSystemContext(world)
    return ctx.eventQueue.getNextEvent()
  },
  getActivityLog(world: ECSWorld, filter?: string, limit?: number) {
    const ctx = getSystemContext(world)
    return ctx.activityLog.getEntries({ limit: limit ?? 50, offset: 0, type: filter ?? undefined }).entries
  },
  getActivityLogWindow(world: ECSWorld, count: number, beforeIndex?: number) {
    const ctx = getSystemContext(world)
    return ctx.activityLog.getEntriesWindowEndingAt({ limit: count, endBefore: beforeIndex })
  },
}
