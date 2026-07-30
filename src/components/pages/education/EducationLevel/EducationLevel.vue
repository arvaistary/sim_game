<template>
  <RoundedPanel>
    <div class="education-level-wrap">
      <h3 class="section-title">Что изучаем</h3>
      

      <div v-if="courseTiles.length > 0" class="courses-grid">
        <article
          v-for="tile in courseTiles"
          :key="tile.key"
          class="course-tile"
          :class="{
            'course-tile--active': tile.status === 'active',
            'course-tile--active-book': tile.status === 'active' && isBookCourse,
            'course-tile--active-course': tile.status === 'active' && !isBookCourse,
          }"
          :role="tile.status === 'active' && canOpenStudyModal ? 'button' : undefined"
          :tabindex="tile.status === 'active' && canOpenStudyModal ? 0 : undefined"
          @click="tile.status === 'active' && openStudyModal()"
          @keydown.enter.prevent="tile.status === 'active' && openStudyModal()"
          @keydown.space.prevent="tile.status === 'active' && openStudyModal()"
        >
          <template v-if="tile.status === 'active'">
            <div class="active-study-card__info">
              <div class="active-study-card__heading">
                <span class="active-study-card__icon" aria-hidden="true">{{ isBookCourse ? '📖' : '🎓' }}</span>
                <div class="active-study-card__heading-copy">
                  <div class="active-study-card__pills">
                    <span
                      class="course-tile__badge"
                      :class="isBookCourse ? 'course-tile__badge--book' : 'course-tile__badge--course'"
                    >
                      {{ isBookCourse ? 'Читаем' : 'Изучаем' }}
                    </span>
                    <span v-if="activeCourse?.type" class="course-tile__badge course-tile__badge--type">{{ activeCourse.type }}</span>
                    <span class="study-status-pill" :class="`study-status-pill--${studyStatusTone}`">{{ studyStatusLabel }}</span>
                  </div>
                  <h4 class="course-tile__title">{{ activeCourse?.name }}</h4>
                  <p class="active-study-card__step">{{ activeStepSummary }}</p>
                </div>
              </div>

              <div v-if="!currentStep" class="step-info step-info--pending">
                <span class="step-label">Не удалось загрузить шаги программы</span>
                <span class="step-counter">Обновите страницу или дождитесь следующей загрузки сохранения</span>
              </div>
              <div v-else class="active-study-card__progress">
                <div class="progress-details">
                  <span>Шаг {{ currentStepIndex + 1 }} из {{ totalSteps }}</span>
                  <span v-if="hoursRemaining > 0">Осталось {{ hoursRemaining.toFixed(1) }} ч</span>
                </div>
                <div class="progress-bar" aria-label="Прогресс обучения">
                  <div class="progress-fill" :class="efficiencyClass" :style="{ width: `${overallProgress}%` }" />
                </div>
              </div>

              <div v-if="inlineStudyWarning" class="study-inline-warning">{{ inlineStudyWarning }}</div>
              <div v-if="studyCycleBlockedWithCourseHoursLeft" class="study-cycle-course-mismatch">
                <span class="study-cycle-course-mismatch__icon" aria-hidden="true">⚠️</span>
                <p class="study-cycle-course-mismatch__text">По курсу ещё есть часы, но следующий сеанс доступен после сна.</p>
              </div>

              <div class="active-study-card__secondary">
                <span>🌙 Учёба до сна: {{ studyHoursSinceLastSleepDisplay }}/{{ maxStudyHoursCycleDisplay }} ч</span>
                <span>🗓️ Свободно на неделе: {{ weekHoursRemainingDisplay }} ч</span>
              </div>
            </div>

            <div class="active-study-card__divider" aria-hidden="true" />

            <button
              class="active-study-card__action"
              type="button"
              :aria-label="`Открыть ${isBookCourse ? `главу ${currentStepIndex + 1}` : `шаг ${currentStepIndex + 1}`}`"
              @click.stop="openStudyModal"
            >
              <svg class="progress-ring" viewBox="0 0 76 76" role="img" :aria-label="`Прогресс: шаг ${currentStepIndex + 1} из ${totalSteps}`">
                <circle class="progress-ring__track" cx="38" cy="38" r="32" />
                <circle class="progress-ring__value" cx="38" cy="38" r="32" :stroke-dashoffset="progressRingDashOffset" />
                <text x="38" y="34" text-anchor="middle" class="progress-ring__number">{{ currentStepIndex + 1 }}/{{ totalSteps }}</text>
                <text x="38" y="48" text-anchor="middle" class="progress-ring__label">шагов</text>
              </svg>
              <span class="active-study-card__action-label">{{ isBookCourse ? `Глава ${currentStepIndex + 1}` : `Шаг ${currentStepIndex + 1}` }}</span>
              <span class="active-study-card__action-hint">Нажмите, чтобы читать</span>
            </button>
          </template>

          <template v-else>
            <span class="course-tile__badge course-tile__badge--done">Завершён</span>
            <h4 class="course-tile__title">{{ tile.record.name }}</h4>
            <p v-if="tile.record.typeLabel" class="course-tile__type">{{ tile.record.typeLabel }}</p>
            <p v-if="tile.record.completedAtGameDay != null" class="course-tile__meta">
              Завершено: игровой день {{ tile.record.completedAtGameDay }}
            </p>
          </template>
        </article>
      </div>

      <div v-else class="no-course">
        <p class="no-course-text">Выберите программу обучения ниже</p>
      </div>
    </div>

    <StudyModal
      :is-open="isStudyModalOpen"
      :course-name="modalCourse?.name ?? ''"
      :course-description="modalCourseDescription"
      :current-step="modalCurrentStepIndex"
      :total-steps="modalTotalSteps"
      :is-book="modalIsBookCourse"
      :step-content="modalStepContent"
      :hours-remaining="modalHoursRemaining"
      :can-continue="canContinueStudy && !!activeCourse"
      :is-reading="isReading"
      :can-finish="!!activeCourse"
      :resource-warning="resourceWarning"
      @read="handleRead"
      @finish="handleFinishStudy"
      @close="closeStudyModal"
    />
  </RoundedPanel>
