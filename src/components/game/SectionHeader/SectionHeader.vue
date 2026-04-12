<template>
  <RoundedPanel>
    <h3 class="section-header__title">{{ title }}</h3>
    <p v-if="subtitle" class="section-header__subtitle">{{ subtitle }}</p>
  </RoundedPanel>
</template>

<script setup lang="ts">
import RoundedPanel from '@/components/ui/RoundedPanel/index.vue'

defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<style scoped lang="scss" src="./SectionHeader.scss"></style>
