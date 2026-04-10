<template>
  <RoundedPanel class="result-panel">
    <h3 class="result-title">Результат выбора</h3>
    <p class="result-text">{{ resultText }}</p>
    <div class="result-actions">
      <GameButton
        v-if="hasNextEvent"
        label="Следующее событие"
        color="var(--color-accent)"
        text-color="#fff"
        @click="$emit('next')"
      />
      <GameButton
        label="Назад"
        color="var(--color-neutral)"
        @click="$emit('back')"
      />
    </div>
  </RoundedPanel>
</template>

<script setup lang="ts">
import RoundedPanel from '@/components/ui/RoundedPanel.vue'
import GameButton from '@/components/ui/GameButton.vue'

defineProps<{
  resultText: string
  hasNextEvent: boolean
}>()

defineEmits<{
  next: []
  back: []
}>()
</script>

<style scoped lang="scss" src="./EventResult.scss"></style>
