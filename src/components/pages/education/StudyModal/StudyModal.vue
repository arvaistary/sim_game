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
        :class="{ 'book-container--flipping': isFlipping }"
        @click="handleReadClick"
      >
        <div class="book" :class="{ 'book--flipped': isFlipped }">
          <div class="book-cover">
            <span class="book-icon">📖</span>
            <span class="book-label">{{ bookLabel }}</span>
          </div>
          <div class="book-pages">
            <div class="page-content">
              <p class="page-text">{{ currentPageContent }}</p>
            </div>
          </div>
        </div>
        <div class="flip-hint">👆 Нажмите, чтобы перелистнуть</div>
      </div>

      <!-- Resource warnings -->
      <div v-if="resourceWarning" class="resource-warning">
        <span class="warning-icon">⚠️</span>
        <span class="warning-text">{{ resourceWarning }}</span>
      </div>
    </div>

    <!-- Action buttons -->
    <template #actions>
      <button
        class="action-btn action-btn--read"
        :disabled="!canContinue"
        @click="handleReadClick"
      >
        <span class="btn-icon">📄</span>
        <span class="btn-text">{{ readButtonText }}</span>
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
import type { ComputedRef } from 'vue'
import type { StudyModalProps, StudyModalEmits } from './StudyModal.types'

const props = withDefaults(defineProps<StudyModalProps>(), {
  resourceWarning: null
})

const emit = defineEmits<StudyModalEmits>()

const isFlipping = ref(false)
const isFlipped = ref(false)

const bookLabel: ComputedRef<string> = computed(() => {

  if (props.currentStep === 0) return 'Начать чтение'

  if (props.currentStep >= props.totalSteps - 1) return 'Последняя страница'

  return `Страница ${props.currentStep + 1}`

  return `Страница ${props.currentStep + 1}`
})

const currentPageContent: ComputedRef<string> = computed(() => {
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

const readButtonText: ComputedRef<string> = computed(() => {
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
watch(() => props.isOpen, (newVal: boolean) => {
  if (newVal) {
    isFlipped.value = false
    isFlipping.value = false
  }
})
</script>
