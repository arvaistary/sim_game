<template>
  <RoundedPanel class="card profile-card" padding="18px">
    <h1 class="profile-name">{{ playerName }}</h1>
    <p class="profile-job">{{ jobLabel }}</p>
    <p v-if="isMoneyVisible" class="profile-money">{{ formatMoney(money) }} ₽</p>
    <p class="profile-time">{{ timeLabel }}</p>
    <p class="profile-comfort">Комфорт: {{ Math.round(comfort) }}</p>
    <div class="profile-buttons">
      <GameButton label="Мои навыки" small @click="openSkillsModal" />
    </div>
  </RoundedPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game.store'
import { openModal } from '@/composables/useGameModal'
import SkillsModal from '../SkillsModal/SkillsModal.vue'
import { formatMoney } from '@/utils/format'
import { useAgeRestrictions } from '@/composables/useAgeRestrictions'

const store = useGameStore()
const { isStatVisible } = useAgeRestrictions()
const isMoneyVisible = computed(() => isStatVisible('money'))

function openSkillsModal() {
  openModal(SkillsModal, {
    onClose: () => {
      // Modal will be closed by the stack
    },
  })
}

const playerName = computed(() => store.playerName)
const money = computed(() => store.money)
const comfort = computed(() => store.comfort)

const jobLabel = computed(() => {
  const job = store.currentJobSnapshot
  if (!job || !job.id) return 'Безработный'

  const baseLabel = job.name
  const required = job.requiredHoursPerWeek
  const worked = job.workedHoursCurrentWeek
  if (required <= 0) return baseLabel

  const remaining = Math.max(0, required - worked)
  const status = remaining > 0
    ? `ещё ${remaining} ч до нормы`
    : 'норма закрыта'

  return `${baseLabel} • ${worked}/${required} ч (${status})`
})

const timeLabel = computed(() => {
  const t = store.time as unknown as Record<string, unknown> | null
  if (!t) return 'День 0 • Неделя 1 (168 ч. осталось) • 18 лет'
  const gameDays = (t.gameDays as number) ?? 0
  const gameWeeks = (t.gameWeeks as number) ?? 1
  const weekHoursRemaining = (t.weekHoursRemaining as number) ?? 168
  const currentAge = (t.currentAge as number) ?? 18
  return `День ${gameDays} • Неделя ${gameWeeks} (${weekHoursRemaining} ч. осталось) • ${currentAge} лет`
})
</script>

<style scoped lang="scss" src="./ProfileCard.scss"></style>
