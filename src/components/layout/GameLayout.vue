<template>
  <div class="game-layout">
    <header v-if="showHeader" class="game-layout__header">
      <button class="back-btn" @click="goBack">в†ђ</button>
      <h2 class="page-title">{{ title }}</h2>
      <div class="header-spacer" />
    </header>
    <main class="game-layout__content">
      <slot />
    </main>
    <BottomNav v-if="showNav" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from '#imports'
import BottomNav from './BottomNav.vue'

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

<style scoped>
.game-layout {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  max-width: 480px;
  margin: 0 auto;
  overflow: hidden;
}

.game-layout__header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
  flex-shrink: 0;
}

.back-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--color-text);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-small);
}

.back-btn:hover {
  background: var(--color-neutral);
}

.page-title {
  flex: 1;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  text-align: center;
}

.header-spacer {
  width: 36px;
}

.game-layout__content {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 80px;
}
</style>

