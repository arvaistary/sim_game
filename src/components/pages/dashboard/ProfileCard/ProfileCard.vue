<template>
  <RoundedPanel class="card profile-card" padding="18px">
    <h1 class="profile-name">{{ playerName }}</h1>
    <p class="profile-job">{{ jobLabel }}</p>
    <p v-if="isMoneyVisible" class="profile-money">{{ formatMoney(money) }} ₽</p>
    <p class="profile-time">{{ timeLabel }}</p>
    <p class="profile-comfort">Комфорт: {{ Math.round(comfort) }}</p>
    <div class="profile-buttons">
      <GameButton v-if="isCareerVisible" label="Карьера" small @click="navigateTo('/game/career')" />
      <GameButton label="Мои навыки" small @click="isSkillsModalOpen = true" />
    </div>
  </RoundedPanel>

  <Modal
    :is-open="isSkillsModalOpen"
    title="Мои навыки"
    max-width="520px"
    @close="isSkillsModalOpen = false"
  >
    <div class="profile-card__skills-scroll">
      <ul v-if="skillsWithProgress.length" class="profile-skills-list">
        <li
          v-for="{ skill, level } in skillsWithProgress"
          :key="skill.key"
          class="profile-skills-list__item"
        >
          <Tooltip
            :text="skillDetailTooltip(skill)"
            multiline
            placement="bottom"
            stretch
          >
            <span class="profile-skills-list__row">
              <span class="profile-skills-list__name">{{ skill.label }}</span>
              <span class="profile-skills-list__level">{{ level }} ур.</span>
            </span>
          </Tooltip>
        </li>
      </ul>
      <p v-else class="profile-skills-list__empty">
        Нет навыков с уровнем выше 1
      </p>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { navigateTo } from '#imports'
import { useGameStore } from '@/stores/game.store'
import RoundedPanel from '@/components/ui/RoundedPanel/index.vue'
import GameButton from '@/components/ui/GameButton/index.vue'
import Modal from '@/components/ui/Modal/index.vue'
import Tooltip from '@/components/ui/Tooltip/index.vue'
import { ALL_SKILLS } from '@/domain/balance/constants/skills-constants'
import { buildSkillTooltipText } from '@/domain/balance/utils/skill-tooltip-content'
import type { SkillDef } from '@/domain/balance/types'
import { formatMoney } from '@/utils/format'
import { useAgeRestrictions } from '@/composables/useAgeRestrictions'

const store = useGameStore()
const { isStatVisible, isTabVisible } = useAgeRestrictions()
const isMoneyVisible = computed(() => isStatVisible('money'))
const isCareerVisible = computed(() => isTabVisible('career'))
const isSkillsModalOpen = ref(false)

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

const playerName = computed(() => store.playerName)
const money = computed(() => store.money)
const comfort = computed(() => store.comfort)

const jobLabel = computed(() => {
  const job = store.currentJobSnapshot
  if (!job || !job.id) return 'Безработный'

  const baseLabel = job.name
  const required = job.requiredHoursPerWeek
  const worked = job.workedHoursCurrentWeek
  if (required <= 0) return baseLabel

  const remaining = Math.max(0, required - worked)
  const status = remaining > 0
    ? `ещё ${remaining} ч до нормы`
    : 'норма закрыта'

  return `${baseLabel} • ${worked}/${required} ч (${status})`
})

const timeLabel = computed(() => {
  const t = store.time as unknown as Record<string, unknown> | null
  if (!t) return 'День 0 • Неделя 1 (168 ч. осталось) • 18 лет'
  const gameDays = (t.gameDays as number) ?? 0
  const gameWeeks = (t.gameWeeks as number) ?? 1
  const weekHoursRemaining = (t.weekHoursRemaining as number) ?? 168
  const currentAge = (t.currentAge as number) ?? 18
  return `День ${gameDays} • Неделя ${gameWeeks} (${weekHoursRemaining} ч. осталось) • ${currentAge} лет`
})
</script>

<style scoped lang="scss" src="./ProfileCard.scss"></style>

<style scoped lang="scss">
.profile-card__skills-scroll {
  max-height: min(70vh, 560px);
  overflow-y: auto;
  padding-bottom: $space-2;
}

.profile-skills-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.profile-skills-list__item {
  margin: 0;
}

.profile-skills-list__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  width: 100%;
  padding: $space-2 $space-3;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  cursor: default;
  font-size: $font-size-sm;
  color: var(--color-text-primary);
}

.profile-skills-list__name {
  font-weight: $font-weight-medium;
}

.profile-skills-list__level {
  flex-shrink: 0;
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}

.profile-skills-list__empty {
  margin: 0;
  font-size: $font-size-sm;
  color: var(--color-text-secondary);
  text-align: center;
  padding: $space-4 0;
}
</style>
