<template>
  <RoundedPanel
    class="profile-card"
    accent
    padding="var(--space-card-padding)"
  >
    <!-- Header: avatar + name/job -->
    <div class="profile-card__header">
      <span class="profile-card__avatar">{{ initials }}</span>
      <div class="profile-card__copy">
        <h2 class="profile-card__name">{{ playerName }}</h2>
        <p class="profile-card__job">{{ jobLabel }}</p>
      </div>
    </div>

    <!-- KPI grid -->
    <div class="profile-card__kpis">
      <div class="profile-card__kpi">
        <span class="profile-card__kpi-label">Возраст</span>
        <span class="profile-card__kpi-value metric">{{ currentAge }}<span class="profile-card__kpi-unit">лет</span></span>
      </div>
      <div
        v-if="isMoneyVisible"
        class="profile-card__kpi"
      >
        <span class="profile-card__kpi-label">Деньги</span>
        <span class="profile-card__kpi-value metric">{{ formatMoney(money) }}<span class="profile-card__kpi-unit">₽</span></span>
      </div>
      <div class="profile-card__kpi">
        <span class="profile-card__kpi-label">День</span>
        <span class="profile-card__kpi-value metric">{{ gameDays }}</span>
      </div>
      <div class="profile-card__kpi">
        <span class="profile-card__kpi-label">Комфорт</span>
        <span class="profile-card__kpi-value metric">{{ Math.round(comfort) }}</span>
      </div>
    </div>

    <!-- Footer: time + skills -->
    <div class="profile-card__footer">
      <p class="profile-card__time">{{ timeLabel }}</p>
      <GameButton
        label="Навыки"
        variant="secondary"
        small
        @click="openSkillsModal"
      />
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
const playerStore = usePlayerStore()

const { isStatVisible } = useAgeRestrictions()
const isMoneyVisible = computed<boolean>(() => isStatVisible('money'))

const playerName = computed<string>(() => playerStore.name)
const initials = computed<string>(() => {
  const name: string = playerName.value.trim()
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
})

const money = computed<number>(() => walletStore.money)
const comfort = computed<number>(() => housingStore.comfort)
const gameDays = computed<number>(() => timeStore.gameDays)
const currentAge = computed<number>(() => timeStore.currentAge)

const jobLabel = computed<string>(() => {
  const job = careerStore.currentJob
  if (!job || !job.id) return 'Безработный'
  return job.name
})

const timeLabel = computed<string>(() => {
  const gameWeeks = timeStore.gameWeeksFloored
  const weekHoursRemaining = timeStore.weekHoursRemaining
  return `Неделя ${gameWeeks} • ${weekHoursRemaining} ч осталось`
})

function openSkillsModal(): void {
  openModal(SkillsModal, {
    onClose: () => {},
  })
}
</script>
