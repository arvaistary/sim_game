<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isActive"
        class="onboarding__overlay"
        @click.self="next"
      />
    </Transition>
    <Transition name="fade-scale">
      <div
        v-if="isActive && targetEl"
        class="onboarding__spotlight"
        :style="spotlightStyle"
      />
    </Transition>
    <Transition name="slide-up">
      <div
        v-if="isActive"
        class="onboarding__tooltip"
        :style="tooltipStyle"
        role="dialog"
        aria-modal="false"
        aria-label="Обучение"
      >
        <div class="onboarding__progress">Шаг {{ currentIndex + 1 }} из {{ steps.length }}</div>
        <h3 class="onboarding__title">{{ currentStep.title }}</h3>
        <p class="onboarding__text">{{ currentStep.text }}</p>
        <div class="onboarding__actions">
          <button
            class="onboarding__btn onboarding__btn--ghost"
            type="button"
            @click="skip"
          >Пропустить</button>
          <button
            class="onboarding__btn onboarding__btn--primary"
            type="button"
            @click="next"
          >{{ isLastStep ? 'Готово' : 'Дальше' }}</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import './OnboardingTour.scss'

interface OnboardingStep {
  target: string
  title: string
  text: string
  position: 'right' | 'bottom' | 'center'
}

const steps: OnboardingStep[] = [
  {
    target: '[data-tour="sidebar"]',
    title: 'Навигация',
    text: 'Здесь находятся все разделы игры. На мобильных — внизу экрана.',
    position: 'right',
  },
  {
    target: '[data-tour="topbar"]',
    title: 'Верхняя панель',
    text: 'Тема, командная палитра (Ctrl+K) и настройки — всё под рукой.',
    position: 'bottom',
  },
  {
    target: '[data-tour="profile"]',
    title: 'Профиль',
    text: 'Следите за здоровьем, настроением, энергией и деньгами персонажа.',
    position: 'bottom',
  },
  {
    target: '',
    title: 'Командная палитра',
    text: 'Нажмите Ctrl+K в любой момент, чтобы быстро найти раздел или действие.',
    position: 'center',
  },
]

const settings = useSettingsStore()
const route = useRoute()

const currentIndex = ref<number>(0)
const isActive = ref<boolean>(false)
const targetEl = ref<Element | null>(null)

const currentStep = computed<OnboardingStep>(() => steps[currentIndex.value] ?? steps[0]!)
const isLastStep = computed<boolean>(() => currentIndex.value === steps.length - 1)

const spotlightStyle = computed(() => {
  const el = targetEl.value
  if (!el) return {}
  const rect = el.getBoundingClientRect()
  return {
    top: `${rect.top - 4}px`,
    left: `${rect.left - 4}px`,
    width: `${rect.width + 8}px`,
    height: `${rect.height + 8}px`,
  }
})

const tooltipStyle = computed(() => {
  const step = currentStep.value
  const el = targetEl.value

  if (step.position === 'center' || !el) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }
  }

  const rect = el.getBoundingClientRect()
  if (step.position === 'right') {
    return {
      top: `${rect.top}px`,
      left: `${rect.right + 16}px`,
    }
  }
  // bottom
  return {
    top: `${rect.bottom + 16}px`,
    left: `${rect.left}px`,
  }
})

function tryStart(): void {
  if (route.path !== '/game') return
  if (settings.onboardingCompleted) return
  // small delay to let DOM render targets
  nextTick(() => {
    refreshTarget()
    isActive.value = true
  })
}

function refreshTarget(): void {
  const selector = currentStep.value.target
  if (!selector) {
    targetEl.value = null
    return
  }
  targetEl.value = document.querySelector(selector)
}

function next(): void {
  if (isLastStep.value) {
    finish()
    return
  }
  currentIndex.value += 1
  refreshTarget()
}

function finish(): void {
  isActive.value = false
  settings.completeOnboarding()
}

function skip(): void {
  isActive.value = false
  settings.completeOnboarding()
}

watch(() => route.fullPath, tryStart)
watch(currentIndex, refreshTarget)

onMounted(() => {
  tryStart()
})
</script>
