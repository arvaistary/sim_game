<template>
  <GameLayout title="Недвижимость">
    <div class="housing-page">
      <div class="housing-page__intro-block">
        <h2 class="housing-page__heading">Недвижимость</h2>
        <p class="housing-page__intro">Подберите жильё под текущий этап жизни и откройте карточку для подробностей.</p>
      </div>

      <RoundedPanel class="housing-summary" :radius="18" padding="20px">
        <div class="housing-summary__item">
          <span class="housing-summary__label">Текущее жильё</span>
          <strong class="housing-summary__value">{{ housingStore.housingName }}</strong>
        </div>
        <div class="housing-summary__item housing-summary__metric">
          <strong>{{ housingStore.totalComfort }} / 100</strong>
          <span>Комфорт</span>
        </div>
        <div class="housing-summary__item housing-summary__metric">
          <strong>{{ formatMoney(housingStore.rent) }} ₽</strong>
          <span>Аренда / месяц</span>
        </div>
        <div v-if="canUpgradeHousing" class="housing-summary__status">Можно улучшить</div>
      </RoundedPanel>

      <div class="housing-page__options">
        <h2 class="housing-section-title">Варианты недвижимости</h2>
        <p class="housing-page__section-copy">Клик по карточке открывает описание, характеристики и галерею дома.</p>
      </div>

      <div class="property-grid">
        <PropertyCard
          v-for="property in properties"
          :key="property.housing.level"
          :housing="property.housing"
          :description="property.description"
          :image="property.image"
          @open="openProperty"
        />
      </div>
    </div>

    <Modal
      :is-open="selectedProperty !== null"
      max-width="800px"
      :title="selectedProperty?.housing.name ?? ''"
      @close="selectedProperty = null"
    >
      <div v-if="selectedProperty" class="property-modal">
        <div class="property-modal__gallery" aria-label="Галерея недвижимости">
          <div class="property-modal__featured">
            <img :src="selectedProperty.images[galleryIndex]" :alt="selectedProperty.housing.name">
            <span class="property-modal__counter">{{ galleryIndex + 1 }} / {{ selectedProperty.images.length }}</span>
          </div>
          <div class="property-modal__thumbnails">
            <button
              v-for="(image, index) in selectedProperty.images"
              :key="image"
              class="property-modal__thumbnail"
              :class="{ 'property-modal__thumbnail--active': galleryIndex === index }"
              type="button"
              :aria-label="`Открыть изображение ${index + 1}`"
              @click="galleryIndex = index"
            >
              <img :src="image" :alt="selectedProperty.housing.name">
            </button>
          </div>
        </div>
        <div class="property-modal__details">
          <p class="property-modal__description">{{ selectedProperty.description }}</p>
          <div class="property-modal__stats">
            <span>Комфорт</span><strong>{{ selectedProperty.housing.comfort }}</strong>
            <span>Аренда / месяц</span><strong>{{ formatMoney(selectedProperty.housing.rent ?? 0) }} ₽</strong>
          </div>
        </div>
        <div class="property-modal__actions">
          <GameButton variant="secondary" label="Закрыть" @click="selectedProperty = null" />
          <GameButton
            :label="selectedProperty.housing.level > housingStore.level ? 'Выбрать дом' : selectedProperty.housing.level === housingStore.level ? 'Текущее жильё' : 'Недоступно'"
            :disabled="selectedProperty.housing.level <= housingStore.level"
            @click="selectProperty"
          />
        </div>
      </div>
    </Modal>
  </GameLayout>
</template>

<script setup lang="ts">
import type { ComputedRef } from 'vue'

import './home.scss'
import { HOUSING_LEVELS, type HousingLevel } from '@/stores/housing-store'
import { formatMoney } from '@/utils/format'

definePageMeta({ middleware: 'game-init' })

const housingStore = useHousingStore()

const descriptions = [
  'Стартовый вариант с минимальными затратами.',
  'Компактное пространство для самостоятельной жизни.',
  'Баланс стоимости, личного пространства и комфорта.',
  'Отдельная спальня и зона для работы.',
  'Три спальни, гараж и приватный двор.',
  'Максимальный уровень комфорта для большой семьи.',
]

const images = [1, 2, 6, 5, 8, 7].map(
  (number) => `/image/housing/housing-${number}.png`,
)

const properties = HOUSING_LEVELS.map(
  (housing, index) => ({
    housing,
    description: descriptions[index] ?? 'Жильё для следующего этапа жизни.',
    image: images[index]!,
    images: [
      images[index]!,
      images[(index + 1) % images.length]!,
      images[(index + 2) % images.length]!,
      images[(index + 3) % images.length]!,
    ],
  }),
)

const selectedProperty = ref<(typeof properties)[number] | null>(null)
const galleryIndex = ref(0)

const canUpgradeHousing: ComputedRef<boolean> = computed(() => housingStore.level < HOUSING_LEVELS.length - 1)

function openProperty(housing: HousingLevel): void {
  selectedProperty.value = properties.find(property => property.housing.level === housing.level) ?? null
  galleryIndex.value = 0
}

function selectProperty(): void {
  const property = selectedProperty.value

  if (!property || property.housing.level <= housingStore.level) return

  housingStore.upgradeHousing(property.housing.level)
  selectedProperty.value = null
}
</script>
