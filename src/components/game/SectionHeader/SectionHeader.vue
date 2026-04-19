<template>
  <RoundedPanel>
    <h3 class="section-header__title">{{ title }}</h3>
    <p v-if="subtitle" class="section-header__subtitle">{{ subtitle }}</p>
  </RoundedPanel>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<style scoped lang="scss" src="./SectionHeader.scss"></style>
