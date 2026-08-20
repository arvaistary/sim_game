<template>
  <div class="shop-store-filter">
    <h3>Еда — градация магазина</h3>
    <div class="shop-store-filter__chips">
      <button
        v-for="grade in SHOP_STORE_GRADES"
        :key="grade.value"
        type="button"
        class="shop-store-filter__chip"
        :class="{ 'shop-store-filter__chip--active': modelValue === grade.value }"
        :aria-label="grade.label"
        :aria-pressed="modelValue === grade.value"
        @click="$emit('update:modelValue', grade.value)"
      >
        <ShopStoreRatingStars :rating="grade.value" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import './ShopStoreFilter.scss'
import ShopStoreRatingStars from './ShopStoreRatingStars.vue'
import { SHOP_STORE_GRADES } from './ShopStoreFilter.types'

defineProps<{ modelValue: number }>()
defineEmits<{ 'update:modelValue': [value: number] }>()
</script>
