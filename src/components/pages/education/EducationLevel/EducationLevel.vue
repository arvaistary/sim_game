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
        >
          <template v-if="tile.status === 'active'">
            <span
              class="course-tile__badge"
              :class="isBookCourse ? 'course-tile__badge--book' : 'course-tile__badge--course'"
            >
              {{ isBookCourse ? 'Читаем' : 'Изучаем' }}
            </span>
            <h4 class="course-tile__title">{{ activeCourse?.name }}</h4>
            <p v-if="activeCourse?.type" class="course-tile__type">{{ activeCourse.type }}</p>
            <p v-if="currentLearningFocus" class="course-tile__meta">
              Сейчас изучаете: {{ currentLearningFocus }}
            </p>
            <div class="study-status-row">
              <span class="study-status-pill" :class="`study-status-pill--${studyStatusTone}`">
                {{ studyStatusLabel }}
              </span>
              <span class="study-status-copy">{{ studyStatusHint }}</span>
            </div>
            <div class="course-progress">
              <div v-if="!currentStep" class="step-info step-info--pending">
                <span class="step-label">Не удалось загрузить шаги программы</span>
                <span class="step-counter">Сохранение будет исправлено при следующей загрузке или обновите страницу</span>
              </div>
              <div v-else class="step-info">
                <span class="step-label">{{ currentStep.title }}</span>
                <span class="step-counter">Шаг {{ currentStepIndex + 1 }} из {{ totalSteps }}</span>
              </div>
              <div v-if="currentStep" class="progress-bar">
                <div
                  class="progress-fill"
                  :class="efficiencyClass"
                  :style="{ width: `${overallProgress}%` }"
                />
              </div>
              <div v-if="currentStep" class="progress-details">
                <span class="progress-text">Прогресс: {{ overallProgress.toFixed(1) }}%</span>
                <span v-if="hoursRemaining > 0" class="hours-remaining">Осталось: {{ hoursRemaining.toFixed(1) }}ч</span>
              </div>

              <div v-if="inlineStudyWarning" class="study-inline-warning">
                {{ inlineStudyWarning }}
              </div>

              <Tooltip
                v-if="showStudyWakeHints"
                :text="studyWakeBudgetTooltipText"
                multiline
                placement="bottom"
                stretch
                pin-on-click
              >
                <div
                  class="study-wake-budget-line"
                  tabindex="0"
                  role="button"
                  :aria-label="studyWakeBudgetAriaLabel"
                >
                  <span class="study-wake-budget-line__label">Учёба до сна</span>
                  <span class="study-wake-budget-line__value">{{ studyHoursSinceLastSleepDisplay }}/{{ maxStudyHoursCycleDisplay }} ч</span>
                  <span class="study-wake-budget-line__hint" aria-hidden="true">?</span>
                </div>
              </Tooltip>

              <div
                v-if="studyCycleBlockedWithCourseHoursLeft"
                class="study-cycle-course-mismatch"
              >
                <span class="study-cycle-course-mismatch__icon" aria-hidden="true">&#x26a0;&#xfe0f;</span>
                <p class="study-cycle-course-mismatch__text">
                  По курсу ещё есть часы, но в этом цикле бодрствования вы не можете взять следующий сеанс
                  ({{ studySessionHoursDisplay }} ч). Поспите — счётчик «учёбы до сна» сбросится.
                </p>
              </div>

              <button
                class="study-button"
                :class="{ 'study-button--disabled': !canOpenStudyModal }"
                :disabled="!canOpenStudyModal"
                @click="openStudyModal"
              >
                <span class="study-icon" aria-hidden="true">&#x1f4d6;</span>
                <span class="study-text">{{ studyButtonText }}</span>
              </button>

              <div v-if="currentStep?.milestoneReward" class="milestone-reward">
                <span class="milestone-icon" aria-hidden="true">&#x1f381;</span>
                <span class="milestone-text">Награда за шаг:</span>
                <div v-if="currentStep.milestoneReward.statChanges" class="milestone-stats">
                  <span
                    v-for="(value, stat) in currentStep.milestoneReward.statChanges"
                    :key="stat"
                    class="stat-change"
                  >
                    {{ formatStatChange(stat, value) }}
                  </span>
                </div>
                <div v-if="currentStep.milestoneReward.skillChanges" class="milestone-skills">
                  <span
                    v-for="(value, skill) in currentStep.milestoneReward.skillChanges"
                    :key="skill"
                    class="skill-change"
                  >
                    {{ formatSkillChange(skill, value) }}
                  </span>
                </div>
                <p v-if="currentStep.milestoneReward.message" class="milestone-message">
                  {{ currentStep.milestoneReward.message }}
                </p>
              </div>
              <div v-if="showTimeHints && timeHint" class="time-hint">
                <span class="time-icon" aria-hidden="true">&#x23f0;</span>
                <span class="time-text">{{ timeHint }}</span>
              </div>
              <div v-if="showCognitiveHints && cognitiveLoadStatus" class="cognitive-load-hint">
                <div class="cognitive-load-hint__head">
                  <span class="cognitive-icon" aria-hidden="true">&#x1f9e0;</span>
                  <span class="cognitive-text">{{ cognitiveLoadStatus.label }}: {{ Math.round(cognitiveLoadValue) }}%</span>
                </div>
                <p class="cognitive-description">{{ cognitiveLoadStatus.description }}</p>
              </div>
            </div>
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
      :course-name="activeCourse?.name ?? ''"
      :course-description="activeCourseDescription"
      :current-step="currentStepIndex"
      :total-steps="totalSteps"
      :hours-remaining="hoursRemaining"
      :can-continue="canContinueStudy"
      :can-finish="canFinishStudy"
      :resource-warning="resourceWarning"
      @read="handleRead"
      @finish="handleFinishStudy"
      @close="closeStudyModal"
    />
  </RoundedPanel>
