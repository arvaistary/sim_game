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
          <p class="start-page__hint">
            Выберите отправную точку: без школы, со средним или с высшим (как в конфиге баланса).
          </p>
          <div
            v-for="path in educationPaths"
            :key="path.id"
            class="start-page__radio-row"
          >
            <input
              :id="`path-${path.id}`"
              v-model="pathId"
              class="start-page__radio"
              type="radio"
              name="education-path"
              :value="path.id"
            />
            <label class="start-page__radio-label" :for="`path-${path.id}`">
              <span class="start-page__radio-title">{{ path.label }}</span>
              <span class="start-page__radio-desc">{{ path.description }}</span>
            </label>
          </div>
        </fieldset>

        <div class="start-page__field">
          <label class="start-page__label" for="player-age">Возраст персонажа</label>
          <input
            id="player-age"
            v-model.number="startAge"
            class="start-page__input start-page__input--narrow"
            type="number"
            :min="ageMin"
            :max="ageMax"
            step="1"
          />
        </div>

        <button class="start-page__button" :disabled="!canStart" @click="startGame">
          Начать жизнь
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { navigateTo } from '#imports'
import { EDUCATION_PATHS } from '@/domain/balance/constants/education-paths'
import {
  NEW_GAME_AGE_BOUNDS,
  buildNewGameSavePayload,
  type NewGamePathId,
} from '@/domain/balance/utils/build-new-game-save'
import { useGameStore } from '@/stores/game.store'

const store = useGameStore()
const playerName = ref('')
const pathId = ref<NewGamePathId>('none')
const startAge = ref(18)

const educationPaths = EDUCATION_PATHS
const ageMin = NEW_GAME_AGE_BOUNDS.min
const ageMax = NEW_GAME_AGE_BOUNDS.max

const canStart = computed(() => {
  if (!playerName.value.trim()) return false
  const a = Number(startAge.value)
  return Number.isFinite(a) && a >= ageMin && a <= ageMax
})

function startGame() {
  if (!canStart.value) return
  store.initWorld(
    buildNewGameSavePayload({
      playerName: playerName.value,
      startAge: startAge.value,
      pathId: pathId.value,
    }),
  )
  store.save()
  navigateTo('/game')
}
</script>

<style scoped lang="scss" src="./index.scss"></style>
