export interface ShopStoreGradeOption {
  value: number
  label: string
}

export const SHOP_STORE_MAX_RATING = 5

export const SHOP_STORE_GRADES: ShopStoreGradeOption[] = [
  { value: 0, label: 'Без звёзд' },
  { value: 1, label: '1 звезда' },
  { value: 2, label: '2 звезды' },
  { value: 3, label: '3 звезды' },
  { value: 4, label: '4 звезды' },
  { value: 5, label: '5 звёзд' },
]
