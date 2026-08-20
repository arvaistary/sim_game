<template>
  <Modal
    :is-open="isOpen"
    :title="courseName"
    :show-close="true"
    max-width="400px"
    @close="handleClose"
  >
    <div class="study-modal">
      <!-- Subtitle -->
      <p class="study-modal__subtitle">{{ courseDescription }}</p>

      <!-- Progress indicator -->
      <div class="progress-indicator">
        <span class="progress-step">Шаг {{ currentStep + 1 }} из {{ totalSteps }}</span>
        <div class="progress-dots">
          <span
            v-for="i in totalSteps"
            :key="i"
            class="dot"
            :class="{
              'dot--completed': i - 1 < currentStep,
              'dot--current': i - 1 === currentStep
            }"
          />
        </div>
      </div>

      <!-- Book / Course click area with flip animation -->
      <div
        class="book-container"
        :class="{ 'book-container--flipping': isFlipping, 'book-container--busy': isReading }"
        role="button"
        tabindex="0"
        :aria-label="isFlipped ? 'Вернуться к обложке следующей главы' : `Прочитать: ${bookLabel}`"
        @click="handleCardClick"
        @keydown.enter.prevent="handleCardClick"
        @keydown.space.prevent="handleCardClick"
      >
        <div class="book" :class="{ 'book--flipped': isFlipped }">
          <div class="book-cover">
            <span class="book-icon" aria-hidden="true">
              <GameIcon name="book" :size="32" :stroke-width="1.5" />
            </span>
            <span class="book-label">{{ bookLabel }}</span>
          </div>
          <div class="book-pages">
            <div class="page-content">
            <p class="page-text">{{ pageContent }}</p>
            </div>
          </div>
        </div>
        <div class="flip-hint">Нажмите, чтобы перелистнуть</div>
      </div>

      <!-- Resource warnings -->
      <div v-if="resourceWarning" class="resource-warning">
        <span class="warning-icon" aria-hidden="true">
          <GameIcon name="danger-triangle" :size="16" :stroke-width="1.5" />
        </span>
        <span class="warning-text">{{ resourceWarning }}</span>
      </div>
    </div>

  </Modal>
</template>

<script setup lang="ts">
import './StudyModal.scss'
import type { ComputedRef } from 'vue'
import type { StudyModalProps, StudyModalEmits } from './StudyModal.types'

const props = withDefaults(defineProps<StudyModalProps>(), {
  resourceWarning: null,
  isBook: false,
  isReading: false,
})

const emit = defineEmits<StudyModalEmits>()

const isFlipping = ref(false)
const isFlipped = ref(false)
const lastReadPageContent = ref('')
const wasLastChapter = ref(false)

const bookLabel: ComputedRef<string> = computed(() => {
  const unit = props.isBook ? 'глава' : 'раздел'
  if (props.currentStep >= props.totalSteps - 1) {
    return props.isBook ? `Глава ${props.currentStep + 1} · последняя` : `Раздел ${props.currentStep + 1} · последний`
  }

  return `${unit[0]?.toUpperCase()}${unit.slice(1)} ${props.currentStep + 1}`
})

const currentPageContent: ComputedRef<string> = computed(() => {
  if (props.stepContent) return props.stepContent

  const contents = [
    'Вы начинаете погружаться в материал. Первые страницы открывают основные концепции...',
    'Автор объясняет ключевые принципы управления временем. Интересные примеры из практики...',
    'Появляются практические упражнения. Самое время записать свои мысли...',
    'Вы узнаёте о распространённых ошибках и как их избежать. Полезные инсайты!',
    'Финальные рекомендации и план действий. Время подвести итоги...',
    'Книга завершена! Вы получили ценные знания и навыки.',
  ]
  return contents[Math.min(props.currentStep, contents.length - 1)] ?? contents[0]!
})

const pageContent: ComputedRef<string> = computed(() => {
  return isFlipped.value && lastReadPageContent.value ? lastReadPageContent.value : currentPageContent.value
})

function flipCard(): void {
  isFlipping.value = true
  isFlipped.value = !isFlipped.value

  setTimeout(() => {
    isFlipping.value = false
  }, 600)
}

function handleCardClick(): void {
  if (props.isReading) return

  if (isFlipped.value) {
    flipCard()
    if (wasLastChapter.value) {
      setTimeout(() => emit('close'), 600)
    }
    return
  }

  if (!props.canContinue) return

  lastReadPageContent.value = currentPageContent.value
  wasLastChapter.value = props.currentStep >= props.totalSteps - 1
  flipCard()
  emit('read')
}

function handleClose() {
  emit('close')
}

// Reset flip state when modal opens
watch(() => props.isOpen, (newVal: boolean) => {
  if (newVal) {
    isFlipped.value = false
    isFlipping.value = false
    lastReadPageContent.value = ''
    wasLastChapter.value = false
  }
})
</script>
