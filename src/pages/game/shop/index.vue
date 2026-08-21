<template>
  <GameLayout title="Магазин">
    <div class="shop-page">
      <div class="shop-page__header">
        <div class="shop-page__title">
          <h2 class="shop-page__heading">Магазин</h2>
          <p class="shop-page__intro">Покупки для питания, обучения, дома и личной жизни.</p>
        </div>
        <ShopCartBadge :item-count="cartItemCount" :total="cartTotal" @open="isCartOpen = true" />
      </div>
      <!-- Табы-переключатели категорий -->
      <Tabs
        v-model="activeTab"
        :items="tabItems"
      />

      <!-- Контент: Еда -->
      <template v-if="activeTab === 'food'">
        <section class="shop-food">
          <ShopStoreFilter v-model="activeStoreGrade" />
          <div class="shop-food__catalog">
            <h2>Еда</h2>
            <p>Продукты, напитки и готовые блюда на каждый этап дня.</p>
          </div>
          <div class="shop-product-grid">
            <ShopProductCard
              v-for="product in foodProducts"
              :key="product.action.id"
              :action="product.action"
              :title="product.title"
              :description="product.description"
              :image="product.image"
              :disabled="isDisabled(product.action)"
              @purchase="addToCart"
            />
          </div>
        </section>
      </template>

      <!-- Контент: Обучение -->
      <template v-if="activeTab === 'learning'">
        <ActionCardList
          :actions="sortedLearningActions"
          :empty-text="actionsEmptyHint"
          :is-disabled="isDisabled"
          :get-disabled-reason="getDisabledReason"
          button-label="Купить"
          :show-price-when-zero="true"
          :use-format-effect="true"
          @execute="executeAction"
        />
      </template>

      <!-- Контент: Вещи -->
      <template v-if="activeTab === 'things'">
        <ActionCardList
          :actions="sortedThingsActions"
          :empty-text="actionsEmptyHint"
          :is-disabled="isDisabled"
          :get-disabled-reason="getDisabledReason"
          button-label="Купить"
          :show-price-when-zero="true"
          :use-format-effect="true"
          @execute="executeAction"
        />
      </template>

      <!-- Контент: Дом -->
      <template v-if="activeTab === 'home'">
        <ActionCardList
          :actions="sortedHomeActions"
          :empty-text="actionsEmptyHint"
          :is-disabled="isDisabled"
          :get-disabled-reason="getDisabledReason"
          button-label="Купить"
          :show-price-when-zero="true"
          :use-format-effect="true"
          @execute="executeAction"
        />
      </template>
    </div>
    <ShopCartDrawer
      :is-open="isCartOpen"
      :items="cartItems"
      :total="cartTotal"
      @close="isCartOpen = false"
      @remove="removeFromCart"
      @checkout="checkout"
    />
  </GameLayout>
</template>

<script setup lang="ts">
import './shop.scss'
import { getActionById } from '@/domain/balance/actions'
import type { BalanceAction } from '@/domain/balance/actions'
import { FOOD_ACTION_IDS, LEARNING_ACTION_IDS, THINGS_ACTION_IDS, HOME_ACTION_IDS } from '@/config/shop-tab-groups'
import type { ShopCartItem } from '@/components/game/ShopCartDrawer/ShopCartDrawer.types'

definePageMeta({ middleware: 'game-init' })

const timeStore = useTimeStore()

const walletStore = useWalletStore()

const housingStore = useHousingStore()

const actionsStore = useActionsStore()

const tabs = [
  { id: 'food', icon: 'ladle', title: 'Еда', shortDesc: 'Продукты, напитки и доставка' },
  { id: 'learning', icon: 'book', title: 'Обучение', shortDesc: 'Книги, курсы и учёба' },
  { id: 'things', icon: 'briefcase', title: 'Вещи', shortDesc: 'Одежда, подарки и покупки' },
  { id: 'home', icon: 'home', title: 'Дом', shortDesc: 'Мебель, техника и уют' },
] as const

// Map tabs to Tabs.vue API
const tabItems = computed(() => tabs.map((tab) => ({
  id: tab.id,
  icon: tab.icon,
  label: tab.title,
  subtitle: tab.shortDesc,
})))

const route = useRoute()
const availableTabIds = tabs.map(tab => tab.id)

function normalizeTab(rawValue: unknown): string {
  const value = typeof rawValue === 'string' ? rawValue : ''
  return availableTabIds.includes(value as (typeof tabs)[number]['id']) ? value : 'food'
}

const activeTab = ref<string>(normalizeTab(route.query.tab))

watch(
  () => route.query.tab,
  (nextTab) => {
    activeTab.value = normalizeTab(nextTab)
  },
)

const { getActionsByCategory, canExecute, executeAction, actionsEmptyHint } = useActions()

const allShopActions = getActionsByCategory('shop')
const activeStoreGrade = ref(0)

