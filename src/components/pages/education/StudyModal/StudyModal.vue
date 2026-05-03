<template>
  <Modal
    :is-open="isOpen"
    :title="courseName"
    :show-close="true"
    @close="handleClose"
    max-width="400px"
    >
    <div class="study-modal">
      <!-- Subtitle -->
      <p class="study-modal__subtitle">
        {{ courseDescription }}
      </p>

      <!-- Progress indicator -->
      <div class="progress-indicator">
        <span class="progress-step">
          Шаг {{ currentStep + 1 }} из {{ totalSteps }}
        </span>
        <div class="progress-dots">
          <span
            v-for="i in totalSteps"
            :key="i"
            :class="{
              'dot--completed': i - 1 < currentStep,
              'dot--current': i - 1 === currentStep
            }"
            class="dot"
            >
          </span>
        </div>
      </div>

      <!-- Book / Course click area with flip animation -->
      <div
        :class="{ 'book-container--flipping': isFlipping }"
        @click="handleReadClick"
        class="book-container"
        >
        <div
          :class="{ 'book--flipped': isFlipped }"
          class="book"
          >
          <div class="book-cover">
            <span class="book-icon">
              📖
            </span>
            <span class="book-label">
              {{ bookLabel }}
            </span>
          </div>
          <div class="book-pages">
            <div class="page-content">
              <p class="page-text">
                {{ currentPageContent }}
              </p>
            </div>
          </div>
        </div>
        <div class="flip-hint">
          👆 Нажмите, чтобы перелистнуть
        </div>
      </div>

      <!-- Resource warnings -->
      <div
        v-if="resourceWarning"
        class="resource-warning"
        >
        <span class="warning-icon">
          ⚠️
        </span>
        <span class="warning-text">
          {{ resourceWarning }}
        </span>
      </div>
    </div>

    <!-- Action buttons -->
    <template #actions>
      <button
        :disabled="!canContinue"
        @click="handleReadClick"
        class="action-btn action-btn--read"
        >
        <span class="btn-icon">
          📄
        </span>
        <span class="btn-text">
          {{ readButtonText }}
        </span>
      </button>

      <!-- <button
        class="action-btn action-btn--finish"
        :disabled="!canFinish"
        @click="handleFinish"
      >
        <span class="btn-icon">✅</span>
        <span class="btn-text">{{ finishButtonText }}</span>
      </button> -->
    </template>
  </Modal>
</template>

<script setup lang="ts">
import './StudyModal.scss'

import type { StudyModalProps } from './StudyModal.types'

import { STUDY_PAGE_CONTENTS } from './StudyModal.constants'

/**
 * @prop {boolean} isOpen - Флаг видимости модального окна
 * @prop {string} courseName - Название курса
 * @prop {string} courseDescription - Описание курса
 * @prop {number} currentStep - Текущий шаг обучения
 * @prop {number} totalSteps - Общее количество шагов
 * @prop {number} hoursRemaining - Оставшиеся часы обучения
 * @prop {boolean} canContinue - Доступна ли кнопка «Продолжить»
 * @prop {boolean} canFinish - Доступна ли кнопка «Завершить»
 * @prop {string | null} [resourceWarning] - Предупреждение о нехватке ресурса
 */
const props: boolean = withDefaults(defineProps<StudyModalProps>(), {
  resourceWarning: null
})

const emit: boolean = defineEmits<{
  (e: 'read'): void
  (e: 'finish'): void
  (e: 'close'): void
}>()

const isFlipping = ref(false)
const isFlipped = ref(false)

const bookLabel = computed<string>(() => {

  if (props.currentStep === 0) return 'Начать чтение'

  if (props.currentStep >= props.totalSteps - 1) return 'Последняя страница'

  return `Страница ${props.currentStep + 1}`
})

const currentPageContent = computed<string | undefined>(() => {
  return STUDY_PAGE_CONTENTS[Math.min(props.currentStep, STUDY_PAGE_CONTENTS.length - 1)]
})

const readButtonText = computed<string>(() => {

  if (!props.canContinue) {
    const warning: string = (props.resourceWarning ?? '').toLowerCase()

    if (warning.includes('голод')) return 'Сначала поешьте'

    if (warning.includes('энерг')) return 'Нужно отдохнуть'

    if (warning.includes('поспите') || warning.includes('учёбы до сна')) return 'Сначала поспите'

    return 'Пока нельзя читать'
  }

  return props.currentStep === 0 ? 'Начать читать' : 'Читать дальше'
})

function handleReadClick() {
  if (!props.canContinue) return

  // Trigger flip animation
  isFlipping.value = true
  isFlipped.value = !isFlipped.value

  setTimeout(() => {
    isFlipping.value = false
  }, 600)

  emit('read')
}

function handleClose() {
  emit('close')
}

// Reset flip state when modal opens

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    isFlipped.value = false
    isFlipping.value = false
  }
})
</script>
