import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { SearchIcon } from '../../components/store/icons'

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [status, setStatus] = useState<OrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')
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

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return orders
    return orders.filter(
      (order) =>
        order.order_number.toLowerCase().includes(term) ||
        order.customer_name.toLowerCase().includes(term) ||
        order.customer_phone.toLowerCase().includes(term),
    )
  }, [orders, search])

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

      <div className="relative mb-4 max-w-sm">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
          <SearchIcon className="h-4 w-4" />
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por número, cliente o teléfono..."
          aria-label="Buscar pedidos"
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {loading ? (
        <Skeleton className="h-72" />
      ) : (
        <Card>
          {filtered.length === 0 ? (
            <EmptyState
              title={search ? 'Sin resultados' : 'No hay pedidos'}
              description={
                search
                  ? 'No hay pedidos que coincidan con la búsqueda.'
                  : status === 'all'
                    ? 'Aún no se han recibido pedidos en la tienda.'
                    : `No hay pedidos con estado "${orderStatusLabel(status)}".`
              }
            />
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3 font-medium">Número</th>
                      <th className="px-3 py-3 font-medium">Cliente</th>
                      <th className="px-3 py-3 font-medium">Teléfono</th>
                      <th className="px-3 py-3 font-medium">Total</th>
                      <th className="px-3 py-3 font-medium">Estado</th>
                      <th className="px-5 py-3 font-medium">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((order) => (
                      <tr key={order.id} className="transition hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="font-medium text-indigo-600 transition hover:underline"
                          >
                            {order.order_number}
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-slate-800">{order.customer_name}</td>
                        <td className="px-3 py-3 text-slate-600">{order.customer_phone}</td>
                        <td className="px-3 py-3 font-medium text-slate-800">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="px-3 py-3">
                          <Badge tone={orderStatusTone(order.status)}>
                            {orderStatusLabel(order.status)}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-slate-500">{formatDate(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-slate-100 md:hidden">
                {filtered.map((order) => (
                  <li key={order.id}>
                    <Link to={`/admin/orders/${order.id}`} className="block p-4 transition hover:bg-slate-50">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-indigo-600">{order.order_number}</p>
                        <Badge tone={orderStatusTone(order.status)}>
                          {orderStatusLabel(order.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-800">{order.customer_name}</p>
                      <p className="text-xs text-slate-500">
                        {order.customer_phone} · {formatDate(order.created_at)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {formatCurrency(order.total)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      )}
    </div>
  )
}