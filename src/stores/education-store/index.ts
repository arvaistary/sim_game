

import type {
  EducationLevel,
  CompletedProgram,
  ActiveEducation,
  NeedsState,
  CognitiveLoadStatus,
  CanAddStudyHoursResult,
} from './education-store.types'
import { EDUCATION_PROGRAMS, upgradeBookChapterSteps } from '@/domain/balance/constants/education-programs'

export type {
  EducationLevel,
  CompletedProgram,
  CompletedProgramRecord,
  MilestoneReward,
  ActiveCourseStep,
  ActiveCourse,
  ActiveEducation,
  NeedsState,
  CognitiveLoadStatus,
  CanAddStudyHoursResult,
  CognitiveLoadComponent,
} from './education-store.types'

export const EDUCATION_RANK: Record<EducationLevel, number> = {
  none: 0,
  school: 1,
  college: 2,
  bachelor: 3,
  master: 4,
  phd: 5,
}

export const RANK_LABELS: Record<EducationLevel, string> = {
  none: 'Нет',
  school: 'Школа',
  college: 'Колледж',
  bachelor: 'Бакалавриат',
  master: 'Магистратура',
  phd: 'Аспирантура',
}

export const EDUCATION_LONG_STEP_MAX_ENERGY_DRAIN: number = 15
export const ENERGY_EXHAUSTION_THRESHOLD_STUDY: number = 20
export const EDUCATION_LONG_PROGRAM_STEP_HOURS: number = 4
export const COGNITIVE_LOAD_CONSTANTS: Readonly<{
  LOW: number
  MEDIUM: number
  HIGH: number
  MAX_STUDY_HOURS_CYCLE: number
}> = {
  LOW: 30,
  MEDIUM: 60,
  HIGH: 80,
  MAX_STUDY_HOURS_CYCLE: 8,
} as const

function normalizeActiveEducation(data: ActiveEducation): ActiveEducation {
  const program = EDUCATION_PROGRAMS.find(candidate => candidate.id === data.id)
  const storedSteps = Array.isArray(data.steps) ? data.steps : []
  const upgradedSteps = upgradeBookChapterSteps(program, storedSteps)

  if (!upgradedSteps) return data

  const hoursTotal = upgradedSteps.reduce((total, step) => total + step.hoursRequired, 0)
  const completedHours = upgradedSteps.reduce(
    (total, step) => total + step.hoursRequired * step.progressPercent,
    0,
  )
  const currentStepIndex = Math.max(0, upgradedSteps.findIndex(step => step.progressPercent < 1))

  return {
    ...data,
    steps: upgradedSteps,
    hoursTotal,
    hoursRemaining: Math.max(0, hoursTotal - completedHours),
    progress: hoursTotal > 0 ? completedHours / hoursTotal : 1,
    currentStepIndex,
  }
}

/**
 * Извлекает состояние needs из компонент статов.
 * @description [Store] - формирует объект needs (energy, hunger, stress) из записи статов со значениями по умолчанию.
 * @return { NeedsState } состояние needs
 */
export function getNeedsStateFromComponents(stats: Record<string, number>): NeedsState {
  return {
    energy: stats.energy ?? 100,
    hunger: stats.hunger ?? 0,
    stress: stats.stress ?? 0,
  }
}

/**
 * Определяет статус когнитивной нагрузки.
 * @description [Store] - возвращает метку, описание и тональность для уровня когнитивной нагрузки.
 * @return { CognitiveLoadStatus } статус когнитивной нагрузки
 */
export function getCognitiveLoadStatus(cognitive: number): CognitiveLoadStatus {
  if (cognitive < COGNITIVE_LOAD_CONSTANTS.LOW) return { label: 'Низкая', description: 'Мозг свеж, можно учиться', tone: 'low' }

  if (cognitive < COGNITIVE_LOAD_CONSTANTS.MEDIUM) return { label: 'Средняя', description: 'Умеренная нагрузка', tone: 'medium' }

  return { label: 'Высокая', description: 'Когнитивная перегрузка, учиться нельзя', tone: 'high' }
}

/**
 * Проверяет возможность добавить учебные часы.
 * @description [Store] - проверяет когнитивную нагрузку и энергию, возвращает результат с причиной отказа.
 * @return { CanAddStudyHoursResult } результат проверки с причиной отказа
 */
export function canAddStudyHours(cognitive: number, energy: number): CanAddStudyHoursResult {
  if (cognitive >= COGNITIVE_LOAD_CONSTANTS.HIGH) {
    return { canDo: false, reason: 'Когнитивная нагрузка слишком высока' }
  }

  if (energy <= ENERGY_EXHAUSTION_THRESHOLD_STUDY) {
    return { canDo: false, reason: 'Энергия слишком низка для учёбы' }
  }

  return { canDo: true }
}

/**
 * Рассчитывает допустимое количество учебных часов за сессию.
 * @description [Store] - определяет максимальное количество часов учёбы на основе когнитивной нагрузки и энергии.
 * @return { number } допустимое количество часов (0–maxHours)
 */
export function resolveStudySessionHours(cognitive: number, energy: number, maxHours: number = 8): number {
  if (cognitive >= COGNITIVE_LOAD_CONSTANTS.HIGH || energy <= ENERGY_EXHAUSTION_THRESHOLD_STUDY) {
    return 0
  }

  if (cognitive < COGNITIVE_LOAD_CONSTANTS.LOW && energy > 80) {
    return maxHours
  }

  return Math.floor(maxHours / 2)
}

export const useEducationStore = defineStore('education', () => {
  const school: Ref<string> = ref('')
  const institute: Ref<string> = ref('')
  const educationLevel: Ref<EducationLevel> = ref<EducationLevel>('none')
  const activeEducation: Ref<ActiveEducation | null> = ref<ActiveEducation | null>(null)
  const completedPrograms: Ref<CompletedProgram[]> = ref<CompletedProgram[]>([])
  const cognitiveLoad: Ref<number> = ref<number>(0)
  const studyHoursSinceLastSleep: Ref<number> = ref<number>(0)

  const educationRank: ComputedRef<number> = computed(() => EDUCATION_RANK[educationLevel.value])
  const educationLabel: ComputedRef<string> = computed(() => RANK_LABELS[educationLevel.value])

  const isStudying: ComputedRef<boolean> = computed(() => activeEducation.value !== null)
  const hasEducation: ComputedRef<boolean> = computed(() => educationLevel.value !== 'none')
  const completedCount: ComputedRef<number> = computed(() => completedPrograms.value.length)

  const canStartProgram = (programLevel: EducationLevel): boolean => {
    return educationRank.value < EDUCATION_RANK[programLevel] && !activeEducation.value
  }

  const canStartProgramById = (_programId: string): boolean => {
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

    if ('activeEducation' in data) {
      const active = data.activeEducation as ActiveEducation | null
      activeEducation.value = active ? normalizeActiveEducation(active) : null
    }

    if (Array.isArray(data.completedPrograms)) completedPrograms.value = data.completedPrograms as CompletedProgram[]

    if (typeof data.cognitiveLoad === 'number') cognitiveLoad.value = data.cognitiveLoad

    if (typeof data.studyHoursSinceLastSleep === 'number') studyHoursSinceLastSleep.value = data.studyHoursSinceLastSleep
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
