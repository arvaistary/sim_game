<template>
  <GameLayout title="Образование">
    <div class="education-page">
      <!-- Текущее образование -->
      <RoundedPanel>
        <h3 class="section-title">Текущий уровень</h3>
        <div class="edu-level">
          <span class="edu-label">{{ educationLevel }}</span>
          <span v-if="activeCourse" class="edu-active">📚 {{ activeCourse.name }}</span>
        </div>
      </RoundedPanel>

      <!-- Программы -->
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
  </GameLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import GameLayout from '@/components/layout/GameLayout.vue'
import RoundedPanel from '@/components/ui/RoundedPanel.vue'
import { useGameStore } from '@/stores/game.store'
import { useToast } from '@/composables/useToast'
import { EDUCATION_PROGRAMS } from '@/domain/balance/education-programs'
import type { EducationProgram } from '@/domain/balance/types'

const store = useGameStore()
const toast = useToast()

const educationLevel = computed(() => {
  const edu = store.education as unknown as Record<string, unknown> | null
  return (edu?.educationLevel as string) ?? 'Нет'
})

const activeCourse = computed(() => {
  const edu = store.education as unknown as Record<string, unknown> | null
  const courses = edu?.activeCourses as Array<Record<string, unknown>> | null
  return courses && courses.length > 0 ? courses[0] : null
})

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

function formatMoney(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}
</script>

<style scoped>
.education-page{display:flex;flex-direction:column;gap:12px}
.section-title{font-size:15px;font-weight:700;margin:0 0 8px}
.edu-level{display:flex;flex-direction:column;gap:4px}
.edu-label{font-size:16px;font-weight:700}
.edu-active{font-size:13px;color:var(--color-sage)}
.programs-list{display:flex;flex-direction:column;gap:10px}
.program-card{cursor:pointer;transition:all .2s}
.program-card:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,.08)}
.program-card.disabled{opacity:.5;cursor:not-allowed}
.program-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
.program-title{font-size:14px;font-weight:600}
.program-type{font-size:11px;background:rgba(168,202,186,.2);padding:2px 8px;border-radius:8px;color:var(--color-sage)}
.program-subtitle{font-size:12px;color:var(--color-text);opacity:.7;margin:4px 0}
.program-meta{display:flex;gap:6px;margin:6px 0}
.meta-tag{font-size:11px;background:rgba(0,0,0,.05);padding:2px 8px;border-radius:8px}
.program-reward{font-size:12px;color:var(--color-accent);font-weight:500}
</style>

