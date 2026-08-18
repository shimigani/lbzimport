import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Order, OrderStatus } from '../../types'
import { formatCurrency, formatDate } from '../../utils/format'
import { friendlyError } from '../../utils/errors'
import { ORDER_STATUSES, orderStatusLabel, orderStatusTone } from '../../utils/orderStatus'
import { listOrders } from '../../services/orders'
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  PageHeader,
  Select,
  Skeleton,
} from '../../components/ui/primitives'

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [status, setStatus] = useState<OrderStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setOrders(await listOrders(status))
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div>
      <PageHeader
        title="Pedidos"
        description="Gestiona los pedidos de tus clientes."
        action={
          <div className="w-48">
            <Select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | 'all')}>
              <option value="all">Todos los estados</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-72" />
      ) : (
        <Card>
          {orders.length === 0 ? (
            <EmptyState
              title="No hay pedidos"
              description={
                status === 'all'
                  ? 'Aún no se han recibido pedidos en la tienda.'
                  : `No hay pedidos con estado "${orderStatusLabel(status)}".`
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-medium">Número</th>
                    <th className="px-3 py-3 font-medium">Cliente</th>
                    <th className="px-3 py-3 font-medium">Teléfono</th>
                    <th className="px-3 py-3 font-medium">Ciudad</th>
                    <th className="px-3 py-3 font-medium">Total</th>
                    <th className="px-3 py-3 font-medium">Estado</th>
                    <th className="px-3 py-3 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="font-medium text-indigo-600 hover:underline"
                        >
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-slate-800">{order.customer_name}</td>
                      <td className="px-3 py-3 text-slate-600">{order.customer_phone}</td>
                      <td className="px-3 py-3 text-slate-600">{order.city || '—'}</td>
                      <td className="px-3 py-3 font-medium text-slate-800">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={orderStatusTone(order.status)}>
                          {orderStatusLabel(order.status)}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-slate-500">{formatDate(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}