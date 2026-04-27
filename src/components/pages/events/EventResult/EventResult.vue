<template>
  <RoundedPanel class="result-panel">
    <h3 class="result-title">
      Результат выбора
    </h3>
    <p class="result-text">
      {{ resultText }}
    </p>
    <div class="result-actions">
      <GameButton
        v-if="hasNextEvent"
        @click="$emit('next')"
        label="Следующее событие"
        color="var(--color-accent)"
        text-color="#fff"
        />
      <GameButton
        @click="$emit('back')"
        label="Назад"
        color="var(--color-neutral)"
        />
    </div>
  </RoundedPanel>
</template>

<script setup lang="ts">
import './EventResult.scss'

/**
 * @prop {string} resultText - Текст результата выбранного события
 * @prop {boolean} hasNextEvent - Флаг наличия следующего события в очереди
 */
defineProps<{
  resultText: string
  hasNextEvent: boolean
}>()

defineEmits<{
  next: []
  back: []
}>()
</script>

