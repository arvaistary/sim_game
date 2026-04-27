export interface HousingLevel {
  level: number
  name: string
  comfort: number
  rent?: number
}

export interface FurnitureItem {
  id: string
  name: string
  comfortBonus: number
  purchased: boolean
}

export type CatalogFurnitureItem = Omit<FurnitureItem, 'purchased'>
