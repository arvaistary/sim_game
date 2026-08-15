<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="settings-drawer__overlay"
        @click.self="close"
      />
    </Transition>
    <Transition name="slide-left">
      <aside
        v-if="isOpen"
        class="settings-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Настройки"
      >
        <header class="settings-drawer__header">
          <h2 class="settings-drawer__title">Настройки</h2>
          <button
            class="settings-drawer__close"
            type="button"
            aria-label="Закрыть настройки"
            @click="close"
          >×</button>
        </header>

        <div class="settings-drawer__body">
          <!-- Внешний вид: тема -->
          <section class="settings-section">
            <h3 class="settings-section__title">Внешний вид</h3>
            <div class="settings-section__row">
              <div class="settings-section__copy">
                <p class="settings-section__label">Тема</p>
                <p class="settings-section__hint">Светлая или тёмная</p>
              </div>
              <div class="segmented">
                <button
                  class="segmented__btn"
                  :class="{ 'segmented__btn--active': !isDark }"
                  type="button"
                  @click="settings.setTheme('light')"
                >Светлая</button>
                <button
                  class="segmented__btn"
                  :class="{ 'segmented__btn--active': isDark }"
                  type="button"
                  @click="settings.setTheme('dark')"
                >Тёмная</button>
              </div>
            </div>

            <div class="settings-section__row settings-section__row--palette">
              <div class="settings-section__copy">
                <p class="settings-section__label">Палитра</p>
                <p class="settings-section__hint">Только акцентный цвет</p>
              </div>
              <div class="palette-swatches" role="listbox" aria-label="Палитра">
                <button
                  v-for="option in paletteOptions"
                  :key="option.id"
                  class="palette-swatch"
                  :class="{ 'palette-swatch--active': palette === option.id }"
                  type="button"
                  role="option"
                  :aria-selected="palette === option.id"
                  :title="option.label"
                  :style="{ '--swatch': option.swatch }"
                  @click="settings.setPalette(option.id)"
                />
              </div>
            </div>
          </section>

          <!-- Плотность -->
          <section class="settings-section">
            <h3 class="settings-section__title">Плотность</h3>
            <div class="settings-section__row">
              <div class="settings-section__copy">
                <p class="settings-section__label">Компоновка</p>
                <p class="settings-section__hint">Управляет padding карточек и radius</p>
              </div>
              <div class="segmented">
                <button
                  class="segmented__btn"
                  :class="{ 'segmented__btn--active': !isCompact }"
                  type="button"
                  @click="settings.setDensity('comfortable')"
                >Комфорт</button>
                <button
                  class="segmented__btn"
                  :class="{ 'segmented__btn--active': isCompact }"
                  type="button"
                  @click="settings.setDensity('compact')"
                >Компакт</button>
              </div>
            </div>
          </section>

          <!-- Sidebar -->
          <section class="settings-section">
            <h3 class="settings-section__title">Боковая панель</h3>
            <div class="settings-section__row">
              <div class="settings-section__copy">
                <p class="settings-section__label">Сворачивать sidebar</p>
                <p class="settings-section__hint">Только на desktop</p>
              </div>
              <button
                class="switch"
                :class="{ 'switch--on': settings.sidebarCollapsed }"
                type="button"
                role="switch"
                :aria-checked="settings.sidebarCollapsed"
                @click="settings.toggleSidebar()"
              >
                <span class="switch__thumb" />
              </button>
            </div>
          </section>

          <section class="settings-section">
            <h3 class="settings-section__title">Игра</h3>
            <div class="settings-section__row settings-section__row--start-new-game">
              <div class="settings-section__copy">
                <p class="settings-section__label">Начать новую игру</p>
                <p class="settings-section__hint">Текущий прогресс будет удалён</p>
              </div>
              <button
                class="settings-section__danger-button"
                type="button"
                @click="handleStartNewGame"
              >Начать</button>
            </div>
          </section>

          <!-- О программе -->
          <section class="settings-section">
            <h3 class="settings-section__title">О программе</h3>
            <p class="settings-section__hint">Game Life v2 — Linear-эстетика</p>
            <button
              class="settings-section__link"
              type="button"
              @click="handleReplayOnboarding"
            >Повторить онбординг</button>
          </section>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import './SettingsDrawer.scss'
import { useNewGame } from '@/composables/useNewGame'
import type { PaletteId } from '@/stores/settings-store'

import type { PaletteOption } from './SettingsDrawer.types'

const settings = useSettingsStore()
const { state, close } = useSettingsDrawer()
const { startNewGame } = useNewGame()
const gameModal = useGameModal()
const route = useRoute()

const isOpen = computed<boolean>(() => state.value.isOpen)
const isDark = computed<boolean>(() => settings.isDark)
const isCompact = computed<boolean>(() => settings.isCompact)
const palette = computed<PaletteId>(() => settings.palette)

const paletteOptions: PaletteOption[] = [
  { id: 'cobalt', label: 'Cobalt', swatch: '#2B5AED' },
  { id: 'emerald', label: 'Emerald', swatch: '#0fab97' },
  { id: 'sunset', label: 'Sunset', swatch: '#EA580C' },
  { id: 'violet', label: 'Violet', swatch: '#7C3AED' },
]

function handleKeydown(event: KeyboardEvent): void {
  if (!isOpen.value) return
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
  }
}

watch(() => route.fullPath, () => {
  if (isOpen.value) close()
})

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function handleReplayOnboarding(): void {
  settings.resetOnboarding()
  close()
  navigateTo('/game')
}

function handleStartNewGame(): void {
  gameModal.show({
    title: 'Начать новую игру?',
    message: 'Текущий прогресс, книги и обучение будут удалены без возможности восстановления.',
    buttons: [
      { label: 'Отмена' },
      {
        label: 'Начать заново',
        accent: true,
        action: () => {
          close()
          return startNewGame()
        },
      },
    ],
  })
}
</script>
