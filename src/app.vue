<template>
  <NuxtPage />

  <Modal
    :is-open="isMenuOpen"
    @close="handleCloseMenu"
    title="Меню"
    max-width="440px"
    >
    <div class="escape-menu">
      <button
        v-for="menuItem in MENU_ITEMS"
        :key="menuItem.id"
        :class="{ 'escape-menu__item--disabled': menuItem.disabled }"
        :disabled="menuItem.disabled"
        @click="handleMenuAction(menuItem.id)"
        class="escape-menu__item"
        >
        <span class="escape-menu__item-title">
          {{ menuItem.title }}
        </span>
        <span class="escape-menu__item-description">
          {{ menuItem.description }}
        </span>
      </button>

      <section class="escape-menu__theme">
        <div class="escape-menu__theme-copy">
          <h4 class="escape-menu__theme-title">
            Тема
          </h4>
          <p class="escape-menu__theme-description">
            {{ themeDescription }}
          </p>
        </div>

        <button
          :class="{ 'theme-toggle--active': isDarkMode }"
          :aria-checked="isDarkMode"
          :aria-label="themeToggleLabel"
          @click="handleToggleTheme"
          class="theme-toggle"
          type="button"
          role="switch"
          >
          <span class="theme-toggle__track">
            <span class="theme-toggle__thumb" />
          </span>
          <span class="theme-toggle__label">
            {{ themeLabel }}
          </span>
        </button>
      </section>
    </div>
  </Modal>

  <GameModalHost />
  <ModalStackHost />
</template>

<script setup lang="ts">
import './App.scss'

import type { AppMenuActionId } from '@shared/types'

import { MENU_ITEMS } from './app.constants'

const route = useRoute()
const colorMode = useColorMode()
const { $autoSave } = useNuxtApp()

const playerStore = usePlayerStore()

const isMenuOpen = ref<boolean>(false)

const isDarkMode = computed<boolean>(() => colorMode.preference === 'dark')
const themeLabel = computed<string>(() => isDarkMode.value ? 'Тёмная' : 'Светлая')
const themeDescription = computed<string>(() => {
  return isDarkMode.value
    ? 'Сейчас включена тёмная тема'
    : 'Сейчас включена светлая тема'
})
const themeToggleLabel = computed<string>(() => {
  return isDarkMode.value
    ? 'Переключить на светлую тему'
    : 'Переключить на тёмную тему'
})

function handleCloseMenu(): void {
  isMenuOpen.value = false
}

function handleOpenMenu(): void {
  isMenuOpen.value = true
}

function handleToggleTheme(): void {
  colorMode.preference = isDarkMode.value ? 'light' : 'dark'
}

function handleMenuAction(actionId: AppMenuActionId): void {
  if (actionId === 'newGame') {
    $autoSave.clear()
    playerStore.reset()
    handleCloseMenu()
    navigateTo('/')
  }
}

function handleGlobalKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return

  event.preventDefault()

  if (isMenuOpen.value) {
    handleCloseMenu()

    return
  }

  handleOpenMenu()
}

watch(() => route.fullPath, () => {
  handleCloseMenu()
})

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>
