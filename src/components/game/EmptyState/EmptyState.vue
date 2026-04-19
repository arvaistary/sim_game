<template>
  <RoundedPanel class="empty-state">
    <p class="empty-state__text">{{ text }}</p>
  </RoundedPanel>
</template>

<script setup lang="ts">
defineProps<{
  text: string
}>()
</script>

<style scoped lang="scss" src="./EmptyState.scss"></style>
