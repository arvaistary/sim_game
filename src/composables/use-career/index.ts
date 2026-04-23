import { computed } from 'vue'
import { useCareerStore } from '@/stores'

export const useCareer = () => {
  const careerStore = useCareerStore()

  return {
    currentJob: computed(() => careerStore.currentJob),
    jobHistory: computed(() => careerStore.jobHistory),
    careerLevel: computed(() => careerStore.careerLevel),
    promotions: computed(() => careerStore.promotions),
    isEmployed: computed(() => careerStore.isEmployed),
    canWork: computed(() => careerStore.canWork),
    hasJob: computed(() => careerStore.hasJob),
    totalWorkedHours: computed(() => careerStore.totalWorkedHours),
    pendingSalary: computed(() => careerStore.pendingSalary),
    weeklyHoursRemaining: computed(() => careerStore.weeklyHoursRemaining),
    startWork: careerStore.startWork,
    endWork: careerStore.endWork,
    addWorkHours: careerStore.addWorkHours,
    addPendingSalary: careerStore.addPendingSalary,
    collectSalary: careerStore.collectSalary,
    resetWeek: careerStore.resetWeek,
    promote: careerStore.promote,
    setJob: careerStore.setJob,
    reset: careerStore.reset,
  }
}