<template>
  <GameLayout title="Навыки">
    <div class="skills-page">
      <!-- Табы категорий -->
      <div class="tabs-row">
        <button
          v-for="tab in skillTabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Список навыков -->
      <div class="skills-list">
        <RoundedPanel
          v-for="skill in filteredSkills"
          :key="skill.key"
          class="skill-card"
        >
          <div class="skill-header">
            <span class="skill-name">{{ skill.label }}</span>
            <span class="skill-level">{{ getSkillLevel(skill.key) }} / {{ skill.maxLevel }}</span>
          </div>
          <p class="skill-desc">{{ skill.description }}</p>
          <ProgressBar
            :value="getSkillLevel(skill.key)"
            :max="skill.maxLevel"
            :color="skillColor(skill)"
          />
          <div v-if="skill.milestones" class="milestones">
            <span
              v-for="(ms, lvl) in skill.milestones"
              :key="lvl"
              class="milestone"
              :class="{ achieved: getSkillLevel(skill.key) >= Number(lvl) }"
            >
              {{ lvl }} ур.: {{ ms.description }}
            </span>
          </div>
        </RoundedPanel>
      </div>

      <RoundedPanel v-if="filteredSkills.length === 0">
        <p class="page-desc">Нет навыков в этой категории</p>
      </RoundedPanel>
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import GameLayout from '@/components/layout/GameLayout.vue'
import RoundedPanel from '@/components/ui/RoundedPanel.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import { useGameStore } from '@/stores/game.store'
import { BASIC_SKILLS, PROFESSIONAL_SKILLS, SKILLS_TABS } from '@/domain/balance/skills-constants'
import type { SkillDef } from '@/domain/balance/types'

const store = useGameStore()
const activeTab = ref('basic')

const skillTabs = SKILLS_TABS

const allSkills = computed<SkillDef[]>(() => {
  return [...BASIC_SKILLS, ...PROFESSIONAL_SKILLS] as unknown as SkillDef[]
})

const filteredSkills = computed(() => {
  return allSkills.value.filter(s => s.category === activeTab.value)
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

function skillColor(skill: SkillDef): string {
  return '#' + skill.color.toString(16).padStart(6, '0')
}
</script>

<style scoped>
.skills-page{display:flex;flex-direction:column;gap:12px}
.tabs-row{display:flex;gap:6px;overflow-x:auto}
.tab-btn{padding:8px 16px;border-radius:14px;border:2px solid transparent;background:var(--color-panel);color:var(--color-text);font-size:13px;cursor:pointer;transition:all .2s;font-family:inherit}
.tab-btn.active{border-color:var(--color-accent);background:rgba(232,180,160,.12)}
.tab-btn:hover{background:rgba(232,180,160,.08)}
.skills-list{display:flex;flex-direction:column;gap:10px}
.skill-card{transition:all .2s}
.skill-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
.skill-name{font-size:14px;font-weight:600}
.skill-level{font-size:13px;font-weight:700;color:var(--color-accent)}
.skill-desc{font-size:12px;color:var(--color-text);opacity:.7;margin:4px 0 8px}
.milestones{margin-top:8px;display:flex;flex-direction:column;gap:2px}
.milestone{font-size:11px;color:var(--color-text);opacity:.5;padding:2px 0}
.milestone.achieved{opacity:1;color:var(--color-sage);font-weight:600}
.page-desc{font-size:14px;text-align:center;opacity:.6}
</style>

