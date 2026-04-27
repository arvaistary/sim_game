import type { HousingLevel, FurnitureItem } from './index.types'

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
  { id: 'couch', name: 'Диван', comfortBonus: 8 },
  { id: 'tv', name: 'Телевизор', comfortBonus: 5 },
  { id: 'fitness_mat', name: 'Спортивный коврик', comfortBonus: 3 },
  { id: 'books', name: 'Книжная полка', comfortBonus: 5 },
  { id: 'plant', name: 'Растение', comfortBonus: 3 },
]
