<template>
  <RoundedPanel v-if="!plain">
    <h3 class="section-header__title">{{ title }}</h3>
    <p v-if="subtitle" class="section-header__subtitle">{{ subtitle }}</p>
  </RoundedPanel>
  <div v-else class="section-header section-header--plain">
    <h3 class="section-header__title">{{ title }}</h3>
    <p v-if="subtitle" class="section-header__subtitle">{{ subtitle }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  plain?: boolean
}>()
</script>

<style scoped lang="scss" src="./SectionHeader.scss"></style>
