<template>
  <NuxtPage />

  <Modal
    :is-open="isMenuOpen"
    title="Меню"
    max-width="440px"
    @close="handleCloseMenu"
  >
    <div class="escape-menu">
      <button
        v-for="menuItem in menuItems"
        :key="menuItem.id"
        class="escape-menu__item"
        :class="{ 'escape-menu__item--disabled': menuItem.disabled }"
        :disabled="menuItem.disabled"
        @click="handleMenuAction(menuItem.id)"
      >
        <span class="escape-menu__item-title">{{ menuItem.title }}</span>
        <span class="escape-menu__item-description">{{ menuItem.description }}</span>
      </button>
    </div>
  </Modal>

  <GameModalHost />
  <ModalStackHost />
  <ToastHost />
  <CommandPalette />
  <SettingsDrawer />
  <OnboardingTour />
</template>

<script setup lang="ts">
import './App.scss'
import type { AppMenuActionId, AppMenuActionItem } from '#shared/types'

const route = useRoute()
const { $autoSave } = useNuxtApp()
const playerStore = usePlayerStore()

const isMenuOpen = ref<boolean>(false)

const menuItems: AppMenuActionItem[] = [
  {
    id: 'save',
    title: 'Сохранить',
    description: 'Скоро появится',
    disabled: true,
  },
  {
    id: 'load',
    title: 'Загрузить',
    description: 'Скоро появится',
    disabled: true,
  },
  {
    id: 'newGame',
    title: 'Новая игра',
    description: 'Сбросить текущее прохождение и вернуться на старт',
    disabled: false,
  },
]

function handleCloseMenu(): void {
  isMenuOpen.value = false
}

function handleOpenMenu(): void {
  isMenuOpen.value = true
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
