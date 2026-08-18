import type { CategoryFormInput, ProductFormInput } from '../types'

export function validateProduct(input: ProductFormInput): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!input.name.trim()) {
    errors.name = 'El nombre es obligatorio.'
  }
  if (!input.slug.trim()) {
    errors.slug = 'El slug es obligatorio.'
  }

  const price = Number(input.price)
  if (input.price === '' || Number.isNaN(price) || price < 0) {
    errors.price = 'El precio debe ser mayor o igual a 0.'
  }

  const stock = Number(input.stock)
  if (input.stock === '' || Number.isNaN(stock) || stock < 0) {
    errors.stock = 'El stock debe ser mayor o igual a 0.'
  }

  if (input.compare_price !== '') {
    const compare = Number(input.compare_price)
    if (Number.isNaN(compare) || compare < 0) {
      errors.compare_price = 'Debe ser mayor o igual a 0.'
    }
  }

  if (input.cost_price !== '') {
    const cost = Number(input.cost_price)
    if (Number.isNaN(cost) || cost < 0) {
      errors.cost_price = 'Debe ser mayor o igual a 0.'
    }
  }

  return errors
}

export function validateCategory(input: CategoryFormInput): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!input.name.trim()) {
    errors.name = 'El nombre es obligatorio.'
  }
  if (!input.slug.trim()) {
    errors.slug = 'El slug es obligatorio.'
  }

  return errors
}

export function validateUrl(value: string): boolean {
  if (!value.trim()) return true
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}