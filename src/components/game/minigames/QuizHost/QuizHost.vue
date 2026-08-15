<template>
  <section
    class="quiz-host"
    @keydown="onKeydown"
  >
    <h2 class="quiz-host__title">
      {{ title }}
    </h2>
    <p class="quiz-host__progress">
      Вопрос {{ currentIndex + 1 }} из {{ questions.length }}
    </p>
    <p class="quiz-host__prompt">
      {{ currentQuestion?.prompt }}
    </p>
    <div
      class="quiz-host__options"
      role="radiogroup"
      :aria-label="currentQuestion?.prompt"
    >
      <button
        v-for="(option, optionIndex) in currentQuestion?.options ?? []"
        :key="`${currentQuestion?.id}-${optionIndex}`"
        class="quiz-host__option"
        type="button"
        role="radio"
        :aria-checked="selectedIndex === optionIndex"
        :class="{ 'quiz-host__option--selected': selectedIndex === optionIndex }"
        @click="selectedIndex = optionIndex"
      >
        {{ optionIndex + 1 }}. {{ option }}
      </button>
    </div>
    <button
      class="quiz-host__next"
      type="button"
      :disabled="selectedIndex === null"
      @click="goNext"
    >
      {{ isLast ? 'Готово' : 'Далее' }}
    </button>
  </section>
</template>

<script setup lang="ts">
import './QuizHost.scss'
import type { ComputedRef, Ref } from 'vue'
import type { QuizHostEmits, QuizHostProps } from './QuizHost.types'

const props = defineProps<QuizHostProps>()

const emit = defineEmits<QuizHostEmits>()

const currentIndex: Ref<number> = ref<number>(0)
const selectedIndex: Ref<number | null> = ref<number | null>(null)
const selectedIndexes: Ref<number[]> = ref<number[]>([])

const currentQuestion = computed(() => props.questions[currentIndex.value])
const isLast: ComputedRef<boolean> = computed(() => currentIndex.value >= props.questions.length - 1)

function goNext(): void {
  if (selectedIndex.value === null) return

  selectedIndexes.value[currentIndex.value] = selectedIndex.value

  if (!isLast.value) {
    currentIndex.value += 1
    selectedIndex.value = selectedIndexes.value[currentIndex.value] ?? null
    return
  }

  let correctCount: number = 0

  for (let index = 0; index < props.questions.length; index += 1) {
    const question = props.questions[index]

    if (!question) continue

    if (selectedIndexes.value[index] === question.correctIndex) correctCount += 1
  }

  emit('complete', {
    correctCount,
    selectedIndexes: [...selectedIndexes.value],
  })
}

function onKeydown(event: KeyboardEvent): void {
  const digit: number = Number(event.key)

  if (digit >= 1 && digit <= 3) {
    selectedIndex.value = digit - 1
  }
}
</script>
