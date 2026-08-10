<template>
  <div class="start-page">
    <!-- Left: brand panel (slate gradient with logomark) -->
    <aside class="start-page__brand">
      <div class="start-page__logo">GL</div>
      <div class="start-page__brand-text">
        <h2 class="start-page__brand-title">Game Life</h2>
        <p class="start-page__brand-tagline">Cozy Life Simulator</p>
      </div>
      <div class="start-page__brand-footer">
        <span class="start-page__brand-copy">Линейная эстетика • Slate + Emerald</span>
      </div>
    </aside>

    <!-- Right: form panel -->
    <main class="start-page__form-panel">
      <div class="start-page__content">
        <h1 class="start-page__title">Начни жизнь</h1>
        <p class="start-page__subtitle">Заполни имя и выбери старт</p>

        <div class="start-page__form">
          <label
            class="start-page__label"
            for="player-name"
          >Как вас зовут?</label>
          <input
            id="player-name"
            v-model="playerName"
            class="start-page__input"
            type="text"
            autocomplete="name"
            placeholder="Введите имя…"
            @keyup.enter="startGame"
          >

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
              >
              <label
                class="start-page__radio-label"
                for="start-infancy"
              >
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
              >
              <label
                class="start-page__radio-label"
                for="start-adult"
              >
                <span class="start-page__radio-title">🧑 Начать с взрослой жизни</span>
                <span class="start-page__radio-desc">Начните с высшим образованием и готовностью к карьере</span>
              </label>
            </div>

            <div
              v-if="startMode === 'adult'"
              class="start-page__age-field"
            >
              <label
                class="start-page__label"
                for="player-age"
              >Возраст персонажа</label>
              <input
                id="player-age"
                v-model.number="adultAge"
                class="start-page__input start-page__input--narrow"
                type="number"
                :min="adultAgeMin"
                :max="ageMax"
                step="1"
              >
            </div>
          </fieldset>

          <button
            class="start-page__button"
            type="button"
            :disabled="!canStart"
            @click="startGame"
          >
            Начать
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import './index.scss'
import type { ComputedRef } from 'vue'
import type { StartMode } from '@/types'
import { GameWorld } from '@/domain/game-world/GameWorld'

const playerStore = usePlayerStore()
const timeStore = useTimeStore()
const statsStore = useStatsStore()
const walletStore = useWalletStore()
const skillsStore = useSkillsStore()
const actionsStore = useActionsStore()
const gameStore = useGameStore()

const playerName = ref('')
const startMode = ref<StartMode>('infancy')
const adultAge = ref(18)

const adultAgeMin: number = 16
const ageMax: number = 20

const canStart: ComputedRef<boolean> = computed(() => {
  if (!playerName.value.trim()) return false

  if (startMode.value === 'adult') {
    const a: number = Number(adultAge.value)
    return Number.isFinite(a) && a >= adultAgeMin && a <= ageMax
  }
  return true
})

async function startGame(): Promise<void> {
  if (!canStart.value) return

  const startAge: number = startMode.value === 'infancy' ? 0 : adultAge.value

  playerStore.setName(playerName.value)
  playerStore.showWelcomeScreen()

  timeStore.reset()
  timeStore.setStartAge(startAge)
  timeStore.setTotalHours(0)

  statsStore.reset()
  walletStore.reset()
  skillsStore.reset()
  actionsStore.reset()

  if (gameStore.gameMode !== 'spa') {
    const world: GameWorld = GameWorld.createEmpty()
    world.player.playerName = playerName.value.trim()
    world.player.startAge = startAge
    world.player.currentAge = startAge
    world.wallet.money = 5000
    await gameStore.initializeServerSession(world.toJSON(), { replace: true })
  }

  await navigateTo('/game')
}
</script>
