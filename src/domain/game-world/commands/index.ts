/**
 * Public API domain commands (ADR-0005, Фаза 2).
 *
 * Чистые функции с signature (world: GameWorld, ...) => CommandResult.
 * Domain-only, без импортов Pinia/Vue/Nuxt.
 */
export { executeActionCommand } from './execute-action'
export { simulateWorkShiftCommand } from './simulate-work-shift'
export { resolveEventDecisionCommand } from './resolve-event-decision'
export { planDayCommand } from './plan-day'
export { applyDayEndHookEffects } from './apply-day-end-hook-effects'
export { createNoopDayEndHooks, createLiveDayEndHooks } from './day-end-hooks'
export type { AgeChangeContext, DayEndHooks } from './day-end-hooks'
export {
  rollAgeEvents,
  rollMicroEvents,
  rollMonthlyEvents,
  rollWeeklyEvents,
  rollWorkEvent,
  rollYearlyEvents,
} from './event-rolls'

export {
  addActivityEntry,
  addCareerPendingSalary,
  addCareerWorkHours,
  addEventActivityEntry,
  addEventToQueue,
  addMoneyInWorld,
  applyPermanentSalaryMultiplier,
  addSkillXp,
  applySkillXp,
  addWorkActivityEntry,
  advanceHours,
  advanceHoursWithSleepInWorld,
  applySkillChanges,
  applyStatChanges,
  applyStatChangesRaw,
  calculateMonthlyReturnForWorld,
  clearEventQueue,
  collectCareerSalary,
  divestFromWorld,
  earnMoney,
  endCareerWork,
  getBaseModifiers,
  getSkillLevel,
  getSkillXp,
  hasSeenEvent,
  hasSkill,
  hasSkillLevel,
  initializeSkills,
  investInWorld,
  markEventSeen,
  processMonthlySettlementForWorld,
  promoteCareer,
  pushEventHistoryEntry,
  reduceSleepDebtInWorld,
  repayDebtInWorld,
  resetCareerWeek,
  resetEvents,
  restoreAllStatsInWorld,
  setEnergyInWorld,
  setExpenseInWorld,
  setMoneyInWorld,
  setSkillLevel,
  setStatsInWorld,
  setTotalHoursInWorld,
  shiftNextEvent,
  spendMoney,
  startCareerWork,
  takeDebtInWorld,
  transferFromReserveInWorld,
  transferToReserveInWorld,
} from './mutations'

export { findPendingEventPayload, completePendingEventResolution } from '../pending-event'

export type {
  CommandRejectionReason,
  CommandResult,
  DayPlanInput,
  DayPlanResult,
  DayPlanStepResult,
  DomainActionRequirements,
  EventChoicePayload,
  ExecuteActionResult,
  GameEventPayload,
  ResolveEventResult,
  WorkShiftResult,
} from './commands.types'
