<template>
  <div class="game-layout">
    <header v-if="showHeader" class="game-layout__header">
      <button class="back-btn" @click="goBack">Назад</button>
      <h2 class="page-title">{{ title }}</h2>
      <div class="header-spacer" />
    </header>
    <main class="game-layout__content">
      <slot />
    </main>
    <div v-if="showNav" class="game-layout__nav game-layout__nav--desktop">
      <GameNav />
    </div>
    <div v-if="showNav" class="game-layout__nav game-layout__nav--mobile">
      <BottomNav />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from '#imports'
import GameNav from '@/components/pages/dashboard/GameNav/GameNav.vue'
import BottomNav from '@/components/global/BottomNav/BottomNav.vue'
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

function goBack() {
  const router = useRouter()
  router.back()
}
</script>
