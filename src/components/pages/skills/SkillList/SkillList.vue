<template>
  <div class="skills-list-wrapper">
    <!-- Табы-переключатели категорий -->
    <div class="skills-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="skills-tab"
        :class="{ 'skills-tab--active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <span class="skills-tab__icon">{{ tab.icon }}</span>
        <span class="skills-tab__content">
          <span class="skills-tab__title">{{ tab.title }}</span>
          <span class="skills-tab__desc">{{ tab.shortDesc }}</span>
        </span>
      </button>
    </div>

    <!-- Контент активного таба -->
    <div class="skills-list">
      <SkillCard
        v-for="skill in activeSkills"
        :key="skill.key"
        :skill="skill"
        :level="getSkillLevel(skill.key)"
      />
    </div>

    <RoundedPanel v-if="activeSkills.length === 0">
      <p class="page-desc">Нет навыков</p>
    </RoundedPanel>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/game.store'
import {
  BASIC_SKILLS,
  PROFESSIONAL_SKILLS,
  SOCIAL_SKILLS,
  CREATIVE_SKILLS,
  NEGATIVE_SKILLS,
} from '@/domain/balance/constants/skills-constants'
import type { SkillDef } from '@/domain/balance/types'

const tabs = [
  { id: 'basic', icon: '🧩', title: 'Базовые', shortDesc: 'Общие навыки на каждый день' },
  { id: 'professional', icon: '💼', title: 'Профессиональные', shortDesc: 'Навыки для карьеры' },
  { id: 'social', icon: '🤝', title: 'Социальные', shortDesc: 'Общение и отношения' },
  { id: 'creative', icon: '🎨', title: 'Творческие', shortDesc: 'Искусство и созидание' },
  { id: 'negative', icon: '⚠️', title: 'Слабости', shortDesc: 'Черты, мешающие развитию' },
] as const

const activeTab = ref<string>('basic')

const store = useGameStore()

const skillsMap: Record<string, SkillDef[]> = {
  basic: BASIC_SKILLS as unknown as SkillDef[],
  professional: PROFESSIONAL_SKILLS as unknown as SkillDef[],
  social: SOCIAL_SKILLS as unknown as SkillDef[],
  creative: CREATIVE_SKILLS as unknown as SkillDef[],
  negative: NEGATIVE_SKILLS as unknown as SkillDef[],
}

const activeSkills = computed<SkillDef[]>(() => {
  return skillsMap[activeTab.value] ?? []
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
