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
    
    <!-- Эффекты навыка -->
    <div v-if="skillEffects.length > 0" class="skill-effects">
      <div class="effects-title">Эффекты:</div>
      <div class="effects-list">
        <div
          v-for="effect in skillEffects"
          :key="effect.effectKey"
          class="effect-item"
          :class="{ 'effect-positive': isPositiveEffect(effect.value, effect.modifierKey) }"
        >
          <span class="effect-description">{{ effect.description }}</span>
        </div>
      </div>
    </div>
    
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
import { computed } from 'vue'
import type { SkillDef } from '@/domain/balance/types'
import RoundedPanel from '@/components/ui/RoundedPanel/index.vue'
import ProgressBar from '@/components/ui/ProgressBar/index.vue'
import { getSkillEffectsForUi } from '@/domain/balance/constants/skill-effects-generator'

const props = defineProps<{
  skill: SkillDef
  level: number
}>()

const skillEffects = computed(() => {
  return getSkillEffectsForUi(props.skill.key, props.level)
})

function skillColor(skill: SkillDef): string {
  return '#' + skill.color.toString(16).padStart(6, '0')
}

function isPositiveEffect(value: number, modifierKey: string): boolean {
  // Мультипликативные модификаторы: значение > 1 = положительный эффект
  // Аддитивные модификаторы: значение > 0 = положительный эффект
  const multiplicativeModifiers = [
    'hungerDrainMultiplier', 'energyDrainMultiplier', 'stressGainMultiplier',
    'healthDecayMultiplier', 'shopPriceMultiplier', 'dailyExpenseMultiplier',
    'agingSpeedMultiplier'
  ]
  
  if (multiplicativeModifiers.includes(modifierKey)) {
    return value < 1 // Для этих модификаторов меньшее значение = лучше
  }
  
  return value > 0
}
</script>

<style scoped lang="scss" src="./SkillCard.scss"></style>
