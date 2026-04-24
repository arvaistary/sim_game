
export const useEducation = () => {
  const educationStore = useEducationStore()

  return {
    school: computed(() => educationStore.school),
    institute: computed(() => educationStore.institute),
    educationLevel: computed(() => educationStore.educationLevel),
    activeEducation: computed(() => educationStore.activeEducation),
    completedPrograms: computed(() => educationStore.completedPrograms),
    educationRank: computed(() => educationStore.educationRank),
    educationLabel: computed(() => educationStore.educationLabel),
    isStudying: computed(() => educationStore.isStudying),
    hasEducation: computed(() => educationStore.hasEducation),
    completedCount: computed(() => educationStore.completedCount),
    canStartProgram: educationStore.canStartProgram,
    setSchool: educationStore.setSchool,
    setInstitute: educationStore.setInstitute,
    setEducationLevel: educationStore.setEducationLevel,
    startProgram: educationStore.startProgram,
    updateProgress: educationStore.updateProgress,
    completeProgram: educationStore.completeProgram,
    cancelProgram: educationStore.cancelProgram,
    getProgramBonus: educationStore.getProgramBonus,
    reset: educationStore.reset,
  }
}