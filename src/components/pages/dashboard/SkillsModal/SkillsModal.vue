<template>
  <Modal
    title="Мои навыки"
    max-width="520px"
    @close="handleClose"
  >
    <div class="skills-modal__scroll">
      <ul v-if="skillsWithProgress.length" class="skills-list">
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
              <span class="skills-list__name">{{ skill.label }}</span>
              <span class="skills-list__level">{{ level }} ур.</span>
            </span>
          </Tooltip>
        </li>
      </ul>
      <p v-else class="skills-list__empty">
        Нет навыков с уровнем выше 1
      </p>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game.store'
import { ALL_SKILLS } from '@/domain/balance/constants/skills-constants'
import { buildSkillTooltipText } from '@/domain/balance/utils/skill-tooltip-content'
import type { SkillDef } from '@/domain/balance/types'

interface Props {
  onClose?: () => void
}

const props = defineProps<Props>()

const store = useGameStore()

function skillLevel(key: string): number {
  const skills = store.skills as Record<string, unknown> | null
  if (!skills) return 0
  const entry = skills[key]
  if (typeof entry === 'number') return entry
  if (entry && typeof entry === 'object' && 'level' in (entry as Record<string, unknown>)) {
    return (entry as { level: number }).level
  }
  return 0
}

const skillsWithProgress = computed(() => {
  return ALL_SKILLS
    .map(skill => ({ skill, level: skillLevel(skill.key) }))
    .filter(({ level }) => level >= 1)
    .sort((a, b) => b.level - a.level || a.skill.label.localeCompare(b.skill.label, 'ru'))
})

function skillDetailTooltip(skill: SkillDef): string {
  return buildSkillTooltipText(skill)
}

function handleClose() {
  props.onClose?.()
}
</script>

<style scoped lang="scss">
.skills-modal__scroll {
  max-height: 400px;
  overflow-y: auto;
}

.skills-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.skills-list__item {
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
  }
}

.skills-list__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.skills-list__name {
  font-size: 14px;
  color: var(--color-text-primary);
}

.skills-list__level {
  font-size: 13px;
  color: var(--color-accent);
  font-weight: 600;
}

.skills-list__empty {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
  margin: 20px 0;
}
</style>
