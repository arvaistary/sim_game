<template>
  <span class="shop-store-rating-stars" aria-hidden="true">
    <GameIcon
      v-for="starIndex in SHOP_STORE_MAX_RATING"
      :key="starIndex"
      class="shop-store-rating-stars__star"
      :class="isStarFilled(starIndex) ? 'shop-store-rating-stars__star--filled' : 'shop-store-rating-stars__star--empty'"
      :name="isStarFilled(starIndex) ? 'star-bold' : 'star'"
      :variant="isStarFilled(starIndex) ? 'fill' : 'stroke'"
      :size="12"
      :stroke-width="1.4"
    />
  </span>
</template>

<script setup lang="ts">
import GameIcon from '@/components/ui/GameIcon/GameIcon.vue'
import { SHOP_STORE_MAX_RATING } from './ShopStoreFilter.types'

const props = defineProps<{
  rating: number
}>()

function isStarFilled(starIndex: number): boolean {
  return starIndex <= props.rating
}
</script>
