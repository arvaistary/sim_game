<template>
  <div class="programs-wrapper">
    <h3 class="section-title">Программы обучения</h3>
    <div class="programs-list">
      <RoundedPanel
        v-for="program in programs"
        :key="program.id"
        class="program-card"
        :class="{ disabled: !canAfford(program) }"
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
        </div>
        <p class="program-reward">{{ program.rewardText }}</p>
      </RoundedPanel>
    </div>
  </div>
</template>

<script setup lang="ts">
import RoundedPanel from '@/components/ui/RoundedPanel.vue'
import { useGameStore } from '@/stores/game.store'
import { useToast } from '@/composables/useToast'
import { EDUCATION_PROGRAMS } from '@/domain/balance/constants/education-programs'
import type { EducationProgram } from '@/domain/balance/types'
import { formatMoney } from '@/utils/format'

const store = useGameStore()
const toast = useToast()

const programs = EDUCATION_PROGRAMS as unknown as EducationProgram[]

function canAfford(program: EducationProgram): boolean {
  return (store.money ?? 0) >= program.cost
}

function startProgram(program: EducationProgram): void {
  if (!canAfford(program)) {
    toast.showWarning('Недостаточно денег')
    return
  }
  if (!store.isInitialized) {
    toast.showError('Мир не инициализирован')
    return
  }
  if (!store.canStartEducationProgram(program.id)) {
    toast.showWarning('Нельзя начать эту программу')
    return
  }
  const result = store.startEducationProgram(program.id)
  if (result && !result.startsWith('Мир не')) {
    toast.showSuccess(result)
  } else {
    toast.showError(result || 'Не удалось начать обучение')
  }
}
</script>

<style scoped lang="scss" src="./ProgramList.scss"></style>
