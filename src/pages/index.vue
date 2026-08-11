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
                <span class="start-page__radio-title">Начать с младенчества</span>
                <span class="start-page__radio-desc">Короткий пролог: детство → школа → техникум или вуз → взрослая жизнь в 18</span>
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
                <span class="start-page__radio-title">Начать со взрослой жизни</span>
                <span class="start-page__radio-desc">Чистый лист: без пролога, базовые навыки, образование «Нет»</span>
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
import {
  buildCleanSlateAdultStartPayload,
  buildInfancyPrologueStartPayload,
} from '@/domain/balance/utils/build-start-payloads'
import { CLEAN_SLATE_ADULT_SKILLS } from '@/domain/balance/constants/prologue/anti-imba-caps'

const playerStore = usePlayerStore()
const timeStore = useTimeStore()
const walletStore = useWalletStore()
const skillsStore = useSkillsStore()
const educationStore = useEducationStore()
const gameStore = useGameStore()
const prologueStore = usePrologueStore()

const playerName = ref('')
const startMode = ref<StartMode>('infancy')
const adultAge = ref(18)

const adultAgeMin: number = 16
const ageMax: number = 20

const canStart: ComputedRef<boolean> = computed(() => {
  if (!playerName.value.trim()) return false

  if (startMode.value === 'adult') {
    const ageValue: number = Number(adultAge.value)
    return Number.isFinite(ageValue) && ageValue >= adultAgeMin && ageValue <= ageMax
  }
  return true
})

async function startGame(): Promise<void> {
  if (!canStart.value) return

  const { $autoSave } = useNuxtApp()

  const name: string = playerName.value.trim()

  $autoSave.clear()
  gameStore.resetGame()

  playerStore.setName(name)
  playerStore.initialize()

  if (startMode.value === 'adult') {
    const payload = buildCleanSlateAdultStartPayload({
      playerName: name,
      startAge: adultAge.value,
    })

    playerStore.hideWelcomeScreen()
    timeStore.setStartAge(payload.startAge as number)
    timeStore.setTotalHours(0)
    skillsStore.initializeSkills(CLEAN_SLATE_ADULT_SKILLS)
    educationStore.setEducationLevel('none')
    walletStore.reset()

    if (gameStore.gameMode !== 'spa') {
      const world: GameWorld = GameWorld.createEmpty()
      world.player.playerName = name
      world.player.startAge = payload.startAge as number
      world.player.currentAge = payload.currentAge as number
      world.wallet.money = 5000
      await gameStore.initializeServerSession(world.toJSON(), { replace: true })
    }

    $autoSave.enable()
    $autoSave.flush()
    await navigateTo('/game')
    return
  }

  const infancy = buildInfancyPrologueStartPayload({ playerName: name })
  playerStore.showWelcomeScreen()
  timeStore.setStartAge(0)
  timeStore.setTotalHours(0)
  prologueStore.start(name, infancy.prologueSeed as number)

  if (gameStore.gameMode !== 'spa') {
    const world: GameWorld = GameWorld.createEmpty()
    world.player.playerName = name
    world.player.startAge = 0
    world.player.currentAge = 0
    world.wallet.money = 5000
    await gameStore.initializeServerSession(world.toJSON(), { replace: true })
  }

  $autoSave.enable()
  $autoSave.flush()
  await navigateTo('/game/prologue')
}
</script>
