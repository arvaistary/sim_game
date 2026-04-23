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
                ></div>
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
import { ref, computed } from 'vue'
import Tooltip from '@/components/ui/Tooltip/index.vue'
import { useGameStore } from '@/stores/game.store'
import { AgeGroup, getAgeGroup } from '@/composables/useAgeRestrictions/age-constants'
import { useEducationStore } from '@/stores/education-store'
import {
  type ActiveCourse,
  type CompletedProgramRecord,
  EDUCATION_LONG_STEP_MAX_ENERGY_DRAIN,
  ENERGY_EXHAUSTION_THRESHOLD_STUDY,
  getNeedsStateFromComponents,
  getCognitiveLoadStatus,
  canAddStudyHours,
  EDUCATION_LONG_PROGRAM_STEP_HOURS,
  COGNITIVE_LOAD_CONSTANTS,
  resolveStudySessionHours,
  type CognitiveLoadComponent,
} from '@/stores/education-store'

type CourseTile =
  | { key: string; status: 'active' }
  | { key: string; status: 'completed'; record: CompletedProgramRecord }

const store = useGameStore()
const educationStore = useEducationStore()

const currentAge = computed(() => store.age ?? 0)
const currentAgeGroup = computed(() => getAgeGroup(currentAge.value))

const showTimeHints = computed(() => true)
const showCognitiveHints = computed(() => currentAgeGroup.value >= AgeGroup.TEEN)

const educationLevel = computed(() => {
  const edu = store.education as unknown as Record<string, unknown> | null
  return (edu?.educationLevel as string) ?? 'Нет'
})

const activeCourse = computed(() => {
  void store.worldTick
  const edu = store.education as unknown as Record<string, unknown> | null
  const courses = edu?.activeCourses as ActiveCourse[] | null
  if (!courses || courses.length === 0) return null
  const source = courses[0]
  // Shallow-clone курс и шаги, чтобы Vue обнаружил изменение ссылки
  // после мутаций ECS (currentStepIndex, progressPercent и т.д.)
  return {
    ...source,
    steps: source.steps?.map(s => ({ ...s })) ?? [],
  } as ActiveCourse
})

const currentStepIndex = computed(() => {
  return activeCourse.value?.currentStepIndex ?? 0
})

const steps = computed(() => {
  return activeCourse.value?.steps ?? []
})

const totalSteps = computed(() => steps.value.length)

const currentStep = computed(() => {
  if (steps.value.length === 0) return null
  return steps.value[currentStepIndex.value] ?? null
})

const currentLearningFocus = computed(() => {
  if (!activeCourse.value) return ''
  if (currentStep.value?.title) {
    return `${activeCourse.value.name} - ${currentStep.value.title}`
  }
  return activeCourse.value.name
})

const isBookCourse = computed(() => {
  const type = activeCourse.value?.type?.toLowerCase() ?? ''
  return type.includes('книга')
})

const overallProgress = computed(() => {
  if (!activeCourse.value || steps.value.length === 0) return 0
  const progress = activeCourse.value.progress ?? 0
  return Math.max(0, Math.min(100, progress * 100))
})

const hoursRemaining = computed(() => {
  if (!steps.value.length) return 0
  return steps.value.reduce((total, step, index) => {
    if (index < currentStepIndex.value) return total
    const stepProgress = Math.max(0, Math.min(1, step.progressPercent ?? 0))
    return total + (step.hoursRequired * (1 - stepProgress))
  }, 0)
})

const studySessionHours = computed(() => {
  if (!currentStep.value) return EDUCATION_LONG_PROGRAM_STEP_HOURS
  return resolveStudySessionHours(currentStep.value.hoursRequired)
})

const studySessionHoursDisplay = computed(() => Math.round(studySessionHours.value))

const cognitiveLoadValue = computed(() => {
  return educationStore.cognitiveLoad
})

const studyHoursSinceLastSleep = computed(() => {
  return educationStore.studyHoursSinceLastSleep
})

const studyHoursSinceLastSleepDisplay = computed(() => Math.round(studyHoursSinceLastSleep.value))

/** Максимальное количество учебных часов в одном цикле (константа) */
const maxStudyHoursCycle = COGNITIVE_LOAD_CONSTANTS.MAX_STUDY_HOURS_CYCLE
const maxStudyHoursCycleDisplay = Math.round(maxStudyHoursCycle)

const studyWakeBudgetTooltipText = computed(() => {
  const session = studySessionHours.value
  const used = studyHoursSinceLastSleep.value
  return [
    'Учёба до сна (отдельный лимит)',
    '',
    `Сейчас ${Math.round(used)}/${maxStudyHoursCycleDisplay} ч. Следующий сеанс чтения — до ${Math.round(session)} ч. в этом цикле.`,
    '',
    'Шкала «когнитивная нагрузка» ниже — про другой показатель (усталость в %), а не про этот лимит часов.',
  ].join('\n')
})

const studyWakeBudgetAriaLabel = computed(
  () =>
    `Учёба до сна: ${studyHoursSinceLastSleepDisplay.value} из ${maxStudyHoursCycleDisplay} часов. Подробности — в подсказке (наведите или нажмите)`,
)

const showStudyWakeHints = computed(
  () => showCognitiveHints.value && !!activeCourse.value && !!currentStep.value,
)

const canOpenStudyModal = computed(() => !!activeCourse.value && !!currentStep.value)

