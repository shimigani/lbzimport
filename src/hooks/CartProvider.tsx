import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { CartContext } from './cartContext'
import type { CartItem } from './cartContext'

const STORAGE_KEY = 'mi-tienda-cart'

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Sin almacenamiento disponible: el carrito vive solo en memoria.
    }
  }, [items])

  const count = items.reduce((total, item) => total + item.quantity, 0)
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  )

  function addItem(item: Omit<CartItem, 'quantity'> & { quantity?: number }) {
    const quantity = item.quantity ?? 1
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId)
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: Math.min(i.quantity + quantity, i.stock) }
            : i,
        )
      }
      return [...prev, { ...item, quantity: Math.min(quantity, item.stock) }]
    })
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }

  function setQuantity(productId: string, quantity: number) {
    setItems((prev) =>
      prev
        .map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.max(0, Math.min(quantity, i.stock)) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    )
  }

  function clear() {
    setItems([])
  }

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        subtotal,
        addItem,
        removeItem,
        setQuantity,
        clear,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  )
}