/** Сортировка: доступные действия первыми */
function isDisabled(action: BalanceAction): boolean {
  return !canExecute(action.id)
}

function sortByAvailability(actions: BalanceAction[]): BalanceAction[] {
  return [...actions].sort((a, b) => {
    const aOk = canExecute(a.id) ? 0 : 1
    const bOk = canExecute(b.id) ? 0 : 1
    return aOk - bOk
  })
}

/** Получить причину недоступности действия */
function getDisabledReason(action: BalanceAction): string {
  const result = getActionById(action.id)
  if (!result) return 'Действие не найдено'
  if (result.oneTime) {
    if (result.grantsItem && housingStore.hasFurniture(result.grantsItem)) return 'Уже куплено'

    const usage = actionsStore.actionUsage[result.id]

    if (usage && usage.count > 0) return 'Действие уже выполнено'
  }
  if (walletStore.money < result.price) return 'Недостаточно денег'
  if (timeStore.weekHoursRemaining < result.hourCost) return 'Недостаточно времени'
  return 'Действие недоступно'
}

// Еда
const foodActions = computed(() => {
  void timeStore.totalHours
  return allShopActions.filter((action: BalanceAction) => FOOD_ACTION_IDS.has(action.id))
})

// Обучение
const learningActions = computed(() => {
  void timeStore.totalHours
  return allShopActions.filter((action: BalanceAction) => LEARNING_ACTION_IDS.has(action.id))
})

// Вещи
const thingsActions = computed(() => {
  void timeStore.totalHours
  return allShopActions.filter((action: BalanceAction) => THINGS_ACTION_IDS.has(action.id))
})

// Дом
const homeActions = computed(() => {
  void timeStore.totalHours
  return allShopActions.filter((action: BalanceAction) => HOME_ACTION_IDS.has(action.id))
})

const sortedLearningActions = computed(() => sortByAvailability(learningActions.value))
const sortedThingsActions = computed(() => sortByAvailability(thingsActions.value))
const sortedHomeActions = computed(() => sortByAvailability(homeActions.value))

const featuredFoodProductMeta = [
  { id: 'shop_quick_snack', title: 'Быстрый перекус', description: 'Спасает, когда нужно быстро справиться с голодом.', image: '/image/food/food-3.png' },
  { id: 'shop_full_lunch', title: 'Полноценный обед', description: 'Возвращает силы и улучшает настроение.', image: '/image/food/food-1.png' },
  { id: 'shop_groceries_3days', title: 'Запас продуктов', description: 'Продукты на несколько дней — спокойствие дома.', image: '/image/food/food-7.png' },
  { id: 'shop_healthy_food', title: 'Здоровые продукты', description: 'Овощи, фрукты и крупы для самочувствия.', image: '/image/food/food-2.png' },
] as const

const foodProducts = computed(() => {
  return featuredFoodProductMeta.flatMap(
    (meta) => {
      const action = foodActions.value.find(
        (item: BalanceAction) => item.id === meta.id,
      )
      if (!action) return []
      return [{
        action,
        title: meta.title,
        description: meta.description,
        image: meta.image,
      }]
    },
  )
})

const cartItems = ref<ShopCartItem[]>([])
const isCartOpen = ref(false)
const isCheckingOut = ref(false)
const cartItemCount = computed(() => cartItems.value.reduce(
  (sum: number, item: ShopCartItem) => sum + item.quantity,
  0,
))
const cartTotal = computed(() => cartItems.value.reduce(
  (sum: number, item: ShopCartItem) => sum + item.price * item.quantity,
  0,
))

function addToCart(action: BalanceAction): void {
  const existing: ShopCartItem | undefined = cartItems.value.find(
    (item: ShopCartItem) => item.id === action.id,
  )

  if (existing) {
    existing.quantity += 1
    return
  }
  const product = foodProducts.value.find(
    (item) => item.action.id === action.id,
  )
  cartItems.value.push({
    id: action.id,
    title: product?.title ?? action.title,
    price: action.price,
    quantity: 1,
    image: product?.image,
  })
}

function removeFromCart(id: string): void {
  cartItems.value = cartItems.value.filter((item: ShopCartItem) => item.id !== id)
}

function removeOneFromCart(id: string): void {
  const item: ShopCartItem | undefined = cartItems.value.find(
    (cartItem: ShopCartItem) => cartItem.id === id,
  )

  if (!item) return

  if (item.quantity === 1) {
    removeFromCart(id)
    return
  }

  item.quantity -= 1
}

async function checkout(): Promise<void> {
  if (isCheckingOut.value) return

  isCheckingOut.value = true
  const items: ShopCartItem[] = [...cartItems.value]
  try {
    for (const item of items) {
      for (let index = 0; index < item.quantity; index += 1) {
        if (!await executeAction(item.id)) return

        removeOneFromCart(item.id)
      }
    }
    isCartOpen.value = false
  } finally {
    isCheckingOut.value = false
  }
}
</script>
