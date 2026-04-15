<template>
  <div class="start-page">
    <div class="start-page__content">
      <h1 class="start-page__title">Game Life</h1>
      <p class="start-page__subtitle">Cozy Life Simulator</p>

      <div class="start-page__form">
        <label class="start-page__label" for="player-name">Как вас зовут?</label>
        <input
          id="player-name"
          v-model="playerName"
          class="start-page__input"
          type="text"
          autocomplete="name"
          placeholder="Введите имя…"
          @keyup.enter="startGame"
        />

        <fieldset class="start-page__fieldset">
          <legend class="start-page__legend">Старт жизни</legend>

          <div class="start-page__radio-row">
            <input
              id="start-infancy"
              v-model="startMode"
              class="start-page__radio"
              type="radio"
              name="start-mode"
              value="infancy"
            />
            <label class="start-page__radio-label" for="start-infancy">
              <span class="start-page__radio-title">👶 Начать с начала (с младенчества)</span>
              <span class="start-page__radio-desc">Пройдите весь путь с рождения — детство, школа, взросление</span>
            </label>
          </div>

          <div class="start-page__radio-row">
            <input
              id="start-adult"
              v-model="startMode"
              class="start-page__radio"
              type="radio"
              name="start-mode"
              value="adult"
            />
            <label class="start-page__radio-label" for="start-adult">
              <span class="start-page__radio-title">🧑 Начать с взрослой жизни</span>
              <span class="start-page__radio-desc">Начните с высшим образованием и готовностью к карьере</span>
            </label>
          </div>

          <div v-if="startMode === 'adult'" class="start-page__age-field">
            <label class="start-page__label" for="player-age">Возраст персонажа</label>
            <input
              id="player-age"
              v-model.number="adultAge"
              class="start-page__input start-page__input--narrow"
              type="number"
              :min="adultAgeMin"
              :max="ageMax"
              step="1"
            />
          </div>
        </fieldset>

        <button class="start-page__button" :disabled="!canStart" @click="startGame">
          Начни жизнь
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { navigateTo } from '#imports'
import {
  NEW_GAME_AGE_BOUNDS,
  buildNewGameSavePayload,
} from '@/domain/balance/utils/build-new-game-save'
import { useGameStore } from '@/stores/game.store'

type StartMode = 'infancy' | 'adult'

const store = useGameStore()
const playerName = ref('')
const startMode = ref<StartMode>('infancy')
const adultAge = ref(18)

const ageMax = NEW_GAME_AGE_BOUNDS.max
const adultAgeMin = 16

const canStart = computed(() => {
  if (!playerName.value.trim()) return false
  if (startMode.value === 'adult') {
    const a = Number(adultAge.value)
    return Number.isFinite(a) && a >= adultAgeMin && a <= ageMax
  }
  return true
})

function startGame() {
  if (!canStart.value) return

  const startAge = startMode.value === 'infancy' ? 0 : adultAge.value
  const pathId = startMode.value === 'infancy' ? 'none' : 'institute'

  store.initWorld(
    buildNewGameSavePayload({
      playerName: playerName.value,
      startAge,
      pathId,
    }),
  )
  store.save()
  navigateTo('/game')
}
</script>

<style scoped lang="scss" src="./index.scss"></style>
