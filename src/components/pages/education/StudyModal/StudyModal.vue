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
          ></span>
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
import { ref, computed, watch } from 'vue'

interface Props {
  isOpen: boolean
  courseName: string
  courseDescription: string
  currentStep: number
  totalSteps: number
  hoursRemaining: number
  canContinue: boolean
  canFinish: boolean
  resourceWarning?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  resourceWarning: null
})

const emit = defineEmits<{
  (e: 'read'): void
  (e: 'finish'): void
  (e: 'close'): void
}>()

const isFlipping = ref(false)
const isFlipped = ref(false)

const bookLabel = computed(() => {
  if (props.currentStep === 0) return 'Начать чтение'
  if (props.currentStep >= props.totalSteps - 1) return 'Последняя страница'
  return `Страница ${props.currentStep + 1}`
})

const currentPageContent = computed(() => {
  const contents = [
    'Вы начинаете погружаться в материал. Первые страницы открывают основные концепции...',
    'Автор объясняет ключевые принципы управления временем. Интересные примеры из практики...',
    'Появляются практические упражнения. Самое время записать свои мысли...',
    'Вы узнаёте о распространённых ошибках и как их избежать. Полезные инсайты!',
    'Финальные рекомендации и план действий. Время подвести итоги...',
    'Книга завершена! Вы получили ценные знания и навыки.',
  ]
  return contents[Math.min(props.currentStep, contents.length - 1)]
})

const readButtonText = computed(() => {
  if (!props.canContinue) {
    const warning = (props.resourceWarning ?? '').toLowerCase()
    if (warning.includes('голод')) return 'Сначала поешьте'
    if (warning.includes('энерг')) return 'Нужно отдохнуть'
    if (warning.includes('поспите') || warning.includes('учёбы до сна')) return 'Сначала поспите'
    return 'Пока нельзя читать'
  }
  return props.currentStep === 0 ? 'Начать читать' : 'Читать дальше'
})

const finishButtonText = computed(() => {
  if (!props.canFinish) {
    if (props.currentStep === 0) return 'Начните читать'
    return 'Доступно позже'
  }
  return 'Закрыть'
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

function handleFinish() {
  if (!props.canFinish) return
  emit('finish')
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

<style scoped lang="scss">
.study-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.study-modal__subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.4;
  text-align: center;
}

.progress-indicator {
  text-align: center;
}

.progress-step {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-accent);
}

.progress-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-bg-tertiary);
  transition: all 0.3s;

  &--completed {
    background: var(--color-pastel-green-strong);
  }

  &--current {
    background: var(--color-accent);
    transform: scale(1.3);
  }
}

.book-container {
  perspective: 1000px;
  cursor: pointer;

  &:active {
    transform: scale(0.98);
  }
}

.book-container--flipping {
  pointer-events: none;
}

.book {
  width: 100%;
  height: 180px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s ease;
}

.book--flipped {
  transform: rotateY(180deg);
}

.book-cover,
.book-pages {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.book-cover {
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%);
  color: white;
}

.book-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.book-label {
  font-size: 16px;
  font-weight: 600;
}

.book-pages {
  background: var(--color-bg-secondary);
  transform: rotateY(180deg);
  padding: 16px;
  text-align: center;
}

.page-text {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
}

.flip-hint {
  text-align: center;
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 8px;
}

.resource-warning {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 8px;
  padding: 12px;
  background: rgba(251, 191, 36, 0.15);
  border-radius: 8px;
}

.warning-icon {
  font-size: 16px;
  flex-shrink: 0;
  line-height: 1.3;
}

.warning-text {
  font-size: 13px;
  color: #b45309;
  line-height: 1.45;
  white-space: pre-line;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 16px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.action-btn--read {
  background: var(--color-accent);
  color: var(--color-text-on-accent);

  &:hover:not(:disabled) {
    background: var(--color-accent-dark);
    transform: translateY(-2px);
  }
}

.action-btn--finish {
  background: var(--color-pastel-green);
  color: var(--color-text-primary);

  &:hover:not(:disabled) {
    background: var(--color-pastel-green-strong);
    transform: translateY(-2px);
  }
}

.btn-icon {
  font-size: 16px;
}
</style>
