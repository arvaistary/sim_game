<template>
  <nav
    class="prologue-progress"
    aria-label="Этапы пролога"
  >
    <ol class="prologue-progress__list">
      <li
        v-for="step in steps"
        :key="step.id"
        class="prologue-progress__item"
        :class="{
          'prologue-progress__item--current': step.isCurrent,
          'prologue-progress__item--done': step.done,
        }"
      >
        {{ step.label }}
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import './PrologueProgress.scss'
import type { ComputedRef } from 'vue'
import type { PrologueStatus } from '@/domain/prologue/prologue.types'
import type { ProgressStepView, PrologueProgressProps } from './PrologueProgress.types'

const props = defineProps<PrologueProgressProps>()

const ORDER: string[] = ['early', 'school', 'fork', 'postsec', 'summary']

const steps: ComputedRef<ProgressStepView[]> = computed(() => {
  const currentId: string = mapStatus(props.status)
  const currentIndex: number = ORDER.indexOf(currentId)

  return [
    { id: 'early', label: 'Детство', done: currentIndex > 0, isCurrent: currentId === 'early' },
    { id: 'school', label: 'Школа', done: currentIndex > 1, isCurrent: currentId === 'school' },
    { id: 'fork', label: 'Выбор', done: currentIndex > 2, isCurrent: currentId === 'fork' },
    { id: 'postsec', label: 'Учёба', done: currentIndex > 3, isCurrent: currentId === 'postsec' },
    {
      id: 'summary',
      label: 'Итог',
      done: props.status === 'completed',
      isCurrent: currentId === 'summary',
    },
  ]
})

function mapStatus(status: PrologueStatus): string {
  switch (status) {
    case 'early':
      return 'early'
    case 'school':
    case 'school_exam':
      return 'school'
    case 'fork':
      return 'fork'
    case 'postsec':
    case 'postsec_exam':
      return 'postsec'
    case 'summary':
    case 'completed':
      return 'summary'
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}
</script>
