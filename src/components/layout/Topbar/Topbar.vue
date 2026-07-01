<template>
  <div class="topbar">
    <!-- Left: page title / slot -->
    <div class="topbar__left">
      <slot name="title">
        <h1 v-if="title" class="topbar__title">{{ title }}</h1>
      </slot>
    </div>

    <!-- Right: actions -->
    <div class="topbar__right">
      <!-- Profile chip (hidden on small screens) -->
      <div v-if="playerName" class="topbar__profile">
        <span class="topbar__avatar">{{ initials }}</span>
        <span class="topbar__profile-name">{{ playerName }}</span>
      </div>

      <!-- Theme toggle -->
      <button
        class="topbar__btn"
        type="button"
        role="switch"
        :aria-checked="isDarkMode"
        :aria-label="themeToggleLabel"
        :title="themeToggleLabel"
        @click="handleToggleTheme"
      >
        <span class="topbar__btn-icon">{{ isDarkMode ? '☀' : '☾' }}</span>
      </button>

      <!-- Command palette trigger -->
      <button
        class="topbar__btn topbar__btn--cmd"
        type="button"
        title="Открыть командную палитру (Ctrl+K)"
        @click="handleOpenPalette"
      >
        <span class="topbar__btn-icon">⌕</span>
        <span class="topbar__cmd-hint">Ctrl K</span>
      </button>

      <!-- Settings -->
      <button
        class="topbar__btn"
        type="button"
        title="Настройки"
        aria-label="Открыть настройки"
        @click="handleOpenSettings"
      >
        <span class="topbar__btn-icon">⚙</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import './Topbar.scss'

interface TopbarProps {
  title?: string
}

const props = withDefaults(defineProps<TopbarProps>(), {
  title: '',
})

const colorMode = useColorMode()
const playerStore = usePlayerStore()
const settingsDrawer = useSettingsDrawer()
const commandPalette = useCommandPalette()

const playerName = computed<string>(() => playerStore.name)
const initials = computed<string>(() => {
  const name: string = playerName.value.trim()
  if (!name) return ''
  return name.charAt(0).toUpperCase()
})

const isDarkMode = computed<boolean>(() => colorMode.preference === 'dark')
const themeToggleLabel = computed<string>(() => {
  return isDarkMode.value
    ? 'Переключить на светлую тему'
    : 'Переключить на тёмную тему'
})

function handleToggleTheme(): void {
  colorMode.preference = isDarkMode.value ? 'light' : 'dark'
}

function handleOpenSettings(): void {
  settingsDrawer.open()
}

function handleOpenPalette(): void {
  commandPalette.open()
}

// Avoid unused prop warning when title is not provided
void props
</script>
