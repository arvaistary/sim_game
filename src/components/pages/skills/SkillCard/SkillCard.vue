<template>
  <RoundedPanel class="skill-card">
    <div class="skill-header">
      <span class="skill-name">{{ skill.label }}</span>
      <span class="skill-level">{{ level }} / {{ skill.maxLevel }}</span>
    </div>
    <p class="skill-desc">{{ skill.description }}</p>
    <ProgressBar
      :value="level"
      :max="skill.maxLevel"
      :color="skillColor(skill)"
    />
    <div v-if="skill.milestones" class="milestones">
      <span
        v-for="(ms, lvl) in skill.milestones"
        :key="lvl"
        class="milestone"
        :class="{ achieved: level >= Number(lvl) }"
      >
        {{ lvl }} ур.: {{ ms.description }}
      </span>
    </div>
  </RoundedPanel>
</template>

<script setup lang="ts">
import type { SkillDef } from '@/domain/balance/types'
import RoundedPanel from '@/components/ui/RoundedPanel/index.vue'
import ProgressBar from '@/components/ui/ProgressBar/index.vue'

defineProps<{
  skill: SkillDef
  level: number
}>()

function skillColor(skill: SkillDef): string {
  return '#' + skill.color.toString(16).padStart(6, '0')
}
</script>

<style scoped lang="scss" src="./SkillCard.scss"></style>
