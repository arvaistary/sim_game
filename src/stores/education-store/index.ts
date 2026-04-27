
import type { EducationLevel, ActiveEducation, CompletedProgram } from './index.types'
import { EDUCATION_RANK, RANK_LABELS } from './index.constants'

export const useEducationStore = defineStore('education', () => {
  const school = ref<string>('')
  const institute = ref<string>('')
  const educationLevel = ref<EducationLevel>('none')
  const activeEducation = ref<ActiveEducation | null>(null)
  const completedPrograms = ref<CompletedProgram[]>([])
  const cognitiveLoad = ref<number>(0)
  const studyHoursSinceLastSleep = ref<number>(0)

  const educationRank = computed<number>(() => EDUCATION_RANK[educationLevel.value])
  const educationLabel = computed<string>(() => RANK_LABELS[educationLevel.value])

  const isStudying = computed<boolean>(() => activeEducation.value !== null)
  const hasEducation = computed<boolean>(() => educationLevel.value !== 'none')
  const completedCount = computed<number>(() => completedPrograms.value.length)

  const canStartProgram = (programLevel: EducationLevel): boolean => {
    return educationRank.value < EDUCATION_RANK[programLevel] && !activeEducation.value
  }

  const canStartProgramById = (programId: string): boolean => {
    return !activeEducation.value
  }

  function setSchool(name: string): void {
    school.value = name

    if (educationLevel.value === 'none') {
      educationLevel.value = 'school'
    }
  }

  function setInstitute(name: string): void {
    institute.value = name

    if (educationLevel.value === 'none') {
      educationLevel.value = 'bachelor'
    }
  }

  function setEducationLevel(level: EducationLevel): void {
    educationLevel.value = level
  }

  function startProgram(program: ActiveEducation): void {
    activeEducation.value = program
  }

  function updateProgress(hoursSpent: number): void {
    if (!activeEducation.value) return

    activeEducation.value.progress = Math.min(100, activeEducation.value.progress + hoursSpent)
    activeEducation.value.hoursRemaining = Math.max(0, activeEducation.value.hoursRemaining - hoursSpent)
  }

  function completeProgram(program: CompletedProgram): void {
    if (activeEducation.value) {
      completedPrograms.value.push({
        ...program,
        completedAtGameDay: Date.now(),
      })
      activeEducation.value = null
    }
  }

  function cancelProgram(): void {
    activeEducation.value = null
  }

  function getProgramBonus(): number {
    const rank: number = educationRank.value

    if (rank >= 4) return 12

    if (rank >= 3) return 10

    if (rank >= 2) return 6

    if (rank >= 1) return 3

    return 0
  }

  function startProgramById(programId: string, name: string, hours: number): void {
    activeEducation.value = {
      id: programId,
      name,
      progress: 0,
      hoursTotal: hours,
      hoursRemaining: hours,
    }
  }

  function advance(hours: number = 1): string | null {
    if (!activeEducation.value) return null

    updateProgress(hours)

    if (activeEducation.value.hoursRemaining <= 0) {
      const completed: CompletedProgram = {
        id: activeEducation.value.id,
        name: activeEducation.value.name,
        completedAtGameDay: 0,
      }
      completeProgram(completed)

      return completed.name
    }

    return null
  }

  function reset(): void {
    school.value = ''
    institute.value = ''
    educationLevel.value = 'none'
    activeEducation.value = null
    completedPrograms.value = []
    cognitiveLoad.value = 0
    studyHoursSinceLastSleep.value = 0
  }

  function save(): Record<string, unknown> {
    return {
      school: school.value,
      institute: institute.value,
      educationLevel: educationLevel.value,
      activeEducation: activeEducation.value,
      completedPrograms: completedPrograms.value,
      cognitiveLoad: cognitiveLoad.value,
      studyHoursSinceLastSleep: studyHoursSinceLastSleep.value,
    }
  }

  function load(data: Record<string, unknown>): void {
    if (data.school) school.value = data.school as string

    if (data.institute) institute.value = data.institute as string

    if (data.educationLevel) educationLevel.value = data.educationLevel as EducationLevel

    if (data.activeEducation) activeEducation.value = data.activeEducation as ActiveEducation | null

    if (data.completedPrograms) completedPrograms.value = data.completedPrograms as CompletedProgram[]

    if (data.cognitiveLoad) cognitiveLoad.value = data.cognitiveLoad as number

    if (data.studyHoursSinceLastSleep) studyHoursSinceLastSleep.value = data.studyHoursSinceLastSleep as number
  }

  return {
    school,
    institute,
    educationLevel,
    activeEducation,
    completedPrograms,
    cognitiveLoad,
    studyHoursSinceLastSleep,
    educationRank,
    educationLabel,
    isStudying,
    hasEducation,
    completedCount,
    canStartProgram,
    canStartProgramById,
    setSchool,
    setInstitute,
    setEducationLevel,
    startProgram,
    startProgramById,
    updateProgress,
    completeProgram,
    cancelProgram,
    getProgramBonus,
    advance,
    reset,
    save,
    load,
  }
})
