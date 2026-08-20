<template>
  <RoundedPanel
    class="vacancy-card"
    :class="{ 'vacancy-card--disabled': disabled }"
    padding="14px 16px"
  >
    <div class="vacancy-card__header">
      <h3 class="vacancy-card__title">{{ job.name }}</h3>
      <span class="vacancy-card__salary">{{ formatMoney(job.effectiveSalaryPerHour || job.salaryPerHour) }} ₽/ч</span>
    </div>

    <p class="vacancy-card__description">{{ job.description }}</p>

    <div class="vacancy-card__footer">
      <div class="vacancy-card__tags">
        <span class="vacancy-card__tag">Уровень {{ job.level }}</span>
        <span class="vacancy-card__tag">{{ job.schedule }}</span>
      </div>

      <GameButton
        v-if="job.unlocked && !job.current"
        label="Устроиться"
        variant="primary"
        small
        :disabled="disabled"
        @click="handleApply"
      />

      <p
        v-else-if="disabledReason"
        class="vacancy-card__disabled-reason"
      >
        {{ disabledReason }}
      </p>
    </div>
  </RoundedPanel>
</template>

<script setup lang="ts">
import './VacancyCard.scss'
import { formatMoney } from '@/utils/format'
import type { VacancyCardEmits, VacancyCardProps } from './VacancyCard.types'

const props = withDefaults(defineProps<VacancyCardProps>(), {
  disabled: false,
  disabledReason: '',
})

const emit = defineEmits<VacancyCardEmits>()

function handleApply(): void {
  if (props.disabled) return

  emit('apply', props.job)
}
</script>