</template>

<script setup lang="ts">
import type { ComputedRef } from 'vue'
import type { ActiveCourse, ActiveCourseStep, CanAddStudyHoursResult, CompletedProgramRecord, NeedsState } from '@/stores/education-store'
import {
  EDUCATION_LONG_STEP_MAX_ENERGY_DRAIN,
  ENERGY_EXHAUSTION_THRESHOLD_STUDY,
  COGNITIVE_LOAD_CONSTANTS,
  canAddStudyHours,
  getNeedsStateFromComponents,
} from '@/stores/education-store'
import type { CourseTile } from './EducationLevel.types'
import { EDUCATION_PROGRAMS, upgradeBookChapterSteps } from '@/domain/balance/constants/education-programs'

const store = useGameStore()

const educationStore = useEducationStore()

const toast = useToast()

const activeCourse: ComputedRef<ActiveCourse | null> = computed(() => {
  void store.worldTick
  const edu: Record<string, unknown> | null = store.education as unknown as Record<string, unknown> | null
  const courses: ActiveCourse[] | null = edu?.activeCourses as ActiveCourse[] | null

  if (!courses || courses.length === 0) return null

  const source: ActiveCourse = courses[0]!
  const catalog = EDUCATION_PROGRAMS.find(program => program.id === source.id)
  const hasStoredSteps = Array.isArray(source.steps) && source.steps.length > 0
  const catalogSteps: ActiveCourseStep[] = (catalog?.steps ?? []).map(step => ({
    id: step.id,
    title: step.title,
    hoursRequired: step.hoursRequired,
    progressPercent: 0,
    ...(step.milestoneReward ? { milestoneReward: step.milestoneReward } : {}),
  }))
  const storedSteps: ActiveCourseStep[] = hasStoredSteps ? source.steps!.map(step => ({ ...step })) : []
  const upgradedBookSteps = upgradeBookChapterSteps(catalog, storedSteps)
  const steps: ActiveCourseStep[] = upgradedBookSteps
    ? upgradedBookSteps.map(step => ({ ...step }))
    : hasStoredSteps
      ? storedSteps
    : catalogSteps
  const totalHours = steps.reduce((total, step) => total + (step.hoursRequired ?? 0), 0)
  const completedHours = steps.reduce((total, step) => total + (step.hoursRequired ?? 0) * (step.progressPercent ?? 0), 0)
  const migratedCurrentStepIndex = Math.max(0, steps.findIndex(step => (step.progressPercent ?? 0) < 1))
  return {
    ...source,
    name: source.name && source.name !== source.id ? source.name : (catalog?.title ?? source.id),
    type: source.type ?? catalog?.typeLabel,
    steps,
    ...(upgradedBookSteps
      ? {
          progress: totalHours > 0 ? completedHours / totalHours : 1,
          hoursTotal: totalHours,
          hoursRemaining: Math.max(0, totalHours - completedHours),
          currentStepIndex: migratedCurrentStepIndex,
        }
      : hasStoredSteps || totalHours <= 0
        ? {}
      : {
          progress: 0,
          hoursTotal: totalHours,
          hoursRemaining: totalHours,
          currentStepIndex: 0,
        }),
  } as ActiveCourse
})

