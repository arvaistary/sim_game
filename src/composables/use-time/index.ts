import { computed } from 'vue'
import { useTimeStore } from '@/stores'

export const useTime = () => {
  const timeStore = useTimeStore()

  return {
    totalHours: computed(() => timeStore.totalHours),
    sleepDebt: computed(() => timeStore.sleepDebt),
    gameDays: computed(() => timeStore.gameDays),
    gameWeeks: computed(() => timeStore.gameWeeks),
    gameMonths: computed(() => timeStore.gameMonths),
    gameYears: computed(() => timeStore.gameYears),
    currentAge: computed(() => timeStore.currentAge),
    dayHour: computed(() => timeStore.dayHour),
    dayHoursRemaining: computed(() => timeStore.dayHoursRemaining),
    weekHour: computed(() => timeStore.weekHour),
    weekHoursRemaining: computed(() => timeStore.weekHoursRemaining),
    advanceHours: timeStore.advanceHours,
    advanceHoursWithSleep: timeStore.advanceHoursWithSleep,
    reduceSleepDebt: timeStore.reduceSleepDebt,
    setTotalHours: timeStore.setTotalHours,
    reset: timeStore.reset,
  }
}