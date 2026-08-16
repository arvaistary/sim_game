<template>
  <article class="prologue-scene-card">
    <p
      v-if="yearLabel"
      class="prologue-scene-card__year"
    >
      {{ yearLabel }}
    </p>
    <h2 class="prologue-scene-card__title">
      {{ title }}
    </h2>
    <p class="prologue-scene-card__description">
      {{ description }}
    </p>
    <div class="prologue-scene-card__choices">
      <button
        v-for="choice in choices"
        :key="choice.index"
        class="prologue-scene-card__choice"
        type="button"
        @click="emit('choose', choice.index)"
      >
        <span class="prologue-scene-card__choice-label">{{ choice.label }}</span>
        <span class="prologue-scene-card__choice-desc">{{ choice.description }}</span>
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import './PrologueSceneCard.scss'
import type { PrologueSceneCardEmits, PrologueSceneCardProps } from './PrologueSceneCard.types'

defineProps<PrologueSceneCardProps>()

const emit = defineEmits<PrologueSceneCardEmits>()

</script>
