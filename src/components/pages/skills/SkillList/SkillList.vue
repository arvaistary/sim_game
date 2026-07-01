<template>
  <div class="skills-list-wrapper">
    <!-- Табы-переключатели категорий -->
    <Tabs
      v-model="activeTab"
      :items="tabItems"
    />

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
import './SkillList.scss'
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

// Map tabs to Tabs.vue API
const tabItems = computed(() => tabs.map(t => ({
  id: t.id,
  icon: t.icon,
  label: t.title,
  subtitle: t.shortDesc,
})))

const activeTab = ref<string>('basic')

const skillsStore = useSkillsStore()

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
  return skillsStore.getSkillLevel(key)
}
</script>
