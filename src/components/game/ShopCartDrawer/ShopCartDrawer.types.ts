export type ShopCartItem = {
  id: string
  title: string
  price: number
  quantity: number
  image?: string
}

export type ShopCartDrawerProps = {
  isOpen: boolean
  items: ShopCartItem[]
  total: number
}

export type ShopCartDrawerEmits = {
  close: []
  checkout: []
  remove: [id: string]
}
