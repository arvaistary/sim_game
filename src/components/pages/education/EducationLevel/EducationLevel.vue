<template>
  <RoundedPanel>
    <div class="education-level-wrap">
      <h3 class="section-title">Текущий уровень</h3>
      <div class="edu-level">
        <span class="edu-label">{{ educationLevel }}</span>
        <p class="edu-level-hint">
          Формальная ступень (школа / диплом). Книги и курсы из списка ниже на неё не меняют — только отдельные программы с пометкой об уровне.
        </p>
      </div>

      <div v-if="courseTiles.length > 0" class="courses-grid">
        <article
          v-for="tile in courseTiles"
          :key="tile.key"
          class="course-tile"
          :class="{ 'course-tile--active': tile.status === 'active' }"
        >
          <template v-if="tile.status === 'active'">
            <span class="course-tile__badge course-tile__badge--current">Сейчас</span>
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

              <button
                class="study-button"
                :class="{ 'study-button--disabled': !canStudy }"
                :disabled="!canStudy"
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
import { useGameStore } from '@/stores/game.store'
import { AgeGroup, getAgeGroup } from '@/composables/useAgeRestrictions/age-constants'
import type { ActiveCourse, CompletedProgramRecord } from '@/domain/engine/systems/EducationSystem/index.types'
import {
  EDUCATION_LONG_STEP_MAX_ENERGY_DRAIN,
  ENERGY_EXHAUSTION_THRESHOLD_STUDY,
} from '@/domain/engine/systems/EducationSystem/learning-efficiency'
import {
  getCognitiveLoadStatus,
  canAddStudyHours,
  EDUCATION_LONG_PROGRAM_STEP_HOURS,
  COGNITIVE_LOAD_CONSTANTS,
  type CognitiveLoadComponent,
} from '@/domain/engine/systems/EducationSystem/cognitive-load'

type CourseTile =
  | { key: string; status: 'active' }
  | { key: string; status: 'completed'; record: CompletedProgramRecord }

const store = useGameStore()

const currentAge = computed(() => store.age ?? 0)
const currentAgeGroup = computed(() => getAgeGroup(currentAge.value))

const showTimeHints = computed(() => true)
const showCognitiveHints = computed(() => currentAgeGroup.value >= AgeGroup.TEEN)

const educationLevel = computed(() => {
  const edu = store.education as unknown as Record<string, unknown> | null
  return (edu?.educationLevel as string) ?? 'Нет'
})

const activeCourse = computed(() => {
  const edu = store.education as unknown as Record<string, unknown> | null
  const courses = edu?.activeCourses as ActiveCourse[] | null
  return courses && courses.length > 0 ? courses[0] : null
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

const overallProgress = computed(() => {
  if (!activeCourse.value || steps.value.length === 0) return 0
  const progress = activeCourse.value.progress ?? 0
  return Math.max(0, Math.min(100, progress * 100))
})

const hoursRemaining = computed(() => {
  if (!activeCourse.value) return 0
  const hoursRequired = activeCourse.value.hoursRequired ?? 0
  const hoursSpent = activeCourse.value.hoursSpent ?? 0
  return Math.max(0, hoursRequired - hoursSpent)
})

const cognitiveLoadValue = computed(() => {
  const world = store.world
  if (!world) return 0
  const cognitiveLoad = world.getComponent('player', 'cognitive_load') as CognitiveLoadComponent | null
  return cognitiveLoad?.currentLoad ?? 0
})

const studyHoursSinceLastSleep = computed(() => {
  void store.education
  const world = store.world
  if (!world) return 0
  const cognitiveLoad = world.getComponent('player', 'cognitive_load') as CognitiveLoadComponent | null
  return cognitiveLoad?.studyHoursSinceLastSleep ?? 0
})

/** Максимальное количество учебных часов в одном цикле (константа) */
const maxStudyHoursCycle = COGNITIVE_LOAD_CONSTANTS.MAX_STUDY_HOURS_CYCLE

/** Блокировка по накопительной усталости */
const dailyStudyHoursBlocked = computed(() => {
  const world = store.world
  if (!world) return false
  const cognitiveLoad = world.getComponent('player', 'cognitive_load') as CognitiveLoadComponent | null
  if (!cognitiveLoad) return false
  
  const canStudyCheck = canAddStudyHours(cognitiveLoad, EDUCATION_LONG_PROGRAM_STEP_HOURS)
  return !canStudyCheck.canStudy
})

/** Истощение для учёбы привязано к энергии персонажа (как на главной), не к когнитивной шкале */
const energyExhaustedForStudy = computed(() => (store.energy ?? 0) < ENERGY_EXHAUSTION_THRESHOLD_STUDY)

/** Пессимистичная проверка: при макс. расходе за шаг энергия не должна уходить в 0 */
const energyWouldHitZeroOnStep = computed(() => (store.energy ?? 0) <= EDUCATION_LONG_STEP_MAX_ENERGY_DRAIN)

const cognitiveLoadStatus = computed(() => {
  const world = store.world
  if (!world) return null
  const cognitiveLoad = world.getComponent('player', 'cognitive_load') as CognitiveLoadComponent | null
  if (!cognitiveLoad) return null
  
  const status = getCognitiveLoadStatus(cognitiveLoad)
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

const studyButtonText = computed(() => {
  if (!activeCourse.value) return 'Выбрать курс'
  if (!currentStep.value) return 'Ожидание шагов программы'
  if (energyExhaustedForStudy.value) return 'Мало энергии — отдохните'
  if (energyWouldHitZeroOnStep.value) return 'Энергии не хватит на шаг'
  if (dailyStudyHoursBlocked.value) {
    return `Лимит учёбы (${studyHoursSinceLastSleep.value}/${maxStudyHoursCycle} ч.) — поспите`
  }
  if (hoursRemaining.value <= 0) return 'Завершить курс'
  return 'Читать'
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
  if (hoursRemaining.value <= 0) return false
  return true
})

const canFinishStudy = computed(() => !!activeCourse.value)

const resourceWarning = computed(() => {
  if (energyExhaustedForStudy.value) {
    return `Энергия ниже ${ENERGY_EXHAUSTION_THRESHOLD_STUDY}% — истощение. Восстановите силы, прежде чем учиться.`
  }
  if (energyWouldHitZeroOnStep.value) {
    return 'Этого занятия не хватает: при текущей энергии шаг опустил бы запас до нуля или ниже.'
  }
  if (dailyStudyHoursBlocked.value) {
    const world = store.world
    if (world) {
      const cognitiveLoad = world.getComponent('player', 'cognitive_load') as CognitiveLoadComponent | null
      if (cognitiveLoad) {
        const canStudyCheck = canAddStudyHours(cognitiveLoad, EDUCATION_LONG_PROGRAM_STEP_HOURS)
        return canStudyCheck.reason
      }
    }
    return 'Лимит учёбы исчерпан. Поспите для восстановления.'
  }
  return null
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
  if (!canStudy.value) return
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
