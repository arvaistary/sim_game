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
import './ProfileCard.scss'

import SkillsModal from '../SkillsModal/SkillsModal.vue'

import { formatMoney } from '@/utils/format'

const timeStore = useTimeStore()
const walletStore = useWalletStore()
const careerStore = useCareerStore()
const housingStore = useHousingStore()

const { isStatVisible } = useAgeRestrictions()
const isMoneyVisible = computed(() => isStatVisible('money'))

const playerName = ref('Алексей') // Можно вынести в отдельный store

function openSkillsModal() {
  openModal(SkillsModal, {
    onClose: () => {},
  })
}

const money = computed(() => walletStore.money)
const comfort = computed(() => housingStore.comfort)

const jobLabel = computed(() => {
  const job = careerStore.currentJob
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
  const gameDays = timeStore.gameDays
  const gameWeeks = timeStore.gameWeeksFloored
  const weekHoursRemaining = timeStore.weekHoursRemaining
  const currentAge = timeStore.currentAge

  return `День ${gameDays} • Неделя ${gameWeeks} (${weekHoursRemaining} ч. осталось) • ${currentAge} лет`
})
</script>

