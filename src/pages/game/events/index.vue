<template>
  <GameLayout title="События">
    <div class="event-page">
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
        @back="goBack"
      />
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import './events.scss'
import type { ComputedRef } from 'vue'
import type { EventChoice, GameEvent } from '@/stores/events-store'

definePageMeta({ middleware: 'game-init' })

const events = useEvents()
const toast = useToast()
const router = useRouter()

const resultText = ref('')

const currentEvent: ComputedRef<GameEvent | null> = computed(() => events.currentEvent.value)
const hasNextEvent: ComputedRef<boolean> = computed(() => events.hasNextEvent.value)

onMounted(() => {
  events.loadNextEvent()
})

async function selectChoice(choice: EventChoice): Promise<void> {
  const ok: boolean = await events.applyChoice(choice.id)

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
</script>
