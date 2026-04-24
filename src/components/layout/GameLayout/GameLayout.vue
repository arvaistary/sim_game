<template>
  <div class="game-layout">
    <header v-if="showHeader" class="game-layout__header">
      <h1 class="page-title">{{ title }}</h1>
      <div class="header-spacer" />
    </header>
    <main class="game-layout__content">
      <slot />
    </main>
    <GameNav v-if="showNav" />
  </div>
</template>

<script setup lang="ts">
import './GameLayout.scss'

withDefaults(defineProps<{
  title?: string
  showHeader?: boolean
  showNav?: boolean
}>(), {
  title: '',
  showHeader: true,
  showNav: true,
})
</script>
