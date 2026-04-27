<template>
  <GameLayout title="События">
    <div class="event-page">
      <EmptyState
        v-if="!currentEvent && !resultText"
        text="В очереди ничего не ожидает вашего решения."
      />

      <template v-if="currentEvent && !resultText">
        <EventCard :event="currentEvent" />
        <EventChoices
          :choices="currentEvent.choices ?? []"
          @select="selectChoice"
        />
      </template>

      <EventResult
        v-if="resultText"
        :result-text="resultText"
        :has-next-event="hasNextEvent"
        @next="proceedNext"
        @back="goBack"
      />
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import './index.scss'

import type { EventChoiceParam } from './index.types'
import type { GameEvent } from '@stores/events-store'

definePageMeta({ middleware: 'game-init' })

const router = useRouter()

const events = useEvents()
const toast = useToast()

const resultText = ref<string>('')

const currentEvent = computed<GameEvent | null>(() => events.currentEvent.value)
const hasNextEvent = computed<boolean>(() => events.hasNextEvent.value)

function selectChoice(choice: EventChoiceParam) {
  const ok: boolean = events.applyChoice(choice.id)

  if (!ok) {
    toast.showError('Не удалось применить выбор')

    return
  }
  toast.showSuccess('Выбор применён!')
  resultText.value = `Вы выбрали: ${choice.text}`
}

function proceedNext() {
  resultText.value = ''

  const next: GameEvent | null = events.loadNextEvent()

  if (!next) {
    toast.showInfo('Больше нет событий')
    goBack()
  }
}

function goBack() {
  router.back()
}

onMounted(() => {
  events.loadNextEvent()
})
</script>
