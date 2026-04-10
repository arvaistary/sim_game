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
          placeholder="Введите имя…"
          @keyup.enter="startGame"
        />

        <button class="start-page__button" :disabled="!playerName.trim()" @click="startGame">
          Начать жизнь
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { navigateTo } from '#imports'
import { useGameStore } from '@/stores/game.store'

const store = useGameStore()
const playerName = ref('')

function startGame() {
  if (!playerName.value.trim()) return
  store.initWorld({ playerName: playerName.value })
  navigateTo('/game')
}
</script>

<style scoped lang="scss" src="./index.scss"></style>
