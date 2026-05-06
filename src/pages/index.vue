<template>
  <div class="start-page">
    <div class="start-page__content">
      <h1 class="start-page__title">
        Game Life
      </h1>
      <p class="start-page__subtitle">
        Cozy Life Simulator
      </p>

      <div class="start-page__form">
        <label
          class="start-page__label"
          for="player-name"
          >
          Как вас зовут?
        </label>
        <input
          v-model="playerName"
          @keyup.enter="startGame"
          id="player-name"
          class="start-page__input"
          type="text"
          autocomplete="name"
          placeholder="Введите имя…"
          />

        <fieldset class="start-page__fieldset">
          <legend class="start-page__legend">
            Старт жизни
          </legend>

          <div class="start-page__radio-row">
            <input
              v-model="startMode"
              id="start-infancy"
              class="start-page__radio"
              type="radio"
              name="start-mode"
              value="infancy"
              />
            <label
              class="start-page__radio-label"
              for="start-infancy"
              >
              <span class="start-page__radio-title">
                👶 Начать с начала (с младенчества) - не работает
              </span>
              <span class="start-page__radio-desc">
                Пройдите весь путь с рождения — детство, школа, взросление
              </span>
            </label>
          </div>

          <div class="start-page__radio-row">
            <input
              v-model="startMode"
              id="start-adult"
              class="start-page__radio"
              type="radio"
              name="start-mode"
              value="adult"
              />
            <label
              class="start-page__radio-label"
              for="start-adult"
              >
              <span class="start-page__radio-title">
                🧑 Начать с взрослой жизни
              </span>
              <span class="start-page__radio-desc">
                Начните с высшим образованием и готовностью к карьере
              </span>
            </label>
          </div>

          <div
            v-if="startMode === 'adult'"
            class="start-page__age-field"
            >
            <label
              class="start-page__label"
              for="player-age"
              >
              Возраст персонажа
            </label>
            <input
              v-model.number="adultAge"
              :min="ADULT_AGE_MIN"
              :max="ADULT_AGE_MAX"
              id="player-age"
              class="start-page__input start-page__input--narrow"
              type="number"
              step="1"
              />
          </div>
        </fieldset>

        <button
          :disabled="!canStart"
          @click="startGame"
          class="start-page__button"
          >
          Начни жизнь
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import './index.scss'

import { NEW_GAME_SESSION_KEY } from './index.constants'
import { ADULT_AGE_MAX, ADULT_AGE_MIN } from './index.constants'
import type { StartMode } from './index.types'
const gameStore = useGameStore()

const { $autoSave } = useNuxtApp()

const playerName = ref<string>('')
const startMode = ref<StartMode>('infancy')
const adultAge = ref<number>(18)

const canStart = computed<boolean>(() => {

  if (!playerName.value.trim()) return false

  if (startMode.value === 'adult') {
    const parsedAdultAge: number = Number(adultAge.value)

    return Number.isFinite(parsedAdultAge) && parsedAdultAge >= ADULT_AGE_MIN && parsedAdultAge <= ADULT_AGE_MAX
  }

  return true
})

function startGame() {
  if (!canStart.value) return

  const startAge: number = startMode.value === 'infancy' ? 0 : adultAge.value
  const normalizedPlayerName: string = playerName.value.trim()
  $autoSave.clear()

  if (import.meta.client) {
    sessionStorage.setItem(NEW_GAME_SESSION_KEY, '1')
  }
  gameStore.startNewGame({ playerName: normalizedPlayerName, startAge })

  navigateTo('/game')
}
</script>