</template>

<script setup lang="ts">
import type { ComputedRef } from 'vue'
import Tooltip from '@/components/ui/Tooltip/index.vue'
import type { ActiveCourse, ActiveCourseStep, CanAddStudyHoursResult, CognitiveLoadStatus, CompletedProgramRecord, NeedsState } from '@/stores/education-store'
import { AgeGroup } from '@/composables/useAgeRestrictions'
import {
  EDUCATION_LONG_PROGRAM_STEP_HOURS,
  EDUCATION_LONG_STEP_MAX_ENERGY_DRAIN,
  ENERGY_EXHAUSTION_THRESHOLD_STUDY,
  COGNITIVE_LOAD_CONSTANTS,
  canAddStudyHours,
  getCognitiveLoadStatus,
  getNeedsStateFromComponents,
  resolveStudySessionHours,
} from '@/stores/education-store'
import type { CourseTile } from './EducationLevel.types'
import { EDUCATION_PROGRAMS } from '@/domain/balance/constants/education-programs'

const store = useGameStore()

const educationStore = useEducationStore()

const currentAge: ComputedRef<number> = computed(() => store.age ?? 0)
const currentAgeGroup: ComputedRef<AgeGroup> = computed(() => getAgeGroup(currentAge.value))

const showTimeHints: ComputedRef<boolean> = computed(() => true)
const showCognitiveHints: ComputedRef<boolean> = computed(() => currentAgeGroup.value >= AgeGroup.TEEN)

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
  const steps: ActiveCourseStep[] = hasStoredSteps
    ? source.steps!.map(step => ({ ...step }))
    : catalogSteps
  const totalHours = steps.reduce((total, step) => total + (step.hoursRequired ?? 0), 0)
  return {
    ...source,
    name: source.name && source.name !== source.id ? source.name : (catalog?.title ?? source.id),
    type: source.type ?? catalog?.typeLabel,
    steps,
    ...(hasStoredSteps || totalHours <= 0
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

const currentLearningFocus: ComputedRef<string> = computed(() => {

  if (!activeCourse.value) return ''

  if (currentStep.value?.title) {
    return `${activeCourse.value.name} - ${currentStep.value.title}`
  }

  return activeCourse.value.name
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

const hoursRemaining: ComputedRef<number> = computed(() => {

  if (!steps.value.length) return 0

  return steps.value.reduce((total: number, step: typeof steps.value[number], index: number) => {
    if (index < currentStepIndex.value) return total

    const stepProgress: number = Math.max(0, Math.min(1, step.progressPercent ?? 0))

    return total + ((step.hoursRequired ?? 0) * (1 - stepProgress))
  }, 0)
})

const studySessionHours: ComputedRef<number> = computed(() => {

  if (!currentStep.value) return EDUCATION_LONG_PROGRAM_STEP_HOURS

  return resolveStudySessionHours(cognitiveLoadValue.value, store.energy ?? 0, currentStep.value.hoursRequired)
})

const studySessionHoursDisplay: ComputedRef<number> = computed(() => Math.round(studySessionHours.value))

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

const studyWakeBudgetTooltipText: ComputedRef<string> = computed(() => {
  const session: number = studySessionHours.value

  const used: number = studyHoursSinceLastSleep.value

  return [
    'Учёба до сна (отдельный лимит)',
    '',
    `Сейчас ${Math.round(used)}/${maxStudyHoursCycleDisplay} ч. Следующий сеанс чтения — до ${Math.round(session)} ч. в этом цикле.`,
    '',
    'Шкала «когнитивная нагрузка» ниже — про другой показатель (усталость в %), а не про этот лимит часов.',
  ].join('\n')
})

const studyWakeBudgetAriaLabel: ComputedRef<string> = computed(
  () =>
    `Учёба до сна: ${studyHoursSinceLastSleepDisplay.value} из ${maxStudyHoursCycleDisplay} часов. Подробности — в подсказке (наведите или нажмите)`,
)

const showStudyWakeHints: ComputedRef<boolean> = computed(
  () => showCognitiveHints.value && !!activeCourse.value && !!currentStep.value,
)

const canOpenStudyModal: ComputedRef<boolean> = computed(() => !!activeCourse.value && !!currentStep.value)

/** Блокировка по накопительной усталости */
const dailyStudyHoursBlocked: ComputedRef<boolean> = computed(() => {
  const cognitiveValue: number = cognitiveLoadValue.value

  if (!cognitiveValue) return false

  const canStudyCheck: CanAddStudyHoursResult = canAddStudyHours(cognitiveValue, (store.energy ?? 0))

  return !canStudyCheck.canDo
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

const cognitiveLoadStatus: ComputedRef<{ label: string; description: string } | null> = computed(() => {
  const cognitiveValue: number = cognitiveLoadValue.value

  if (!cognitiveValue) return null

  const status: CognitiveLoadStatus = getCognitiveLoadStatus(cognitiveValue)

  return {
    label: status.label,
    description: status.description,
  }
})

const canStudy: ComputedRef<boolean> = computed(() => {

  if (!activeCourse.value) return false

  if (!currentStep.value) return false

  if (energyExhaustedForStudy.value) return false

  if (energyWouldHitZeroOnStep.value) return false

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

const studyStatusHint: ComputedRef<string> = computed(() => {

  if (!activeCourse.value || !currentStep.value) return 'Выберите программу ниже'

  if (canStudy.value) {
    return isBookCourse.value
      ? `Следующий сеанс: ${studySessionHoursDisplay.value} ч.`
      : `Следующий шаг: ${studySessionHoursDisplay.value} ч.`
  }

  if (dailyStudyHoursBlocked.value) {
    return `Лимит до сна: ${studyHoursSinceLastSleepDisplay.value}/${maxStudyHoursCycleDisplay} ч.`
  }

  if (energyExhaustedForStudy.value || energyWouldHitZeroOnStep.value) {
    return 'Нужно восстановить силы'
  }

  return 'Есть временные ограничения'
})

const studyButtonText: ComputedRef<string> = computed(() => {

  if (!activeCourse.value) return 'Выбрать курс'

  if (!currentStep.value) return 'Ожидание шагов программы'

  if (!canStudy.value) {
    return isBookCourse.value ? 'Почему нельзя читать?' : 'Почему нельзя продолжить?'
  }

  if (currentStepIndex.value === 0) {
    return isBookCourse.value ? 'Начать читать' : 'Начать обучение'
  }

  return isBookCourse.value ? 'Продолжить чтение' : 'Продолжить курс'
})

const isStudyModalOpen = ref(false)

const activeCourseDescription: ComputedRef<string> = computed(() => {

  if (!activeCourse.value) return ''

  return 'Погрузитесь в материал и развивайте свои навыки. Каждая страница приближает вас к новым знаниям.'
})

const canContinueStudy: ComputedRef<boolean> = computed(() => {

  if (!activeCourse.value) return false

  if (!currentStep.value) return false

  if (energyExhaustedForStudy.value) return false

  if (energyWouldHitZeroOnStep.value) return false

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

  isStudyModalOpen.value = true
}

function closeStudyModal() {
  isStudyModalOpen.value = false
}

async function handleRead(): Promise<void> {
  if (!canContinueStudy.value) return

  await store.advanceEducationAsync()
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

const timeHint: ComputedRef<string | null> = computed(() => {
  const time: Record<string, number> | null = store.time as unknown as Record<string, number> | null

  if (!time) return null

  const weekHoursRemaining: number = time.weekHoursRemaining ?? 168

  if (weekHoursRemaining < 40) {
    return `В недельном бюджете мало свободных часов (осталось ${Math.round(weekHoursRemaining)} ч.).`
  }

  if (weekHoursRemaining >= 100) {
    return `В недельном бюджете много свободных часов (осталось ${Math.round(weekHoursRemaining)} ч.).`
  }

  return null
})

/** @description [EducationLevel] - Formats a stat key and numeric value into a human-readable label with sign. @return { string } Formatted string like "Энергия +5" or "Стресс -3". */
function formatStatChange(stat: string, value: number): string {
  const statNames: Record<string, string> = {
    energy: 'Энергия',
    stress: 'Стресс',
    mood: 'Настроение',
    health: 'Здоровье',
    money: 'Деньги',
  }

  const name: string = statNames[stat] || stat
  const sign: string = value >= 0 ? '+' : ''

  return `${name} ${sign}${value}`
}

/** @description [EducationLevel] - Formats a skill key and numeric value into a human-readable label with sign. @return { string } Formatted string like "Обучение +2" or "Программирование -1". */
function formatSkillChange(skill: string, value: number): string {
  const skillNames: Record<string, string> = {
    learning: 'Обучение',
    programming: 'Программирование',
    management: 'Менеджмент',
    communication: 'Коммуникация',
    finance: 'Финансы',
  }

  const name: string = skillNames[skill] || skill
  const sign: string = value >= 0 ? '+' : ''

  return `${name} ${sign}${value}`
}
</script>

<style scoped lang="scss" src="./EducationLevel.scss"></style>