const currentStepIndex: ComputedRef<number> = computed(() => {
  return activeCourse.value?.currentStepIndex ?? 0
})

const steps: ComputedRef<ActiveCourseStep[]> = computed(() => {
  return activeCourse.value?.steps ?? []
})

const totalSteps: ComputedRef<number> = computed(() => steps.value.length)

const currentStep: ComputedRef<ActiveCourseStep | null> = computed(() => {

  if (steps.value.length === 0) return null

  return steps.value[currentStepIndex.value] ?? null
})

const isBookCourse: ComputedRef<boolean> = computed(() => {
  const type: string = activeCourse.value?.type?.toLowerCase() ?? ''

  return type.includes('книга')
})

const overallProgress: ComputedRef<number> = computed(() => {

  if (!activeCourse.value || steps.value.length === 0) return 0

  const progress: number = activeCourse.value.progress ?? 0

  return Math.max(0, Math.min(100, progress * 100))
})

const activeStepSummary: ComputedRef<string> = computed(() => {
  if (!currentStep.value) return 'Подготавливаем программу обучения'

  return `Этап ${currentStepIndex.value + 1} из ${totalSteps.value} — ${currentStep.value.title}`
})

const progressRingDashOffset: ComputedRef<number> = computed(() => {
  const circumference: number = 201
  return circumference * (1 - (overallProgress.value / 100))
})

const hoursRemaining: ComputedRef<number> = computed(() => {

  if (!steps.value.length) return 0

  return steps.value.reduce((total: number, step: typeof steps.value[number], index: number) => {
    if (index < currentStepIndex.value) return total

    const stepProgress: number = Math.max(0, Math.min(1, step.progressPercent ?? 0))

    return total + ((step.hoursRequired ?? 0) * (1 - stepProgress))
  }, 0)
})

const cognitiveLoadValue: ComputedRef<number> = computed(() => {
  return educationStore.cognitiveLoad
})

const studyHoursSinceLastSleep: ComputedRef<number> = computed(() => {
  return educationStore.studyHoursSinceLastSleep
})

const studyHoursSinceLastSleepDisplay: ComputedRef<number> = computed(() => Math.round(studyHoursSinceLastSleep.value))

/** Максимальное количество учебных часов в одном цикле (константа) */
const maxStudyHoursCycle = COGNITIVE_LOAD_CONSTANTS.MAX_STUDY_HOURS_CYCLE
const maxStudyHoursCycleDisplay: number = Math.round(maxStudyHoursCycle)

const canOpenStudyModal: ComputedRef<boolean> = computed(() => !!activeCourse.value && !!currentStep.value)

/** Блокировка по накопительной усталости */
const dailyStudyHoursBlocked: ComputedRef<boolean> = computed(() => {
  return studyHoursSinceLastSleep.value >= maxStudyHoursCycle
})

/** Лимит «учёбы до сна» исчерпан (или не хватает часов под сеанс), но по курсу ещё есть бюджет часов */
const studyCycleBlockedWithCourseHoursLeft: ComputedRef<boolean> = computed(
  () =>
    !!activeCourse.value &&
    !!currentStep.value &&
    dailyStudyHoursBlocked.value &&
    hoursRemaining.value > 0,
)

