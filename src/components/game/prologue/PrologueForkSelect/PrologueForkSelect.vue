<template>
  <section class="prologue-fork">
    <h2 class="prologue-fork__title">Куда дальше?</h2>
    <p class="prologue-fork__lead">
      Школа позади. Выбери путь — техникум или университет. Оба ведут ко взрослой жизни в 18 лет.
    </p>
    <div class="prologue-fork__options">
      <button
        class="prologue-fork__option"
        type="button"
        @click="emit('select', 'tech')"
      >
        <span class="prologue-fork__option-title">Техникум</span>
        <span class="prologue-fork__option-desc">Практика, быстрее к работе. Уклон в руки и дисциплину.</span>
      </button>
      <button
        class="prologue-fork__option"
        type="button"
        @click="emit('select', 'uni')"
      >
        <span class="prologue-fork__option-title">Университет</span>
        <span class="prologue-fork__option-desc">Шире теория и статус. Уклон в знания и общение.</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import './PrologueForkSelect.scss'
import type { PrologueForkSelectEmits } from './PrologueForkSelect.types'

const emit = defineEmits<PrologueForkSelectEmits>()
</script>
