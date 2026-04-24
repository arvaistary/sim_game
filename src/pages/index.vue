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
import type { StartMode } from '@/types'

const playerStore = usePlayerStore()
const timeStore = useTimeStore()
const statsStore = useStatsStore()
const walletStore = useWalletStore()
const skillsStore = useSkillsStore()

const playerName = ref('')
const startMode = ref<StartMode>('infancy')
const adultAge = ref(18)

const MIN_ADULT_AGE = 16
const MAX_AGE = 18

const canStart = computed(() => {
  if (!playerName.value.trim()) return false
  if (startMode.value === 'adult') {
    const a = Number(adultAge.value)
    return Number.isFinite(a) && a >= MIN_ADULT_AGE && a <= MAX_AGE
  }
  return true
})

function startGame() {
  if (!canStart.value) return

  const startAge = startMode.value === 'infancy' ? 0 : adultAge.value

  // Инициализируем все stores
  playerStore.setName(playerName.value)
  playerStore.showWelcomeScreen()

  timeStore.setTotalHours(startAge * 365 * 24)

  statsStore.reset()
  walletStore.reset()
  skillsStore.reset()

  navigateTo('/game')
}
</script>

<style scoped lang="scss" src="./index.scss"></style>
