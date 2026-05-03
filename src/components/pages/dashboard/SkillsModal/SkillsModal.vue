<template>
  <Modal
    v-if="skillsWithProgress.length"
    @close="handleClose"
    title="Мои навыки"
    max-width="520px"
    >
    <div class="skills-modal__scroll">
      <ul class="skills-list">
        <li
          v-for="{ skill, level } in skillsWithProgress"
          :key="skill.key"
          class="skills-list__item"
        >
          <Tooltip
            :text="skillDetailTooltip(skill)"
            multiline
            placement="bottom"
            stretch
          >
            <span class="skills-list__row">
              <span class="skills-list__name">
                {{ skill.label }}
              </span>
              <span class="skills-list__level">
                {{ level }} ур.
              </span>
            </span>
          </Tooltip>
        </li>
      </ul>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import './SkillsModal.scss'

import { ALL_SKILLS } from '@domain/balance/constants/skills-constants'
import { buildSkillTooltipText } from '@domain/balance/utils/skill-tooltip-content'
import type { SkillDef } from '@domain/balance/types'
import type { SkillWithProgress } from './SkillsModal.types'

const emit: boolean = defineEmits<{
  close: []
}>()

const skillsStore = useSkillsStore()

function skillLevel(key: string): number {
  return skillsStore.getSkillLevel(key)
}

const skillsWithProgress = computed<SkillWithProgress[]>(() => {
  return ALL_SKILLS
    .map(skill => ({ skill, level: skillLevel(skill.key) }))
    .filter(({ level }) => level >= 1)
    .sort((a, b) => b.level - a.level || a.skill.label.localeCompare(b.skill.label, 'ru'))
})

function skillDetailTooltip(skill: SkillDef): string {
  return buildSkillTooltipText(skill)
}

function handleClose() {
  emit('close')
}
</script>