/** Истощение для учёбы привязано к энергии персонажа (как на главной), не к когнитивной шкале */
const energyExhaustedForStudy: ComputedRef<boolean> = computed(() => (store.energy ?? 0) < ENERGY_EXHAUSTION_THRESHOLD_STUDY)

/** Пессимистичная проверка: при макс. расходе за шаг энергия не должна уходить в 0 */
const energyWouldHitZeroOnStep: ComputedRef<boolean> = computed(() => (store.energy ?? 0) <= EDUCATION_LONG_STEP_MAX_ENERGY_DRAIN)

const canStudy: ComputedRef<boolean> = computed(() => {

  if (!activeCourse.value) return false

  if (!currentStep.value) return false

  if (energyExhaustedForStudy.value) return false

  if (energyWouldHitZeroOnStep.value) return false

  if (!canAddStudyHours(cognitiveLoadValue.value, store.energy ?? 0).canDo) return false

  if (dailyStudyHoursBlocked.value) return false

  return true
})

const studyStatusTone: ComputedRef<string> = computed(() => {

  if (!activeCourse.value || !currentStep.value) return 'idle'

  if (canStudy.value) return 'active'

  if (resourceWarning.value) return 'paused'

  return 'idle'
})

const studyStatusLabel: ComputedRef<string> = computed(() => {

  if (!activeCourse.value || !currentStep.value) return 'Нет активного обучения'

  if (canStudy.value) return isBookCourse.value ? 'Можно читать' : 'Можно продолжить'

  return 'Пауза'
})

const isStudyModalOpen = ref(false)
const isReading = ref(false)
const modalCourseSnapshot = ref<ActiveCourse | null>(null)

const modalCourse: ComputedRef<ActiveCourse | null> = computed(() => activeCourse.value ?? modalCourseSnapshot.value)

const modalCurrentStepIndex: ComputedRef<number> = computed(() => {
  if (activeCourse.value) return currentStepIndex.value

  return Math.max(0, (modalCourse.value?.steps?.length ?? 1) - 1)
})

const modalTotalSteps: ComputedRef<number> = computed(() => modalCourse.value?.steps?.length ?? 0)

const modalIsBookCourse: ComputedRef<boolean> = computed(() => {
  return (modalCourse.value?.type?.toLowerCase() ?? '').includes('книга')
})

const activeCourseDescription: ComputedRef<string> = computed(() => {
  if (!activeCourse.value) return ''

  return EDUCATION_PROGRAMS.find(program => program.id === activeCourse.value?.id)?.description
    ?? 'Изучайте материал в своём темпе и возвращайтесь к шагу, когда будете готовы.'
})

const modalCourseDescription: ComputedRef<string> = computed(() => {
  if (!modalCourse.value) return ''

  return EDUCATION_PROGRAMS.find(program => program.id === modalCourse.value?.id)?.description
    ?? activeCourseDescription.value
})

const weekHoursRemainingDisplay: ComputedRef<number> = computed(() => {
  const time: Record<string, number> | null = store.time as unknown as Record<string, number> | null
  return Math.round(time?.weekHoursRemaining ?? 0)
})

const modalStepContent: ComputedRef<string> = computed(() => {
  const program = EDUCATION_PROGRAMS.find(candidate => candidate.id === modalCourse.value?.id)
  const content = program?.steps?.[modalCurrentStepIndex.value]?.content

  return content ?? modalCourse.value?.steps?.[modalCurrentStepIndex.value]?.title ?? modalCourseDescription.value
})

const modalHoursRemaining: ComputedRef<number> = computed(() => activeCourse.value ? hoursRemaining.value : 0)

const canContinueStudy: ComputedRef<boolean> = computed(() => {

  if (!activeCourse.value) return false

  if (!currentStep.value) return false

  if (energyExhaustedForStudy.value) return false

  if (energyWouldHitZeroOnStep.value) return false

  if (!canAddStudyHours(cognitiveLoadValue.value, store.energy ?? 0).canDo) return false

  if (dailyStudyHoursBlocked.value) return false

  return true
})

const canFinishStudy: ComputedRef<boolean> = computed(() => !!activeCourse.value)

