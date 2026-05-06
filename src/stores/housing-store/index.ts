
import type { FurnitureItem } from './index.types'
import type { HousingLevel, CatalogFurnitureItem } from './index.types'
import { HOUSING_LEVELS, FURNITURE_CATALOG } from './index.constants'

function isFurnitureItemArray(value: unknown): value is FurnitureItem[] {
  if (!Array.isArray(value)) return false

  return value.every((item: unknown) =>
    typeof item === 'object'
    && item !== null
    && typeof (item as Record<string, unknown>).id === 'string'
    && typeof (item as Record<string, unknown>).name === 'string'
    && typeof (item as Record<string, unknown>).comfortBonus === 'number'
    && typeof (item as Record<string, unknown>).purchased === 'boolean',
  )
}

export const useHousingStore = defineStore('housing', () => {
  const level = ref<number>(0)
  const comfort = ref<number>(HOUSING_LEVELS[0]!.comfort)
  const furniture = ref<FurnitureItem[]>([])
  const lastWeeklyBonus = ref<number | null>(null)

  const currentHousing = computed<HousingLevel>(() => HOUSING_LEVELS[level.value] ?? HOUSING_LEVELS[0]!)
  const housingName = computed<string>(() => currentHousing.value!.name)
  const rent = computed<number>(() => currentHousing.value!.rent ?? 0)

  const furnitureList = computed<FurnitureItem[]>(() => furniture.value)
  const purchasedFurniture = computed<FurnitureItem[]>(() => furniture.value.filter((f: FurnitureItem) => f.purchased))
  const furnitureCount = computed<number>(() => purchasedFurniture.value.length)

  const totalComfort = computed<number>(() => {
    const baseComfort: number = currentHousing.value!.comfort
    const furnitureBonus: number = purchasedFurniture.value.reduce(
      (sum: number, f: FurnitureItem) => sum + f.comfortBonus, 0)

    return Math.min(100, baseComfort + furnitureBonus)
  })

  function upgradeHousing(newLevel: number): void {
    const housing: HousingLevel | undefined = HOUSING_LEVELS[newLevel]

    if (housing) {
      level.value = newLevel
      comfort.value = housing.comfort
    }
  }

  function purchaseFurniture(itemId: string): boolean {
    const catalogItem: CatalogFurnitureItem | undefined = FURNITURE_CATALOG.find(f => f.id === itemId)

    if (!catalogItem) return false

    const existing: FurnitureItem | undefined = furniture.value.find(
      (f: FurnitureItem) => f.id === itemId)

    if (existing?.purchased) return false

    if (existing) {
      existing.purchased = true
    } else {
      furniture.value.push({ ...catalogItem, purchased: true })
    }

    return true
  }

  function hasFurniture(itemId: string): boolean {
    return furniture.value.some((f: FurnitureItem) => f.id === itemId && f.purchased)
  }

  function applyWeeklyComfortBonus(): void {
    lastWeeklyBonus.value = totalComfort.value
  }

  function getFurnitureBonus(itemId: string): number {
    const item: FurnitureItem | undefined = furniture.value.find(
      (f: FurnitureItem) => f.id === itemId)

    return item?.comfortBonus ?? 0
  }

  function reset(): void {
    level.value = 0
    comfort.value = HOUSING_LEVELS[0]!.comfort
    furniture.value = []
    lastWeeklyBonus.value = null
  }

  function save(): Record<string, unknown> {
    return {
      level: level.value,
      comfort: comfort.value,
      furniture: furniture.value,
      lastWeeklyBonus: lastWeeklyBonus.value,
    }
  }

  function load(data: Record<string, unknown>): void {
    if (typeof data?.level === 'number') level.value = data.level

    if (typeof data?.comfort === 'number') comfort.value = data.comfort

    if (isFurnitureItemArray(data?.furniture)) furniture.value = data.furniture

    if (typeof data?.lastWeeklyBonus === 'number' || data?.lastWeeklyBonus === null) {
      lastWeeklyBonus.value = data.lastWeeklyBonus
    }
  }

  return {
    level,
    comfort,
    furniture,
    lastWeeklyBonus,
    currentHousing,
    housingName,
    rent,
    furnitureList,
    purchasedFurniture,
    furnitureCount,
    totalComfort,
    upgradeHousing,
    purchaseFurniture,
    hasFurniture,
    applyWeeklyComfortBonus,
    getFurnitureBonus,
    reset,
    save,
    load,
  }
})

export * from './index.constants'
export type * from './index.types'
