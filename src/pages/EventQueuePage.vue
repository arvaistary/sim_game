<template>
  <GameLayout title="События">
    <div class="event-page">
      <RoundedPanel v-if="!currentEvent && !resultText" class="empty-panel">
        <p class="empty-title">Нет событий</p>
        <p class="empty-desc">В очереди ничего не ожидает вашего решения.</p>
        <GameButton label="Назад" color="var(--color-neutral)" @click="goBack" />
      </RoundedPanel>

      <template v-if="currentEvent && !resultText">
        <RoundedPanel class="event-card">
          <h3 class="event-title">{{ currentEvent.title }}</h3>
          <p class="event-desc">{{ currentEvent.description }}</p>

          <div v-if="impactText" class="event-impact">
            <p class="impact-label">Последствия:</p>
            <p class="impact-text">{{ impactText }}</p>
          </div>

          <div class="event-day">День {{ currentEvent.day }}</div>
        </RoundedPanel>

        <div class="choices-list">
          <GameButton
            v-for="choice in currentEvent.choices"
            :key="choice.id"
            :label="choice.text"
            color="var(--color-accent)"
            text-color="#fff"
            class="choice-btn"
            @click="selectChoice(choice)"
          />
        </div>
      </template>

      <RoundedPanel v-if="resultText" class="result-panel">
        <h3 class="result-title">Результат выбора</h3>
        <p class="result-text">{{ resultText }}</p>
        <div class="result-actions">
          <GameButton
            v-if="hasNextEvent"
            label="Следующее событие"
            color="var(--color-accent)"
            text-color="#fff"
            @click="proceedNext"
          />
          <GameButton
            label="Назад"
            color="var(--color-neutral)"
            @click="!hasNextEvent ? goBack() : proceedNext()"
          />
        </div>
      </RoundedPanel>
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from '#imports'
import GameLayout from '@/components/layout/GameLayout.vue'
import RoundedPanel from '@/components/ui/RoundedPanel.vue'
import GameButton from '@/components/ui/GameButton.vue'
import { useEvents } from '@/composables/useEvents'
import { useToast } from '@/composables/useToast'
import { formatStatChangesBulletListRu } from '@/shared/utils'
import { useGameStore } from '@/stores/game.store'

const store = useGameStore()
const events = useEvents()
const toast = useToast()
const router = useRouter()

const resultText = ref('')

const currentEvent = computed(() => events.currentEvent.value)
const hasNextEvent = computed(() => events.hasNextEvent.value)

const impactText = computed(() => {
  const evt = currentEvent.value
  if (!evt?.data?.statImpact) return ''
  return formatStatChangesBulletListRu(evt.data.statImpact as any)
})

onMounted(() => {
  events.loadNextEvent()
})

function selectChoice(choice: { id: string; text: string }) {
  const ok = events.applyChoice(choice.id)
  if (!ok) {
    toast.showError('Не удалось применить выбор')
    return
  }
  toast.showSuccess('Выбор применён!')
  resultText.value = `Вы выбрали: ${choice.text}`
}

function proceedNext() {
  resultText.value = ''
  const next = events.loadNextEvent()
  if (!next) {
    toast.showInfo('Больше нет событий')
    goBack()
  }
}

function goBack() {
  router.back()
}
</script>

<style scoped>
.event-page{display:flex;flex-direction:column;gap:12px}
.empty-panel{display:flex;flex-direction:column;align-items:center;gap:12px;padding:32px 16px}
.empty-title{font-size:18px;font-weight:700;margin:0}
.empty-desc{font-size:13px;color:var(--color-text);opacity:.7;margin:0}
.event-card{display:flex;flex-direction:column;gap:8px}
.event-title{font-size:18px;font-weight:700;margin:0}
.event-desc{font-size:14px;color:var(--color-text);line-height:1.5;margin:0}
.event-impact{background:rgba(232,180,160,.1);border-radius:10px;padding:10px 12px}
.impact-label{font-size:12px;font-weight:600;opacity:.7;margin:0 0 4px}
.impact-text{font-size:13px;white-space:pre-line;margin:0;line-height:1.5}
.event-day{font-size:11px;color:var(--color-text);opacity:.5}
.choices-list{display:flex;flex-direction:column;gap:8px}
.choice-btn{width:100%}
.result-panel{display:flex;flex-direction:column;gap:10px}
.result-title{font-size:17px;font-weight:700;margin:0}
.result-text{font-size:14px;line-height:1.5;white-space:pre-line;margin:0}
.result-actions{display:flex;gap:8px;margin-top:4px}
</style>

