import { getSystemContext } from '@/domain/game-facade/system-context'
import { GAME_DOMAIN_EVENT } from '@/domain/game-facade/index.constants'
import type { AnyRecord } from '@/domain/game-facade/index.types'
import { GameWorld } from '@/domain/engine/world'

export const gameCommands = {
  applyRecoveryAction(world: GameWorld, cardData: AnyRecord): string {
    const ctx = getSystemContext(world)
    const result = ctx.recovery.applyRecoveryAction(cardData as never) || ''
    world.emitDomainEvent(GAME_DOMAIN_EVENT.recoveryApplied, { cardData, result })
    return result
  },
  applyWorkShift(world: GameWorld, hours: number): string {
    const ctx = getSystemContext(world)
    return ctx.workPeriod.applyWorkShift(hours) || ''
  },
  startEducationProgram(world: GameWorld, programId: string): string {
    const ctx = getSystemContext(world)
    return ctx.education.startEducationProgram(programId).message
  },
  advanceEducation(world: GameWorld): string {
    const ctx = getSystemContext(world)
    const activeCourses = ctx.education.getActiveCourses()
    if (activeCourses.length === 0) return 'Нет активных курсов обучения.'
    return ctx.education.advanceEducationCourseDay(activeCourses[0].id).summary
  },
  applyFinanceAction(world: GameWorld, actionId: string): string {
    const ctx = getSystemContext(world)
    return ctx.financeAction.applyFinanceAction(actionId).message
  },
  collectInvestment(world: GameWorld, investmentId: string): string {
    const ctx = getSystemContext(world)
    return ctx.investment.collectInvestment(investmentId).message
  },
  executeAction(world: GameWorld, actionId: string): string {
    const ctx = getSystemContext(world)
    const result = ctx.action.execute(actionId)
    return result.success ? (result.summary ?? 'Действие выполнено.') : (result.error ?? 'Не удалось выполнить действие.')
  },
  applyEventChoice(world: GameWorld, eventId: string, choiceId: string): string {
    const ctx = getSystemContext(world)
    const eventQueue = world.getComponent(ctx.playerId, 'eventQueue') as AnyRecord | null
    const pendingEvents = (eventQueue?.pendingEvents as Array<AnyRecord>) ?? []
    const event = pendingEvents.find(e => e.id === eventId || e.instanceId === eventId)
    if (!event) return 'Событие не найдено.'

    const choices = event.choices as Array<AnyRecord> | undefined
    if (!choices || choices.length === 0) return 'У события нет вариантов выбора.'

    let choiceIndex = choices.findIndex(c => c.id === choiceId)
    if (choiceIndex === -1) {
      const numericIndex = parseInt(choiceId, 10)
      choiceIndex = !Number.isNaN(numericIndex) && numericIndex >= 0 && numericIndex < choices.length ? numericIndex : 0
    }

    return ctx.eventChoice.applyEventChoice(event as never, choiceIndex).message
  },
  advanceTime(world: GameWorld, hours: number): void {
    const ctx = getSystemContext(world)
    ctx.time.advanceHours(hours)
    world.emitDomainEvent(GAME_DOMAIN_EVENT.timeAdvanced, { hours })
  },
  applyMonthlySettlement(world: GameWorld): string {
    const ctx = getSystemContext(world)
    const timeComp = world.getComponent(ctx.playerId, 'time') as AnyRecord | null
    const currentMonth = (timeComp?.gameMonths as number) ?? 1
    return ctx.monthlySettlement.applyMonthlySettlement(currentMonth).message
  },
}
