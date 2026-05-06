<template>
  <div class="choices-list">
    <GameButton
      v-for="choice in choices"
      :key="choice.id"
      :label="choice.text"
      @click="$emit('select', choice)"
      color="var(--color-accent)"
      text-color="#fff"
      class="choice-btn"
      />
  </div>
</template>

<script setup lang="ts">
import './EventChoices.scss'

import type { ChoiceItem } from './EventChoices.types'
/**
 * @prop {ChoiceItem[]} choices - Список вариантов выбора для события
 */
defineProps<{
  choices: ChoiceItem[]
}>()

defineEmits<{
  select: [choice: ChoiceItem]
}>()
</script>

