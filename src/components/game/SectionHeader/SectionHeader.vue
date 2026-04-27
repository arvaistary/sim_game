<template>
  <RoundedPanel>
    <h3 class="section-header__title">
      {{ title }}
    </h3>
    <p
      v-if="subtitle"
      class="section-header__subtitle"
      >
      {{ subtitle }}
    </p>
  </RoundedPanel>
</template>

<script setup lang="ts">
import './SectionHeader.scss'

/**
 * @prop {string} title - Заголовок секции
 * @prop {string} [subtitle] - Подзаголовок секции (необязательный)
 */
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

