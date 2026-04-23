import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface TimeState {
  totalHours: number
  gameDays: number
  gameWeeks: number
  gameMonths: number
  gameYears: number
  currentAge: number
  sleepDebt: number
}

const INITIAL_STATE: TimeState = {
  totalHours: 0,
  gameDays: 0,
  gameWeeks: 0,
  gameMonths: 0,
  gameYears: 0,
  currentAge: 18,
  sleepDebt: 0,
}

const START_AGE = 18

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export const useTimeStore = defineStore('time', () => {
  const totalHours = ref(INITIAL_STATE.totalHours)
  const sleepDebt = ref(INITIAL_STATE.sleepDebt)
  const startAge = ref(START_AGE)

  const gameDays = computed(() => Math.floor(totalHours.value / 24))
  const gameWeeks = computed(() => Math.floor(gameDays.value / 7))
  const gameMonths = computed(() => Math.floor(gameDays.value / 30))
  const gameYears = computed(() => Math.floor(gameDays.value / 365))
  const currentAge = computed(() => startAge.value + gameYears.value)

  const dayHour = computed(() => totalHours.value % 24)
  const dayHoursRemaining = computed(() => 24 - dayHour.value)

  const weekHour = computed(() => totalHours.value % (24 * 7))
  const weekHoursRemaining = computed(() => 168 - weekHour.value)

  const gameWeeksFloored = computed(() => Math.floor(totalHours.value / (24 * 7)))

  function advanceHours(hours: number, options?: { actionType?: 'sleep' | 'work' | 'default' }) {
    totalHours.value += hours

    if (options?.actionType !== 'sleep') {
      const debtGain = hours * 0.5
      sleepDebt.value = clamp(sleepDebt.value + debtGain, 0, 100)
    }
  }

  function advanceHoursWithSleep(hours: number, sleepHours: number) {
    totalHours.value += hours
    sleepDebt.value = clamp(sleepDebt.value - sleepHours * 2, 0, 100)
  }

  function reduceSleepDebt(amount: number) {
    sleepDebt.value = clamp(sleepDebt.value - amount, 0, 100)
  }

  function setTotalHours(hours: number) {
    totalHours.value = hours
  }

  function reset() {
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