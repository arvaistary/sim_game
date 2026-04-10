<template>
  <div class="action-section">
    <button class="action-button" @click="handleWorkClick">
      <span class="action-button__label">Пойти на работу</span>
      <span class="action-button__subtitle">обменять своё здоровье на деньги</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { navigateTo } from '#imports'

function handleWorkClick() {
  navigateTo('/game/career')
}
</script>

<style scoped lang="scss" src="./WorkButton.scss"></style>
