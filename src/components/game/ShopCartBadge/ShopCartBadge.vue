<template>
  <button
    class="shop-cart-badge"
    :class="{ 'shop-cart-badge--empty': isEmpty }"
    type="button"
    :aria-label="ariaLabel"
    @click="$emit('open')"
  >
    <GameIcon name="cart" :size="24" />
    <span v-if="!isEmpty" class="shop-cart-badge__copy">
      <strong>{{ countLabel }}</strong>
      <span>{{ formatMoney(total) }} ₽</span>
    </span>
  </button>
</template>

<script setup lang="ts">
import type { ComputedRef } from 'vue'

import { formatMoney } from '@/utils/format'
import type { ShopCartBadgeEmits, ShopCartBadgeProps } from './ShopCartBadge.types'

import './ShopCartBadge.scss'

const props = defineProps<ShopCartBadgeProps>()

defineEmits<ShopCartBadgeEmits>()

const isEmpty: ComputedRef<boolean> = computed(() => props.itemCount < 1)

const countLabel: ComputedRef<string> = computed(() => getCartCountLabel(props.itemCount))

const ariaLabel: ComputedRef<string> = computed(() => {
  const empty: boolean = isEmpty.value

  if (empty) return 'Корзина'

  return `${countLabel.value}, ${formatMoney(props.total)} ₽`
})

function getCartCountLabel(count: number): string {
  const abs: number = Math.abs(count) % 100
  const last: number = abs % 10

  if (abs > 10 && abs < 20) return `${count} товаров`

  if (last === 1) return `${count} товар`

  if (last >= 2 && last <= 4) return `${count} товара`

  return `${count} товаров`
}
</script>
