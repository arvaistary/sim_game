<template>
  <div class="skills-list-wrapper">
    <!-- Табы-переключатели категорий -->
    <div class="skills-tabs">
      <button
        v-for="tab in SKILL_TABS"
        :key="tab.id"
        :class="{ 'skills-tab--active': activeTab === tab.id }"
        @click="activeTab = tab.id"
        class="skills-tab"
        >
        <span class="skills-tab__icon">
          {{ tab.icon }}
        </span>
        <span class="skills-tab__content">
          <span class="skills-tab__title">
            {{ tab.title }}
          </span>
          <span class="skills-tab__desc">
            {{ tab.shortDesc }}
          </span>
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
      <p class="page-desc">
        Нет навыков
      </p>
    </RoundedPanel>
  </div>
</template>

<script setup lang="ts">
import './SkillList.scss'

import { BASIC_SKILLS, PROFESSIONAL_SKILLS, SOCIAL_SKILLS, CREATIVE_SKILLS, NEGATIVE_SKILLS } from '@domain/balance/constants/skills-constants'
import type { SkillDef } from '@domain/balance/types'
import { SKILL_TABS } from './SkillList.constants'
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

