<template>
  <RoundedPanel>
    <h3 class="section-title">Текущий уровень</h3>
    <div class="edu-level">
      <span class="edu-label">{{ educationLevel }}</span>
      <span v-if="activeCourse" class="edu-active">📚 {{ activeCourse.name }}</span>
    </div>
    <div v-if="activeCourse && currentStep" class="course-progress">
      <div class="step-info">
        <span class="step-label">{{ currentStep.title }}</span>
        <span class="step-counter">Шаг {{ currentStepIndex + 1 }} из {{ totalSteps }}</span>
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :class="efficiencyClass"
          :style="{ width: `${overallProgress}%` }"
        ></div>
      </div>
      <div class="progress-details">
        <span class="progress-text">Прогресс: {{ overallProgress.toFixed(1) }}%</span>
        <span v-if="currentStep && currentStep.progressPercent > 0" class="step-progress-text">
          Текущий шаг: {{ currentStep.progressPercent.toFixed(1) }}%
        </span>
      </div>
      <div v-if="currentStep.milestoneReward" class="milestone-reward">
        <span class="milestone-icon">🎁</span>
        <span class="milestone-text">Награда за шаг:</span>
        <div v-if="currentStep.milestoneReward.statChanges" class="milestone-stats">
          <span v-for="(value, stat) in currentStep.milestoneReward.statChanges" :key="stat" class="stat-change">
            {{ formatStatChange(stat, value) }}
          </span>
        </div>
        <div v-if="currentStep.milestoneReward.skillChanges" class="milestone-skills">
          <span v-for="(value, skill) in currentStep.milestoneReward.skillChanges" :key="skill" class="skill-change">
            {{ formatSkillChange(skill, value) }}
          </span>
        </div>
        <p v-if="currentStep.milestoneReward.message" class="milestone-message">
          {{ currentStep.milestoneReward.message }}
        </p>
      </div>
      <!-- Подсказки о времени и когнитивной нагрузке показываются только для подростков и старше -->
      <div v-if="showTimeHints && timeHint" class="time-hint">
        <span class="time-icon">⏰</span>
        <span class="time-text">{{ timeHint }}</span>
      </div>
      <div v-if="showCognitiveHints && cognitiveLoadStatus" class="cognitive-load-hint">
        <span class="cognitive-icon">🧠</span>
        <span class="cognitive-text">{{ cognitiveLoadStatus.label }}: {{ Math.round(cognitiveLoadValue) }}%</span>
        <span class="cognitive-description">{{ cognitiveLoadStatus.description }}</span>
      </div>
    </div>
  </RoundedPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RoundedPanel from '@/components/ui/RoundedPanel/index.vue'
import { useGameStore } from '@/stores/game.store'
import { AgeGroup, getAgeGroup } from '@/composables/useAgeRestrictions/age-constants'
import type { ActiveCourse, ProgramStep } from '@/domain/engine/systems/EducationSystem/index.types'

const store = useGameStore()

// Возраст и возрастная группа
const currentAge = computed(() => store.age ?? 0)
const currentAgeGroup = computed(() => getAgeGroup(currentAge.value))

// Показывать подсказки о времени - только для подростков и старше (TEEN+)
const showTimeHints = computed(() => currentAgeGroup.value >= AgeGroup.TEEN)

// Показывать подсказки о когнитивной нагрузке - только для подростков и старше (TEEN+)
const showCognitiveHints = computed(() => currentAgeGroup.value >= AgeGroup.TEEN)

const educationLevel = computed(() => {
  const edu = store.education as Record<string, unknown> | null
  return (edu?.educationLevel as string) ?? 'Нет'
})

const activeCourse = computed(() => {
  const edu = store.education as Record<string, unknown> | null
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

// Класс эффективности для цвета прогресс-бара
const efficiencyClass = computed(() => {
  const progress = overallProgress.value
  if (progress >= 75) return 'efficiency-high'
  if (progress >= 50) return 'efficiency-medium'
  if (progress >= 25) return 'efficiency-low'
  return 'efficiency-very-low'
})

// Подсказка о времени суток
const timeHint = computed(() => {
  const time = store.time as Record<string, number> | null
  if (!time) return null
  
  const hourOfDay = time.hourOfDay ?? 0
  const dayOfWeek = time.dayOfWeek ?? 1
  
  let hint = ''
  
  // Время суток
  if (hourOfDay >= 22 || hourOfDay < 6) {
    hint = 'Ночь: эффективность обучения снижена на 50%'
  } else if (hourOfDay >= 18 && hourOfDay < 22) {
    hint = 'Вечер: эффективность обучения снижена на 15%'
  }
  
  // Выходные
  if (dayOfWeek === 6 || dayOfWeek === 7) {
    hint += hint ? ' • ' : ''
    hint += 'Выходной: эффективность повышена на 10%'
  }
  
  return hint || null
})

// Когнитивная нагрузка
const cognitiveLoadValue = computed(() => {
  const world = store.world
  if (!world) return 0
  
  const cognitiveLoad = world.getComponent('player', 'cognitive_load') as Record<string, number> | null
  return cognitiveLoad?.currentLoad ?? 0
})

const cognitiveLoadStatus = computed(() => {
  const load = cognitiveLoadValue.value
  if (load >= 90) {
    return { label: 'Истощение', description: 'Критическая перегрузка. Эффективность сильно снижена.' }
  }
  if (load >= 80) {
    return { label: 'Перегрузка', description: 'Высокая нагрузка. Эффективность снижена.' }
  }
  if (load >= 50) {
    return { label: 'Усталость', description: 'Умеренная нагрузка. Рекомендуется перерыв.' }
  }
  return null
})

// Форматирование изменения стата
function formatStatChange(stat: string, value: number): string {
  const statNames: Record<string, string> = {
    energy: 'Энергия',
    stress: 'Стресс',
    mood: 'Настроение',
    health: 'Здоровье',
    money: 'Деньги',
  }
  const name = statNames[stat] || stat
  const sign = value >= 0 ? '+': ''
  return `${name} ${sign}${value}`
}

// Форматирование изменения навыка
function formatSkillChange(skill: string, value: number): string {
  const skillNames: Record<string, string> = {
    learning: 'Обучение',
    programming: 'Программирование',
    management: 'Менеджмент',
    communication: 'Коммуникация',
    finance: 'Финансы',
  }
  const name = skillNames[skill] || skill
  const sign = value >= 0 ? '+': ''
  return `${name} ${sign}${value}`
}
</script>

<style scoped lang="scss" src="./EducationLevel.scss"></style>