/** Блокировка по накопительной усталости */
const dailyStudyHoursBlocked = computed(() => {
  const cognitiveValue = cognitiveLoadValue.value
  if (!cognitiveValue) return false
  
  const canStudyCheck = canAddStudyHours(cognitiveValue, (store.energy ?? 0))
  return !canStudyCheck.canDo
})

/** Лимит «учёбы до сна» исчерпан (или не хватает часов под сеанс), но по курсу ещё есть бюджет часов */
const studyCycleBlockedWithCourseHoursLeft = computed(
  () =>
    !!activeCourse.value &&
    !!currentStep.value &&
    dailyStudyHoursBlocked.value &&
    hoursRemaining.value > 0,
)

/** Истощение для учёбы привязано к энергии персонажа (как на главной), не к когнитивной шкале */
const energyExhaustedForStudy = computed(() => (store.energy ?? 0) < ENERGY_EXHAUSTION_THRESHOLD_STUDY)

/** Пессимистичная проверка: при макс. расходе за шаг энергия не должна уходить в 0 */
const energyWouldHitZeroOnStep = computed(() => (store.energy ?? 0) <= EDUCATION_LONG_STEP_MAX_ENERGY_DRAIN)

const cognitiveLoadStatus = computed(() => {
  const cognitiveValue = cognitiveLoadValue.value
  if (!cognitiveValue) return null
  
  const status = getCognitiveLoadStatus(cognitiveValue)
  return {
    label: status.label,
    description: status.description,
  }
})

const canStudy = computed(() => {
  if (!activeCourse.value) return false
  if (!currentStep.value) return false
  if (energyExhaustedForStudy.value) return false
  if (energyWouldHitZeroOnStep.value) return false
  if (dailyStudyHoursBlocked.value) return false
  return true
})

const studyStatusTone = computed(() => {
  if (!activeCourse.value || !currentStep.value) return 'idle'
  if (canStudy.value) return 'active'
  if (resourceWarning.value) return 'paused'
  return 'idle'
})

const studyStatusLabel = computed(() => {
  if (!activeCourse.value || !currentStep.value) return 'Нет активного обучения'
  if (canStudy.value) return isBookCourse.value ? 'Можно читать' : 'Можно продолжить'
  return 'Пауза'
})

const studyStatusHint = computed(() => {
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

const studyButtonText = computed(() => {
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

const activeCourseDescription = computed(() => {
  if (!activeCourse.value) return ''
  return 'Погрузитесь в материал и развивайте свои навыки. Каждая страница приближает вас к новым знаниям.'
})

const canContinueStudy = computed(() => {
  if (!activeCourse.value) return false
  if (!currentStep.value) return false
  if (energyExhaustedForStudy.value) return false
  if (energyWouldHitZeroOnStep.value) return false
  if (dailyStudyHoursBlocked.value) return false
  return true
})

const canFinishStudy = computed(() => !!activeCourse.value)

const resourceWarning = computed(() => {
  const needs = getNeedsStateFromComponents(store.stats as unknown as Record<string, number> | null)
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
    const canStudyCheck = canAddStudyHours(cognitiveLoadValue.value, energy)
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

const inlineStudyWarning = computed(() => {
  if (!resourceWarning.value) return null
  return resourceWarning.value.split('\n')[0] ?? resourceWarning.value
})

const completedProgramsForGrid = computed(() => {
  const edu = store.education as unknown as Record<string, unknown> | null
  const raw = edu?.completedPrograms
  const list = (Array.isArray(raw) ? raw : []) as CompletedProgramRecord[]
  const activeId = activeCourse.value?.id
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

function handleRead() {
  if (!canContinueStudy.value) return
  store.advanceEducation()
}

function handleFinishStudy() {
  if (!canFinishStudy.value) return
  closeStudyModal()
}

const efficiencyClass = computed(() => {
  const progress = overallProgress.value
  if (progress >= 75) return 'efficiency-high'
  if (progress >= 50) return 'efficiency-medium'
  if (progress >= 25) return 'efficiency-low'
  return 'efficiency-very-low'
})

const timeHint = computed(() => {
  const time = store.time as unknown as Record<string, number> | null
  if (!time) return null

  const weekHoursRemaining = time.weekHoursRemaining ?? 168

  if (weekHoursRemaining < 40) {
    return `В недельном бюджете мало свободных часов (осталось ${Math.round(weekHoursRemaining)} ч.).`
  }
  if (weekHoursRemaining >= 100) {
    return `В недельном бюджете много свободных часов (осталось ${Math.round(weekHoursRemaining)} ч.).`
  }
  return null
})

function formatStatChange(stat: string, value: number): string {
  const statNames: Record<string, string> = {
    energy: 'Энергия',
    stress: 'Стресс',
    mood: 'Настроение',
    health: 'Здоровье',
    money: 'Деньги',
  }
  const name = statNames[stat] || stat
  const sign = value >= 0 ? '+' : ''
  return `${name} ${sign}${value}`
}

function formatSkillChange(skill: string, value: number): string {
  const skillNames: Record<string, string> = {
    learning: 'Обучение',
    programming: 'Программирование',
    management: 'Менеджмент',
    communication: 'Коммуникация',
    finance: 'Финансы',
  }
  const name = skillNames[skill] || skill
  const sign = value >= 0 ? '+' : ''
  return `${name} ${sign}${value}`
}
</script>

<style scoped lang="scss" src="./EducationLevel.scss"></style>
