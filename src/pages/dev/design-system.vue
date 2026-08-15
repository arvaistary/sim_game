<template>
  <main class="design-system-page">
    <header class="design-system-page__header">
      <div>
        <p class="design-system-page__eyebrow">Internal fixture</p>
        <h1>Accent + Glass</h1>
        <p>Проверка поверхностей в текущей теме и accent-палитре.</p>
      </div>
      <div class="design-system-page__controls">
        <div class="design-system-page__control-group" aria-label="Тема">
          <button
            v-for="option in themeOptions"
            :key="option.value"
            class="surface-glass-inset design-system-page__control"
            :class="{ 'design-system-page__control--active': settings.theme === option.value }"
            :aria-pressed="settings.theme === option.value"
            type="button"
            @click="settings.setTheme(option.value)"
          >{{ option.label }}</button>
        </div>
        <div class="design-system-page__control-group" aria-label="Палитра">
          <button
            v-for="option in paletteOptions"
            :key="option.value"
            class="surface-glass-inset design-system-page__control"
            :class="{ 'design-system-page__control--active': settings.palette === option.value }"
            :aria-pressed="settings.palette === option.value"
            type="button"
            @click="settings.setPalette(option.value)"
          >
            <span class="design-system-page__swatch" :style="{ '--swatch': option.swatch }" />
            {{ option.label }}
          </button>
        </div>
      </div>
    </header>

    <section class="design-system-page__surface-grid" aria-label="Материалы поверхностей">
      <article
        v-for="surface in surfaces"
        :key="surface.id"
        class="design-system-page__surface"
        :class="surface.className"
      >
        <span class="design-system-page__surface-label">{{ surface.label }}</span>
        <h2>{{ surface.title }}</h2>
        <p>{{ surface.description }}</p>
        <button class="game-button game-button--primary" type="button">Primary action</button>
      </article>
    </section>

    <section class="design-system-page__inset surface-glass-panel">
      <h2>Hierarchy sample</h2>
      <div class="design-system-page__inset-row">
        <div class="surface-glass-inset design-system-page__sample-row">Nested choice</div>
        <div class="surface-glass-inset design-system-page__sample-row">Selected state</div>
        <div class="design-system-page__sample-row design-system-page__sample-row--solid">Solid control</div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import './design-system.scss'

definePageMeta({ layout: false })

if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' })
}

const settings = useSettingsStore()

const initialTheme = settings.theme
const initialPalette = settings.palette

const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const

const paletteOptions = [
  { value: 'emerald', label: 'Emerald', swatch: '#0fab97' },
  { value: 'cobalt', label: 'Cobalt', swatch: '#2B5AED' },
  { value: 'violet', label: 'Violet', swatch: '#7C3AED' },
  { value: 'sunset', label: 'Sunset', swatch: '#EA580C' },
] as const

const surfaces = [
  { id: 'chrome', className: 'surface-glass-chrome', label: 'Chrome', title: 'Glass chrome', description: 'Навигация и persistent shell.' },
  { id: 'panel', className: 'surface-glass-panel', label: 'Panel', title: 'Glass panel', description: 'Карточки, секции и модальные окна.' },
  { id: 'inset', className: 'surface-glass-inset', label: 'Inset', title: 'Glass inset', description: 'Вложенные строки, фильтры и выбор.' },
  { id: 'solid', className: 'design-system-page__solid', label: 'Solid', title: 'Solid control', description: 'Primary и destructive controls.' },
] as const

onUnmounted(() => {
  settings.setTheme(initialTheme)
  settings.setPalette(initialPalette)
})
</script>
