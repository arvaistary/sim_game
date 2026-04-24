<template>
  <Tooltip :follow-cursor="true" :multiline="true">
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
    </RoundedPanel>

    <template #content>
      <div class="skill-tooltip">
        <div class="tooltip-header">
          <span class="tooltip-title">{{ skill.label }}</span>
          <span class="tooltip-level">Уровень {{ level }} / {{ skill.maxLevel }}</span>
        </div>

        <div v-if="currentEffects.length > 0" class="tooltip-section">
          <div class="tooltip-section-title">Текущие эффекты (ур. {{ level }}):</div>
          <div
            v-for="effect in currentEffects"
            :key="'cur-' + effect.effectKey"
            class="tooltip-effect"
            :class="{ 'effect-positive': isPositiveEffect(effect.value, effect.modifierKey) }"
          >
            {{ effect.description }}
          </div>
        </div>

        <div v-if="maxEffects.length > 0 && level < skill.maxLevel" class="tooltip-section">
          <div class="tooltip-section-title">На максимальном уровне (ур. {{ skill.maxLevel }}):</div>
          <div
            v-for="effect in maxEffects"
            :key="'max-' + effect.effectKey"
            class="tooltip-effect"
            :class="{ 'effect-positive': isPositiveEffect(effect.value, effect.modifierKey) }"
          >
            {{ effect.description }}
          </div>
        </div>

        <div v-if="currentEffects.length === 0" class="tooltip-section">
          <div class="tooltip-effect effect-neutral">Нет активных эффектов</div>
        </div>
      </div>
    </template>
  </Tooltip>
</template>

<script setup lang="ts">

import './SkillCard.scss'

import type { SkillDef } from '@/domain/balance/types'

import type { SkillModifiers } from '@/domain/balance/types'
import { getSkillEffectsForUi } from '@/domain/balance/constants/skill-effects-generator'

const props = defineProps<{
  skill: SkillDef
  level: number
}>()

const currentEffects = computed(() => {
  return getSkillEffectsForUi(props.skill.key, props.level)
})

const maxEffects = computed(() => {
  return getSkillEffectsForUi(props.skill.key, props.skill.maxLevel)
})

function skillColor(skill: SkillDef): string {
  return '#' + skill.color.toString(16).padStart(6, '0')
}

function isPositiveEffect(value: number, modifierKey: string): boolean {
  const multiplicativeModifiers: (keyof SkillModifiers)[] = [
    'hungerDrainMultiplier', 'energyDrainMultiplier', 'stressGainMultiplier',
    'healthDecayMultiplier', 'shopPriceMultiplier', 'dailyExpenseMultiplier',
    'agingSpeedMultiplier'
  ]
  
  if (multiplicativeModifiers.includes(modifierKey as keyof SkillModifiers)) {
    return value < 1
  }
  
  return value > 0
}
</script>

