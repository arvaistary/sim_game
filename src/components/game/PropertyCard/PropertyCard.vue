<template>
  <article
    class="property-card"
    role="button"
    tabindex="0"
    :aria-label="`Открыть подробности: ${housing.name}`"
    @click="$emit('open', housing)"
    @keydown.enter="$emit('open', housing)"
    @keydown.space.prevent="$emit('open', housing)"
  >
    <div class="property-card__illustration">
      <img :src="image" :alt="housing.name">
    </div>
    <div class="property-card__content">
      <h3>{{ housing.name }}</h3>
      <p>{{ description }}</p>
      <div class="property-card__meta">
        <span>Комфорт {{ housing.comfort }}</span>
        <span>{{ formatMoney(housing.rent ?? 0) }} ₽ / мес</span>
      </div>
      <div class="property-card__affordance">Подробнее</div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { HousingLevel } from '@/stores/housing-store'
import { formatMoney } from '@/utils/format'
import './PropertyCard.scss'

defineProps<{
  housing: HousingLevel
  description: string
  image: string
}>()

defineEmits<{
  open: [housing: HousingLevel]
}>()
</script>
