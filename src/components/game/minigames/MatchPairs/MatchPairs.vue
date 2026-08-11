<template>
  <section class="match-pairs">
    <h3 class="match-pairs__title">
      Соедини пары
    </h3>
    <p class="match-pairs__hint">
      Найди {{ pairs.length }} пары. Ошибок: {{ mistakes }}
    </p>
    <div class="match-pairs__grid">
      <button
        v-for="card in cards"
        :key="card.id"
        class="match-pairs__card"
        type="button"
        :disabled="card.matched"
        :class="{
          'match-pairs__card--flipped': card.flipped || card.matched,
          'match-pairs__card--matched': card.matched,
        }"
        @click="flipCard(card.id)"
      >
        {{ card.flipped || card.matched ? card.label : '?' }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import './MatchPairs.scss'
import type { Ref } from 'vue'
import type { MatchCardView, MatchPairDef, MatchPairsEmits } from './MatchPairs.types'

const emit = defineEmits<MatchPairsEmits>()

const pairs: MatchPairDef[] = [
  { id: 'p1', left: '2+2', right: '4' },
  { id: 'p2', left: 'Столица', right: 'Париж' },
  { id: 'p3', left: 'Кислород', right: 'O₂' },
]

const cards: Ref<MatchCardView[]> = ref<MatchCardView[]>(buildCards(pairs))
const selectedIds: Ref<string[]> = ref<string[]>([])
const mistakes: Ref<number> = ref<number>(0)
const lock: Ref<boolean> = ref<boolean>(false)

function buildCards(source: MatchPairDef[]): MatchCardView[] {
  const built: MatchCardView[] = []

  for (const pair of source) {
    built.push({ id: `${pair.id}-a`, pairId: pair.id, label: pair.left, flipped: false, matched: false })
    built.push({ id: `${pair.id}-b`, pairId: pair.id, label: pair.right, flipped: false, matched: false })
  }

  for (let index = built.length - 1; index > 0; index -= 1) {
    const swapIndex: number = Math.floor(Math.random() * (index + 1))
    const temp: MatchCardView = built[index]!
    built[index] = built[swapIndex]!
    built[swapIndex] = temp
  }

  return built
}

function flipCard(cardId: string): void {
  if (lock.value) return

  const card: MatchCardView | undefined = cards.value.find(
    (item: MatchCardView) => item.id === cardId,
  )

  if (!card || card.matched || card.flipped) return

  card.flipped = true
  selectedIds.value.push(cardId)

  if (selectedIds.value.length < 2) return

  lock.value = true
  const firstId: string = selectedIds.value[0]!
  const secondId: string = selectedIds.value[1]!
  const first: MatchCardView = cards.value.find(
    (item: MatchCardView) => item.id === firstId,
  )!
  const second: MatchCardView = cards.value.find(
    (item: MatchCardView) => item.id === secondId,
  )!

  if (first.pairId === second.pairId) {
    first.matched = true
    second.matched = true
    selectedIds.value = []
    lock.value = false
    maybeFinish()
    return
  }

  mistakes.value += 1
  window.setTimeout(() => {
    first.flipped = false
    second.flipped = false
    selectedIds.value = []
    lock.value = false
  }, 450)
}

function maybeFinish(): void {
  if (!cards.value.every((card: MatchCardView) => card.matched)) return

  const successTier: MinigameResult['successTier'] =
    mistakes.value === 0 ? 'great' : mistakes.value <= 2 ? 'ok' : 'fail'
  const score01: number = Math.max(0, 1 - mistakes.value * 0.2)

  emit('complete', {
    minigameId: 'match-pairs',
    successTier,
    score01,
  })
}
</script>
