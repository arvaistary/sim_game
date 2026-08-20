
import type { HousingLevel, FurnitureItem } from './housing-store.types'

export type { HousingLevel, FurnitureItem } from './housing-store.types'

export const HOUSING_LEVELS: HousingLevel[] = [
  { level: 0, name: 'Комната', comfort: 20, rent: 5000 },
  { level: 1, name: 'Студия', comfort: 35, rent: 8000 },
  { level: 2, name: '1-комнатная', comfort: 50, rent: 12000 },
  { level: 3, name: '2-комнатная', comfort: 65, rent: 18000 },
  { level: 4, name: 'Дом', comfort: 80, rent: 25000 },
  { level: 5, name: 'Особняк', comfort: 95, rent: 40000 },
]

export const FURNITURE_CATALOG: Omit<FurnitureItem, 'purchased'>[] = [
  { id: 'bed', name: 'Кровать', comfortBonus: 15 },
  { id: 'laptop', name: 'Ноутбук', comfortBonus: 5 },
  { id: 'desk', name: 'Рабочий стол', comfortBonus: 5 },
  { id: ' couch', name: 'Диван', comfortBonus: 8 },
  { id: 'tv', name: 'Телевизор', comfortBonus: 5 },
  { id: 'fitness_mat', name: 'Спортивный коврик', comfortBonus: 3 },
  { id: 'books', name: 'Книжная полка', comfortBonus: 5 },
  { id: 'plant', name: 'Растение', comfortBonus: 3 },
]

export const useHousingStore = defineStore('housing', () => {
  const level: Ref<number> = ref<number>(0)
  const comfort: Ref<number> = ref<number>(HOUSING_LEVELS[0]!.comfort)
  const furniture: Ref<FurnitureItem[]> = ref<FurnitureItem[]>([])
  const lastWeeklyBonus: Ref<number | null> = ref<number | null>(null)

  const currentHousing: ComputedRef<HousingLevel | undefined> = computed(() => HOUSING_LEVELS[level.value] ?? HOUSING_LEVELS[0])
  const housingName: ComputedRef<string> = computed(() => currentHousing.value?.name ?? '')
  const rent: ComputedRef<number> = computed(() => currentHousing.value?.rent ?? 0)

  const furnitureList: ComputedRef<FurnitureItem[]> = computed(() => furniture.value)
  const purchasedFurniture: ComputedRef<FurnitureItem[]> = computed(() =>
    furniture.value.filter(
      (f: FurnitureItem) => f.purchased
    )
  )
  const furnitureCount: ComputedRef<number> = computed(() => purchasedFurniture.value.length)

  const totalComfort: ComputedRef<number> = computed(() => {
    const baseComfort: number = currentHousing.value?.comfort ?? 0
    const furnitureBonus: number = purchasedFurniture.value.reduce(
      (sum: number, f: FurnitureItem) => sum + f.comfortBonus,
      0
    )
    return Math.min(100, baseComfort + furnitureBonus)
  })

  function upgradeHousing(newLevel: number): void {
    const housing: HousingLevel | undefined = HOUSING_LEVELS[newLevel]

    if (!housing || newLevel <= level.value) return

    level.value = newLevel
    comfort.value = housing.comfort
  }

  function purchaseFurniture(itemId: string): boolean {
    const catalogItem: typeof FURNITURE_CATALOG[number] | undefined = FURNITURE_CATALOG.find(
      (f: typeof FURNITURE_CATALOG[number]) => f.id === itemId
    )

    if (!catalogItem) return false

    const existing: FurnitureItem | undefined = furniture.value.find(
      (f: FurnitureItem) => f.id === itemId
    )

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
      (f: FurnitureItem) => f.id === itemId
    )

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
    if (data?.level !== undefined) level.value = data.level as number

    if (data?.comfort !== undefined) comfort.value = data.comfort as number

    if (data?.furniture) furniture.value = data.furniture as FurnitureItem[]

    if (data?.lastWeeklyBonus) lastWeeklyBonus.value = data.lastWeeklyBonus as number | null
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
