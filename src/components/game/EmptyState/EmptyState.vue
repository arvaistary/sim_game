<template>
  <RoundedPanel class="empty-state">
    <p class="empty-state__text">{{ text }}</p>
  </RoundedPanel>
</template>

<script setup lang="ts">
import './EmptyState.scss'

/**
 * @prop {string} text - Текст сообщения для пустого состояния
 */
defineProps<{
  text: string
}>()
</script>

