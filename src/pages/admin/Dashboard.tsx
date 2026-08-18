import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Order, OrderStatus, Product } from '../../types'
import { formatCurrency, formatDate } from '../../utils/format'
import { orderStatusLabel, orderStatusTone } from '../../utils/orderStatus'
import { Alert, Badge, Card, CardHeader, EmptyState, Skeleton } from '../../components/ui/primitives'
import { friendlyError } from '../../utils/errors'
import {
  BanknoteIcon,
  BoxesIcon,
  CheckIcon,
  ClipboardIcon,
  TagIcon,
} from '../../components/store/icons'

type Stats = {
  totalProducts: number
  activeProducts: number
  outOfStock: number
  pendingOrders: number
  completedOrders: number
  totalSales: number
}

function StatCard({
  label,
  value,
  icon,
  iconClass,
  valueClass,
}: {
  label: string
  value: string
  icon: ReactNode
  iconClass: string
  valueClass?: string
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <p className={`mt-1 text-2xl font-bold ${valueClass ?? 'text-slate-900'}`}>{value}</p>
      </div>
    </Card>
  )
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [lowStock, setLowStock] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [{ data: products }, { data: orders }] = await Promise.all([
          supabase.from('products').select('id, name, slug, image_url, stock, active'),
          supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200),
        ])

        if (!active) return

        const allProducts = (products ?? []) as Product[]
        const allOrders = (orders ?? []) as Order[]

        const salesStatuses: OrderStatus[] = ['paid', 'shipped', 'completed']
        const totalSales = allOrders
          .filter((o) => salesStatuses.includes(o.status))
          .reduce((sum, o) => sum + Number(o.total), 0)

        setStats({
          totalProducts: allProducts.length,
          activeProducts: allProducts.filter((p) => p.active).length,
          outOfStock: allProducts.filter((p) => p.stock <= 0).length,
          pendingOrders: allOrders.filter((o) => o.status === 'pending').length,
          completedOrders: allOrders.filter((o) => o.status === 'completed').length,
          totalSales,
        })

        setRecentOrders(allOrders.slice(0, 5))
        setLowStock(
          allProducts
            .filter((p) => p.stock > 0 && p.stock <= 5)
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 5),
        )
      } catch (err) {
        if (active) setError(friendlyError(err))
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-0.5 text-sm text-slate-500">Resumen general de tu tienda.</p>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Productos totales"
          value={String(stats?.totalProducts ?? 0)}
          icon={<BoxesIcon className="h-5 w-5" />}
          iconClass="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          label="Pedidos pendientes"
          value={String(stats?.pendingOrders ?? 0)}
          icon={<ClipboardIcon className="h-5 w-5" />}
          iconClass="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Pedidos completados"
          value={String(stats?.completedOrders ?? 0)}
          icon={<CheckIcon className="h-5 w-5" />}
          iconClass="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Productos sin stock"
          value={String(stats?.outOfStock ?? 0)}
          icon={<TagIcon className="h-5 w-5" />}
          iconClass="bg-red-50 text-red-600"
          valueClass="text-red-600"
        />
        <StatCard
          label="Ventas totales"
          value={formatCurrency(stats?.totalSales ?? 0)}
          icon={<BanknoteIcon className="h-5 w-5" />}
          iconClass="bg-violet-50 text-violet-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Pedidos recientes"
            action={
              <Link to="/admin/orders" className="text-xs font-medium text-indigo-600 hover:underline">
                Ver todos
              </Link>
            }
          />
          {recentOrders.length === 0 ? (
            <EmptyState
              title="Aún no hay pedidos"
              description="Cuando un cliente realice su primer pedido aparecerá aquí."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    to={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800">{order.order_number}</p>
                      <p className="truncate text-xs text-slate-500">{order.customer_name}</p>
                      <p className="text-xs text-slate-400">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold text-slate-800">
                        {formatCurrency(order.total)}
                      </span>
                      <Badge tone={orderStatusTone(order.status)}>{orderStatusLabel(order.status)}</Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Productos con stock bajo"
            action={
              <Link to="/admin/products" className="text-xs font-medium text-indigo-600 hover:underline">
                Ver productos
              </Link>
            }
          />
          {lowStock.length === 0 ? (
            <EmptyState
              title="Sin productos con stock bajo"
              description="Todos los productos tienen inventario suficiente."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {lowStock.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                        —
                      </span>
                    )}
                    <p className="truncate text-sm font-medium text-slate-800">{product.name}</p>
                  </div>
                  <Badge tone={product.stock === 0 ? 'red' : 'amber'}>
                    {product.stock === 0 ? 'Sin stock' : `${product.stock} uds.`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}