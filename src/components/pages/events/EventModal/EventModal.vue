<template>
  <Modal
    title="Событие"
    max-width="480px"
    @close="handleClose"
  >
    <div class="event-modal">
      <EmptyState
        v-if="!currentEvent && !resultText"
        text="В очереди ничего не ожидает вашего решения."
      />

      <template v-if="currentEvent && !resultText">
        <EventCard :event="currentEvent" />
        <EventChoices :choices="currentEvent.choices ?? []" @select="selectChoice" />
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
import type { ComputedRef } from 'vue'
import EventCard from '../EventCard/EventCard.vue'
import EventChoices from '../EventChoices/EventChoices.vue'
import EventResult from '../EventResult/EventResult.vue'
import type { EventChoice, GameEvent } from '@/stores/events-store'
import type { EventModalEmits } from './EventModal.types'

const emit = defineEmits<EventModalEmits>()

const events = useEvents()
const toast = useToast()

const resultText = ref('')

const currentEvent: ComputedRef<GameEvent | null> = computed(() => events.currentEvent.value)
const hasNextEvent: ComputedRef<boolean> = computed(() => events.hasNextEvent.value)

onMounted(() => {
  events.loadNextEvent()
})

function selectChoice(choice: EventChoice) {
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
    handleClose()
  }
}

function handleClose() {
  emit('close')
}
</script>

<style scoped lang="scss">
.event-modal {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
