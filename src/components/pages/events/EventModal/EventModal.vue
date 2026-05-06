<template>
  <Modal
    @close="handleClose"
    title="Событие"
    max-width="480px"
    >
    <div class="event-modal">
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
        @back="handleClose"
      />
    </div>
  </Modal>
</template>

<script setup lang="ts">
import './EventModal.scss'

import type { EventChoice } from './EventModal.types'
import type { EventQueueItem } from '@stores/events-store'
import EventCard from '../EventCard/EventCard.vue'
import EventChoices from '../EventChoices/EventChoices.vue'
import EventResult from '../EventResult/EventResult.vue'

const emit = defineEmits<{
  close: []
}>()

const events = useEvents()
const toast = useToast()

const resultText = ref<string>('')

const currentEvent = computed<EventQueueItem | null>(() => events.currentEvent.value)
const hasNextEvent = computed<boolean>(() => events.hasNextEvent.value)

onMounted(() => {
  events.loadNextEvent()
})

function selectChoice(choice: EventChoice): void {
  const result = events.applyChoice(choice.id)

  if (!result.success) {
    toast.showError(result.message)

    return
  }
  toast.showSuccess('Выбор применён!')
  resultText.value = `Вы выбрали: ${choice.text}`
}

function proceedNext(): void {
  resultText.value = ''
  const next: unknown = events.loadNextEvent()

  if (!next) {
    toast.showInfo('Больше нет событий')
    handleClose()
  }
}

function handleClose(): void {
  emit('close')
}
</script>
