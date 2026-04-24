import { HOUSING_LEVELS, FURNITURE_CATALOG } from '@/stores/housing-store'

export const HOUSING_CONSTANTS = { HOUSING_LEVELS, FURNITURE_CATALOG }

export function useHousing() {
  const housingStore = useHousingStore()

  return {
    level: computed(() => housingStore.level),
    comfort: computed(() => housingStore.comfort),
    furniture: computed(() => housingStore.furniture),
    lastWeeklyBonus: computed(() => housingStore.lastWeeklyBonus),
    currentHousing: computed(() => housingStore.currentHousing),
    housingName: computed(() => housingStore.housingName),
    rent: computed(() => housingStore.rent),
    furnitureList: computed(() => housingStore.furnitureList),
    purchasedFurniture: computed(() => housingStore.purchasedFurniture),
    furnitureCount: computed(() => housingStore.furnitureCount),
    totalComfort: computed(() => housingStore.totalComfort),
    upgradeHousing: housingStore.upgradeHousing,
    purchaseFurniture: housingStore.purchaseFurniture,
    hasFurniture: housingStore.hasFurniture,
    applyWeeklyComfortBonus: housingStore.applyWeeklyComfortBonus,
    getFurnitureBonus: housingStore.getFurnitureBonus,
    reset: housingStore.reset,
  }
}