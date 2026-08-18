import { supabase } from '../lib/supabase'
import type { Order, OrderItem, OrderStatus, OrderWithItems } from '../types'

export async function listOrders(status: OrderStatus | 'all' = 'all'): Promise<Order[]> {
  let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
  if (status !== 'all') {
    query = query.eq('status', status)
  }
  const { data, error } = await query

  if (error) throw new Error(error.message)
  return (data ?? []) as Order[]
}

export async function getOrder(id: string): Promise<OrderWithItems | null> {
  const { data: order, error } = await supabase.from('orders').select('*').eq('id', id).single()
  if (error || !order) return null

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', id)
    .order('created_at', { ascending: true })

  if (itemsError) throw new Error(itemsError.message)

  return { ...(order as Order), items: (items ?? []) as OrderItem[] }
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
}