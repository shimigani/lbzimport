import { createContext } from 'react'

export type CartItem = {
  productId: string
  slug: string
  name: string
  price: number
  imageUrl: string | null
  quantity: number
  stock: number
}

export type CartContextValue = {
  items: CartItem[]
  count: number
  subtotal: number
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  clear: () => void
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)