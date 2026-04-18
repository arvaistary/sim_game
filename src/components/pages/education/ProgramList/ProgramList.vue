<template>
  <div class="programs-wrapper">
    <h3 class="section-title">Программы обучения</h3>
    <div class="programs-list">
      <RoundedPanel
        v-for="program in programs"
        :key="program.id"
        class="program-card"
        :class="{
          disabled: !canAfford(program),
          'age-locked': !isAgeOk(program),
        }"
        @click="startProgram(program)"
      >
        <div class="program-header">
          <span class="program-title">{{ program.title }}</span>
          <span class="program-type">{{ program.typeLabel }}</span>
        </div>
        <p class="program-subtitle">{{ program.subtitle }}</p>
        <div class="program-meta">
          <span class="meta-tag">{{ formatMoney(program.cost) }} ₽</span>
          <span class="meta-tag">{{ program.daysRequired }} дн.</span>
          <span class="meta-tag">{{ program.hoursRequired }} ч</span>
          <span v-if="program.minAgeGroup" class="meta-tag age-tag">{{ getAgeGroupLabel(program.minAgeGroup) }}+</span>
        </div>
        <p class="program-reward">{{ program.rewardText }}</p>
        <p v-if="!isAgeOk(program)" class="program-lock-reason">
          🔒 {{ program.ageReason || `Доступно с ${getAgeGroupLabel(program.minAgeGroup ?? AgeGroup.TEEN)}+` }}
        </p>
      </RoundedPanel>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RoundedPanel from '@/components/ui/RoundedPanel/index.vue'
import { useGameStore } from '@/stores/game.store'
import { showGameResultModal } from '@/composables/useGameModal'
import { useToast } from '@/composables/useToast'
import { EDUCATION_PROGRAMS } from '@/domain/balance/constants/education-programs'
import type { EducationProgram } from '@/domain/balance/types'
import { formatMoney } from '@/utils/format'
import { AgeGroup, getAgeGroup } from '@/composables/useAgeRestrictions/age-constants'

const store = useGameStore()
const toast = useToast()

const programs = EDUCATION_PROGRAMS as unknown as EducationProgram[]

const currentAge = computed(() => store.age ?? 0)
const currentAgeGroup = computed(() => getAgeGroup(currentAge.value))

function isAgeOk(program: EducationProgram): boolean {
  const minAgeGroup = program.minAgeGroup ?? AgeGroup.TEEN
  return currentAgeGroup.value >= minAgeGroup
}

function getAgeGroupLabel(ageGroup: AgeGroup): string {
  const labels: Record<AgeGroup, string> = {
    [AgeGroup.INFANT]: '0–3',
    [AgeGroup.TODDLER]: '4–7',
    [AgeGroup.CHILD]: '8–12',
    [AgeGroup.KID]: '8–12',
    [AgeGroup.TEEN]: '13–15',
    [AgeGroup.YOUNG]: '16–18',
    [AgeGroup.ADULT]: '19+',
  }
  return labels[ageGroup]
}

function canAfford(program: EducationProgram): boolean {
  return (store.money ?? 0) >= program.cost
}

function startProgram(program: EducationProgram): void {
  if (!isAgeOk(program)) {
    const minAgeGroup = program.minAgeGroup ?? AgeGroup.TEEN
    toast.showWarning(`${program.ageReason || `Эта программа доступна с ${getAgeGroupLabel(minAgeGroup)}+`}. Сейчас вам ${currentAge.value} лет.`)
    return
  }
  if (!canAfford(program)) {
    toast.showWarning('Недостаточно денег')
    return
  }
  if (!store.isInitialized) {
    toast.showError('Мир не инициализирован')
    return
  }
  const check = store.canStartEducationProgramWithReason(program.id)
  if (!check.ok) {
    toast.showWarning(check.reason ?? 'Нельзя начать эту программу')
    return
  }
  const result = store.startEducationProgram(program.id)
  if (result && !result.startsWith('Мир не')) {
    // Передаём базовый эффект для расчёта модификаторов
    const baseEffect = (program as unknown as { effect?: string }).effect
    showGameResultModal(program.title, result, { baseEffect })
  } else {
    toast.showError(result || 'Не удалось начать обучение')
  }
}
</script>

<style scoped lang="scss" src="./ProgramList.scss"></style>
