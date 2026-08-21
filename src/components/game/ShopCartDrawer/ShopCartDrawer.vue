<template>
  <Teleport to="body">
    <Transition name="shop-cart">
      <div v-if="isOpen" class="shop-cart-drawer__overlay" @click.self="$emit('close')">
        <aside class="shop-cart-drawer" aria-label="Корзина">
          <header class="shop-cart-drawer__header">
            <h2>Корзина</h2>
            <button type="button" class="shop-cart-drawer__close" aria-label="Закрыть корзину" @click="$emit('close')">
              <GameIcon name="close" :size="16" :stroke-width="1.5" />
            </button>
          </header>

          <div v-if="items.length" class="shop-cart-drawer__items">
            <article v-for="item in items" :key="item.id" class="shop-cart-drawer__item">
              <img v-if="item.image" :src="item.image" :alt="item.title">
              <div class="shop-cart-drawer__item-copy">
                <strong>{{ item.title }}</strong>
                <span>{{ item.quantity }} × {{ formatMoney(item.price) }} ₽</span>
              </div>
              <button type="button" class="shop-cart-drawer__remove" aria-label="Удалить товар" @click="$emit('remove', item.id)">
                <GameIcon name="close" :size="14" :stroke-width="1.5" />
              </button>
            </article>
          </div>
          <p v-else class="shop-cart-drawer__empty">Корзина пока пуста</p>

          <footer v-if="items.length" class="shop-cart-drawer__footer">
            <div><span>Итого</span><strong>{{ formatMoney(total) }} ₽</strong></div>
            <button type="button" @click="$emit('checkout')">Перейти к покупке</button>
          </footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { formatMoney } from '@/utils/format'
import GameIcon from '@/components/ui/GameIcon/GameIcon.vue'
import type { ShopCartDrawerEmits, ShopCartDrawerProps } from './ShopCartDrawer.types'

import './ShopCartDrawer.scss'

defineProps<ShopCartDrawerProps>()

defineEmits<ShopCartDrawerEmits>()
</script>
