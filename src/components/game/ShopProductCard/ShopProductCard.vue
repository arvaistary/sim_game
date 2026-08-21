<template>
  <article
    class="shop-product-card"
    :class="{ 'shop-product-card--disabled': disabled }"
    @click="openDetails"
  >
    <div class="shop-product-card__illustration">
      <img :src="image" :alt="title">
    </div>
    <div class="shop-product-card__content">
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
      <div class="shop-product-card__purchase">
        <strong>{{ formatMoney(action.price) }} ₽</strong>
        <button type="button" :disabled="disabled" @click.stop="handlePurchase">Купить</button>
      </div>
    </div>
  </article>

  <ActionDetailsModal
    :is-open="isDetailsOpen"
    :action="action"
    :title="title"
    :description="description"
    :image="image"
    button-label="Купить"
    :disabled="disabled"
    :show-add-to-plan="false"
    @close="isDetailsOpen = false"
    @execute="handleModalPurchase"
  />
</template>

<script setup lang="ts">
import { formatMoney } from '@/utils/format'
import type { BalanceAction } from '@/domain/balance/actions'
import './ShopProductCard.scss'

const props = defineProps<{
  action: BalanceAction
  title: string
  description: string
  image: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  purchase: [action: BalanceAction]
}>()

const isDetailsOpen = ref<boolean>(false)

function openDetails(): void {
  isDetailsOpen.value = true
}

function handlePurchase(): void {
  emit('purchase', props.action)
}

function handleModalPurchase(): void {
  isDetailsOpen.value = false
  emit('purchase', props.action)
}
</script>
