<template>
  <div class="skills-list-wrapper">
    <SectionHeader title="Базовые навыки" subtitle="Общие навыки на каждый день" />
    <div class="skills-list">
      <SkillCard
        v-for="skill in basicSkills"
        :key="skill.key"
        :skill="skill"
        :level="getSkillLevel(skill.key)"
      />
    </div>

    <SectionHeader title="Профессиональные навыки" subtitle="Специализированные навыки для карьеры" />
    <div class="skills-list">
      <SkillCard
        v-for="skill in professionalSkills"
        :key="skill.key"
        :skill="skill"
        :level="getSkillLevel(skill.key)"
      />
    </div>

    <RoundedPanel v-if="basicSkills.length === 0 && professionalSkills.length === 0">
      <p class="page-desc">Нет навыков</p>
    </RoundedPanel>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RoundedPanel from '@/components/ui/RoundedPanel.vue'
import SectionHeader from '@/components/game/SectionHeader/SectionHeader.vue'
import SkillCard from '@/components/pages/skills/SkillCard/SkillCard.vue'
import { useGameStore } from '@/stores/game.store'
import { BASIC_SKILLS, PROFESSIONAL_SKILLS } from '@/domain/balance/constants/skills-constants'
import type { SkillDef } from '@/domain/balance/types'

const store = useGameStore()

const basicSkills = computed<SkillDef[]>(() => {
  return BASIC_SKILLS as unknown as SkillDef[]
})

const professionalSkills = computed<SkillDef[]>(() => {
  return PROFESSIONAL_SKILLS as unknown as SkillDef[]
})

function getSkillLevel(key: string): number {
  const skills = store.skills as Record<string, unknown> | null
  if (!skills) return 0
  const entry = skills[key]
  if (typeof entry === 'number') return entry
  if (entry && typeof entry === 'object' && 'level' in (entry as Record<string, unknown>)) {
    return (entry as { level: number }).level
  }
  return 0
}
</script>

<style scoped lang="scss" src="./SkillList.scss"></style>
