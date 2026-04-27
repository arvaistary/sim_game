
import type { TimeState } from './index.types'
import { INITIAL_STATE, START_AGE } from './index.constants'
import { clamp } from '@utils/clamp'

export const useTimeStore = defineStore('time', () => {
  const totalHours = ref<number>(INITIAL_STATE.totalHours)
  const sleepDebt = ref<number>(INITIAL_STATE.sleepDebt)
  const startAge = ref<number>(START_AGE)

  const gameDays = computed<number>(() => Math.floor(totalHours.value / 24))
  const gameWeeks = computed<number>(() => Math.floor(gameDays.value / 7))
  const gameMonths = computed<number>(() => Math.floor(gameDays.value / 30))
  const gameYears = computed<number>(() => Math.floor(gameDays.value / 365))
  const currentAge = computed<number>(() => startAge.value + gameYears.value)

  const dayHour = computed<number>(() => totalHours.value % 24)
  const dayHoursRemaining = computed<number>(() => 24 - dayHour.value)

  const weekHour = computed<number>(() => totalHours.value % (24 * 7))
  const weekHoursRemaining = computed<number>(() => 168 - weekHour.value)

  const gameWeeksFloored = computed<number>(() => Math.floor(totalHours.value / (24 * 7)))

  function advanceHours(hours: number, options?: { actionType?: 'sleep' | 'work' | 'default' }): void {
    totalHours.value += hours

    if (options?.actionType !== 'sleep') {
      const debtGain: number = hours * 0.5
      sleepDebt.value = clamp(sleepDebt.value + debtGain, 0, 100)
    }
  }

  function advanceHoursWithSleep(hours: number, sleepHours: number): void {
    totalHours.value += hours
    sleepDebt.value = clamp(sleepDebt.value - sleepHours * 2, 0, 100)
  }

  function reduceSleepDebt(amount: number): void {
    sleepDebt.value = clamp(sleepDebt.value - amount, 0, 100)
  }

  function setTotalHours(hours: number): void {
    totalHours.value = hours
  }

  function reset(): void {
    totalHours.value = INITIAL_STATE.totalHours
    sleepDebt.value = INITIAL_STATE.sleepDebt
  }

  function save(): Record<string, unknown> {
    return {
      totalHours: totalHours.value,
      sleepDebt: sleepDebt.value,
      startAge: startAge.value,
    }
  }

  function load(data: Record<string, unknown>): void {
    if (typeof data.totalHours === 'number') totalHours.value = data.totalHours

    if (typeof data.sleepDebt === 'number') sleepDebt.value = data.sleepDebt

    if (typeof data.startAge === 'number') startAge.value = data.startAge
  }

  return {
    totalHours,
    sleepDebt,
    startAge,
    gameDays,
    gameWeeks,
    gameMonths,
    gameYears,
    currentAge,
    dayHour,
    dayHoursRemaining,
    weekHour,
    weekHoursRemaining,
    gameWeeksFloored,
    advanceHours,
    advanceHoursWithSleep,
    reduceSleepDebt,
    setTotalHours,
    reset,
    save,
    load,
  }
})
