import { useContext } from 'react'
import { CartContext } from './cartContext'
import type { CartContextValue } from './cartContext'

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}