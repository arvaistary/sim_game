<template>
  <section class="prologue-summary">
    <h2 class="prologue-summary__title">Кем ты вырос</h2>
    <p class="prologue-summary__fantasy">
      {{ fantasyLabel }}
    </p>
    <p class="prologue-summary__education">
      Образование: {{ educationLabel }}
    </p>
    <PrologueTagChips
      v-if="tagPoints"
      :tag-points="tagPoints"
    />
    <ul
      v-if="traits.length > 0"
      class="prologue-summary__traits"
    >
      <li
        v-for="traitId in traits"
        :key="traitId"
      >
        Черта: {{ traitLabel(traitId) }}
      </li>
    </ul>
    <button
      class="prologue-summary__cta"
      type="button"
      @click="emit('confirm')"
    >
      Войти во взрослую жизнь
    </button>
  </section>
</template>

<script setup lang="ts">
import './PrologueSummary.scss'
import { getPrologueTraitLabel } from '@/domain/balance/constants/prologue/prologue-traits'
import PrologueTagChips from '../PrologueTagChips/PrologueTagChips.vue'
import type { PrologueSummaryEmits, PrologueSummaryProps } from './PrologueSummary.types'

defineProps<PrologueSummaryProps>()

const emit = defineEmits<PrologueSummaryEmits>()

function traitLabel(traitId: string): string {
  return getPrologueTraitLabel(traitId)
}
</script>