const resourceWarning: ComputedRef<string | null | undefined> = computed(() => {
  const needs: NeedsState = getNeedsStateFromComponents((store.stats as unknown as Record<string, number>) ?? {})

  if (needs.hunger < 10) {
    return 'Вы слишком голодны для учёбы. Сначала поешьте, потом возвращайтесь к чтению.'
  }

  if (energyExhaustedForStudy.value) {
    return `Энергия ниже ${ENERGY_EXHAUSTION_THRESHOLD_STUDY}% — истощение. Восстановите силы, прежде чем учиться.`
  }

  if (energyWouldHitZeroOnStep.value) {
    return 'Этого занятия не хватает: при текущей энергии шаг опустил бы запас до нуля или ниже.'
  }

  const cognitiveCheck: CanAddStudyHoursResult = canAddStudyHours(cognitiveLoadValue.value, store.energy ?? 0)
  if (!cognitiveCheck.canDo) return cognitiveCheck.reason ?? 'Когнитивная нагрузка слишком высока'

  if (dailyStudyHoursBlocked.value) {
    const canStudyCheck: CanAddStudyHoursResult = canAddStudyHours(cognitiveLoadValue.value, store.energy ?? 0)

    if (canStudyCheck.canDo) {
      if (hoursRemaining.value > 0) {
        return `${canStudyCheck.reason}\n\nШкала «когнитивной нагрузки» может быть в норме — она не отражает лимит «учёбы до сна» (${studyHoursSinceLastSleepDisplay.value}/${maxStudyHoursCycleDisplay} ч).`
      }

      return canStudyCheck.reason
    }

    return 'Лимит учёбы исчерпан. Поспите для восстановления.'
  }

  return null
})

const inlineStudyWarning: ComputedRef<string | null> = computed(() => {
  if (!resourceWarning.value) return null

  return resourceWarning.value.split('\n')[0] ?? resourceWarning.value
})

const completedProgramsForGrid: ComputedRef<CompletedProgramRecord[]> = computed(() => {
  const edu: Record<string, unknown> | null = store.education as unknown as Record<string, unknown> | null
  const raw: unknown = edu?.completedPrograms
  const list: CompletedProgramRecord[] = (Array.isArray(raw) ? raw : []) as CompletedProgramRecord[]

  const activeId: string | undefined = activeCourse.value?.id

  return list
    .filter((c) => c.id !== activeId)
    .sort((a, b) => (b.completedAtGameDay ?? 0) - (a.completedAtGameDay ?? 0))
})

const courseTiles = computed<CourseTile[]>(() => {
  const tiles: CourseTile[] = []

  if (activeCourse.value) {
    tiles.push({ key: `active-${activeCourse.value.id}`, status: 'active' })
  }

  for (const record of completedProgramsForGrid.value) {
    tiles.push({ key: `done-${record.id}`, status: 'completed', record })
  }

  return tiles
})

function openStudyModal() {
  if (!canOpenStudyModal.value) return

  modalCourseSnapshot.value = activeCourse.value
    ? { ...activeCourse.value, steps: activeCourse.value.steps?.map(step => ({ ...step })) }
    : null
  isStudyModalOpen.value = true
}

function closeStudyModal() {
  isStudyModalOpen.value = false
  modalCourseSnapshot.value = null
}

async function handleRead(): Promise<void> {
  if (!canContinueStudy.value || isReading.value) return

  isReading.value = true
  try {
    await store.advanceEducationAsync()
    if (!activeCourse.value) {
      toast.showSuccess('Обучение завершено')
    }
  } catch (error) {
    toast.showError(error instanceof Error ? error.message : 'Не удалось продолжить обучение')
  } finally {
    isReading.value = false
  }
}

function handleFinishStudy() {
  if (!canFinishStudy.value) return

  closeStudyModal()
}

const efficiencyClass: ComputedRef<string> = computed(() => {
  const progress: number = overallProgress.value

  if (progress >= 75) return 'efficiency-high'

  if (progress >= 50) return 'efficiency-medium'

  if (progress >= 25) return 'efficiency-low'

  return 'efficiency-very-low'
})

</script>

<style scoped lang="scss" src="./EducationLevel.scss"></style>
