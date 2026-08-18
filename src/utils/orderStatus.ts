import type { OrderStatus } from '../types'
import type { BadgeTone } from '../components/ui/primitives'

export const ORDER_STATUSES: { value: OrderStatus; label: string; tone: BadgeTone }[] = [
  { value: 'pending', label: 'Pendiente', tone: 'amber' },
  { value: 'confirmed', label: 'Confirmado', tone: 'blue' },
  { value: 'paid', label: 'Pagado', tone: 'violet' },
  { value: 'preparing', label: 'En preparación', tone: 'blue' },
  { value: 'shipped', label: 'Enviado', tone: 'slate' },
  { value: 'completed', label: 'Completado', tone: 'green' },
  { value: 'cancelled', label: 'Cancelado', tone: 'red' },
]

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUSES.find((s) => s.value === status)?.label ?? status
}

export function orderStatusTone(status: OrderStatus): BadgeTone {
  return ORDER_STATUSES.find((s) => s.value === status)?.tone ?? 'slate'
}