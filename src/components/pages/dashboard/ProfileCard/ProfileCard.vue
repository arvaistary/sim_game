<template>
  <RoundedPanel class="card profile-card" padding="18px">
    <h1 class="profile-name">{{ playerName }}</h1>
    <p class="profile-job">{{ jobLabel }}</p>
    <p class="profile-money">{{ formatMoney(money) }} ₽</p>
    <p class="profile-time">{{ timeLabel }}</p>
    <p class="profile-comfort">Комфорт: {{ Math.round(comfort) }}</p>
    <div class="profile-buttons">
      <GameButton label="Карьера" small @click="navigateTo('/game/career')" />
      <GameButton label="Мои навыки" small @click="navigateTo('/game/skills')" />
    </div>
  </RoundedPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { navigateTo } from '#imports'
import { useGameStore } from '@/stores/game.store'
import RoundedPanel from '@/components/ui/RoundedPanel.vue'
import GameButton from '@/components/ui/GameButton.vue'
import { formatMoney } from '@/utils/format'

const store = useGameStore()

const playerName = computed(() => store.playerName)
const money = computed(() => store.money)
const comfort = computed(() => store.comfort)

const jobLabel = computed(() => {
  const career = store.career
  if (!career?.currentJob) return 'Безработный'
  const job = career.currentJob as any
  const baseLabel = job.name || 'Безработный'
  const required = Math.max(0, Number(job.requiredHoursPerWeek) || 0)
  const worked = Math.max(0, Number(job.workedHoursCurrentWeek) || 0)
  if (required <= 0) return baseLabel
  const remaining = Math.max(0, required - worked)
  const status = remaining > 0
    ? `ещё ${remaining} ч до нормы`
    : 'норма закрыта'
  return `${baseLabel} • ${worked}/${required} ч (${status})`
})

const timeLabel = computed(() => {
  const t = store.time as unknown as Record<string, unknown> | null
  if (!t) return 'День 1 • Неделя 1 (168 ч. осталось) • 18 лет'
  const gameDays = (t?.gameDays as number) || 1
  const gameWeeks = (t?.gameWeeks as number) || 1
  const weekHoursRemaining = (t?.weekHoursRemaining as number) ?? 168
  const currentAge = (t?.currentAge as number) || (t?.age as number) || 18
  return `День ${gameDays} • Неделя ${gameWeeks} (${weekHoursRemaining} ч. осталось) • ${currentAge} лет`
})
</script>

<style scoped lang="scss" src="./ProfileCard.scss"></style>
