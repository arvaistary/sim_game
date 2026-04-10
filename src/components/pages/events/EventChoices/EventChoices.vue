<template>
  <div class="choices-list">
    <GameButton
      v-for="choice in choices"
      :key="choice.id"
      :label="choice.text"
      color="var(--color-accent)"
      text-color="#fff"
      class="choice-btn"
      @click="$emit('select', choice)"
    />
  </div>
</template>

<script setup lang="ts">
import GameButton from '@/components/ui/GameButton.vue'

defineProps<{
  choices: Array<{ id: string; text: string }>
}>()

defineEmits<{
  select: [choice: { id: string; text: string }]
}>()
</script>

<style scoped lang="scss" src="./EventChoices.scss"></style>
