<template>
  <nav class="nav-wrapper">
    <RoundedPanel padding="8px" :radius="18">
      <div class="nav-grid">
        <button
          v-for="item in navItems"
          :key="item.id"
          class="nav-item"
          @click="handleNavClick(item)"
        >
          <span
            class="nav-dot"
            :class="{ 'nav-dot--active': item.id === activeItemId }"
          >{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </button>
      </div>
    </RoundedPanel>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { navigateTo, useRoute } from '#imports'
import RoundedPanel from '@/components/ui/RoundedPanel.vue'
import { NAV_ITEMS, ROUTE_MAP } from '@/constants/navigation'

const route = useRoute()
const navItems = NAV_ITEMS
const activeItemId = computed(() => {
  const currentPath = route.path
  const activeItem = navItems.find((item) => ROUTE_MAP[item.id] === currentPath)
  return activeItem?.id ?? 'home'
})

function handleNavClick(item: { id: string }) {
  const route = ROUTE_MAP[item.id]
  if (route) {
    navigateTo(route)
  }
}
</script>

<style scoped lang="scss" src="./GameNav.scss"></style>
