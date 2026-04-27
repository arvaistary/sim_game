<template>
  <nav class="nav-wrapper">
    <div class="nav-grid">
      <button
        @click="goHome"
        class="nav-item"
      >
        <span
          :class="{ 'nav-dot--active': isHomePage }"
          class="nav-dot"
        >
        <span class="nav-label">
          Дом
        </span>
      </span>
      </button>
      <template
        v-for="item in allNavItems"
        :key="item.id"
        >
        <!-- Доступная вкладка -->
        <button
          v-if="item.visible"
          @click="handleNavClick(item)"
          class="nav-item"
          >
          <span
            :class="{ 'nav-dot--active': item.id === activeItemId }"
            class="nav-dot"
            >
          <span class="nav-label">
            {{ item.label }}
          </span>
        </span>
        </button>
        <!-- Заблокированная вкладка -->
        <button
          v-else
          @click="handleLockedClick(item)"
          class="nav-item nav-item--locked"
          >
          <span class="nav-dot nav-dot--locked">
            🔒
          </span>
          <span class="nav-label nav-label--locked">
            {{ item.label }}
          </span>
        </button>
      </template>
    </div>
  </nav>
</template>

<script setup lang="ts">
import './GameNav.scss'

import type { NavItem } from '@domain/balance/types'
import type { NavItemClickPayload, NavItemWithState } from './GameNav.types'

import { NAV_ITEMS, ROUTE_MAP } from '@constants/navigation'

const route = useRoute()

const navItems: NavItem[] = NAV_ITEMS
const { isTabVisible, age } = useAgeRestrictions()
const toast = useToast()

const allNavItems = computed<NavItemWithState[]>(() =>
  navItems.map(item => ({
    id: item.id,
    icon: item.icon,
    label: item.label,
    visible: isTabVisible(item.id),
    unlockAge: TAB_UNLOCK_AGE[item.id] ?? null,
  }))
)

const isHomePage = computed<boolean>(() => route.path === '/game')

const activeItemId = computed<string>(() => {
  const currentPath: string = route.path
  const activeItem: NavItem | undefined = navItems.find(
    (item) => ROUTE_MAP[item.id] === currentPath)

  return activeItem?.id ?? ''
})

function goHome(): void {
  navigateTo('/game')
}

function handleNavClick(item: NavItemClickPayload): void {
  const targetRoute: string | undefined = ROUTE_MAP[item.id]

  if (targetRoute) {
    navigateTo(targetRoute)
  }
}

function handleLockedClick(item: NavItemWithState): void {
  const currentAge: number = age.value

  if (item.unlockAge !== null && item.unlockAge > currentAge) {
    toast.showInfo(`🔒 ${item.label} станет доступно в ${item.unlockAge} лет. Подрастите ещё немного!`)
  } else {
    toast.showInfo(`🔒 ${item.label} пока недоступно. Подрастите ещё немного!`)
  }
}
</script>
