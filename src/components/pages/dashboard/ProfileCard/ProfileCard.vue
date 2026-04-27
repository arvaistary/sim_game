<template>
  <RoundedPanel
    class="card profile-card"
    padding="18px"
    >
    <h1 class="profile-name">
      {{ playerName }}
    </h1>
    <p class="profile-job">
      {{ jobLabel }}
    </p>
    <p
      v-if="isMoneyVisible"
      class="profile-money"
      >
      {{ formatMoney(money) }} ₽
    </p>
    <p class="profile-time">
      {{ timeLabel }}
    </p>
    <p class="profile-comfort">
      Комфорт: {{ Math.round(comfort) }}
    </p>
    <div
      v-if="hasAnySkills"
      class="profile-buttons"
      >
      <GameButton
        @click="openSkillsModal"
        label="Мои навыки"
        small
        />
    </div>
  </RoundedPanel>
</template>

<script setup lang="ts">
import './ProfileCard.scss'

import SkillsModal from '../SkillsModal/SkillsModal.vue'

import { formatMoney } from '@utils/format'

const timeStore = useTimeStore()
const walletStore = useWalletStore()
const careerStore = useCareerStore()
const housingStore = useHousingStore()
const skillsStore = useSkillsStore()
const playerStore = usePlayerStore()

const { isStatVisible } = useAgeRestrictions()
const isMoneyVisible = computed<boolean>(() => isStatVisible('money'))
const hasAnySkills = computed<boolean>(() => skillsStore.totalLevels > 0)

const playerName = computed<string>(() => playerStore.name)

function openSkillsModal() {
  openModal(SkillsModal, {
    onClose: () => {},
  })
}

const money = computed<number>(() => walletStore.money)
const comfort = computed<number>(() => housingStore.comfort)

const jobLabel = computed<string>(() => {
  const job: typeof careerStore.currentJob = careerStore.currentJob

  if (!job || !job.id) return 'Безработный'

  const baseLabel: string = job.name
  const required: number = job.requiredHoursPerWeek
  const worked: number = job.workedHoursCurrentWeek

  if (required <= 0) return baseLabel

  const remaining: number = Math.max(0, required - worked)
  const status: string = remaining > 0
    ? `ещё ${remaining} ч до нормы`
    : 'норма закрыта'

  return `${baseLabel} • ${worked}/${required} ч (${status})`
})

const timeLabel = computed<string>(() => {
  const gameDays: number = timeStore.gameDays
  const gameWeeks: number = timeStore.gameWeeksFloored
  const weekHoursRemaining: number = timeStore.weekHoursRemaining
  const currentAge: number = timeStore.currentAge

  return `День ${gameDays} • Неделя ${gameWeeks} (${weekHoursRemaining} ч. осталось) • ${currentAge} лет`
})
</script>

