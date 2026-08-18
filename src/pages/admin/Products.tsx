import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../../types'
import { formatCurrency } from '../../utils/format'
import { friendlyError } from '../../utils/errors'
import {
  deleteProduct,
  listProducts,
  toggleProductActive,
} from '../../services/products'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Skeleton,
} from '../../components/ui/primitives'
import { ConfirmDialog } from '../../components/ui/Modal'
import { useToast } from '../../hooks/useToast'
import { SearchIcon } from '../../components/store/icons'

type StatusFilter = 'all' | 'active' | 'inactive' | 'out' | 'low'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'out', label: 'Sin stock' },
  { value: 'low', label: 'Stock bajo' },
]

function statusBadge(product: Product) {
  if (!product.active) return <Badge tone="slate">Inactivo</Badge>
  if (product.stock <= 0) return <Badge tone="red">Agotado</Badge>
  if (product.stock <= 5) return <Badge tone="amber">Stock bajo</Badge>
  return <Badge tone="green">Activo</Badge>
}

export function Products() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setProducts(await listProducts())
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const categories = useMemo(() => {
    const map = new Map<string, string>()
    for (const product of products) {
      if (product.category_id && product.category?.name) {
        map.set(product.category_id, product.category.name)
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [products])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return products.filter((product) => {
      const okSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        (product.slug?.toLowerCase().includes(term) ?? false)
      const okCategory = categoryFilter === 'all' || product.category_id === categoryFilter
      let okStatus = true
      switch (statusFilter) {
        case 'active':
          okStatus = product.active
          break
        case 'inactive':
          okStatus = !product.active
          break
        case 'out':
          okStatus = product.stock <= 0
          break
        case 'low':
          okStatus = product.stock > 0 && product.stock <= 5
          break
      }
      return okSearch && okCategory && okStatus
    })
  }, [products, search, categoryFilter, statusFilter])

  async function handleToggle(product: Product) {
    setTogglingId(product.id)
    try {
      await toggleProductActive(product.id, !product.active)
      toast('success', product.active ? 'Producto desactivado.' : 'Producto activado.')
      await load()
    } catch (err) {
      toast('error', friendlyError(err))
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteProduct(deleteTarget.id)
      toast('success', 'Producto eliminado correctamente.')
      setDeleteTarget(null)
      await load()
    } catch (err) {
      toast('error', `Error al eliminar el producto: ${friendlyError(err)}`)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-72" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Productos"
        description="Administra el catálogo de tu tienda."
        action={
          <Link to="/admin/products/new">
            <Button>+ Nuevo producto</Button>
          </Link>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="relative sm:col-span-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <SearchIcon className="h-4 w-4" />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            aria-label="Buscar productos"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filtrar por categoría"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="all">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          aria-label="Filtrar por estado"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <Card>
        {products.length === 0 ? (
          <EmptyState
            title="Aún no hay productos"
            description="Crea tu primer producto para comenzar a vender."
            action={
              <Link to="/admin/products/new">
                <Button>+ Nuevo producto</Button>
              </Link>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Sin resultados"
            description="No hay productos que coincidan con los filtros seleccionados."
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-medium">Producto</th>
                    <th className="px-3 py-3 font-medium">Categoría</th>
                    <th className="px-3 py-3 font-medium">Precio</th>
                    <th className="px-3 py-3 font-medium">Stock</th>
                    <th className="px-3 py-3 font-medium">Estado</th>
                    <th className="px-3 py-3 font-medium">Destacado</th>
                    <th className="px-5 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((product) => (
                    <tr key={product.id} className="transition hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-11 w-11 rounded-lg object-cover"
                            />
                          ) : (
                            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                              —
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800">{product.name}</p>
                            <p className="truncate text-xs text-slate-500">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {product.category?.name ?? <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-800">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-3 py-3">
                        {product.stock === 0 ? (
                          <Badge tone="red">Sin stock</Badge>
                        ) : product.stock <= 5 ? (
                          <Badge tone="amber">{product.stock}</Badge>
                        ) : (
                          <span className="text-slate-600">{product.stock}</span>
                        )}
                      </td>
                      <td className="px-3 py-3">{statusBadge(product)}</td>
                      <td className="px-3 py-3">
                        {product.featured ? (
                          <Badge tone="violet">★ Destacado</Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/products/${product.id}/edit`}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
                          >
                            Editar
                          </Link>
                          <button
                            type="button"
                            onClick={() => void handleToggle(product)}
                            disabled={togglingId === product.id}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                          >
                            {product.active ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(product)}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-100 md:hidden">
              {filtered.map((product) => (
                <li key={product.id} className="flex gap-3 p-4">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                      —
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-slate-800">{product.name}</p>
                      <span className="shrink-0 font-semibold text-slate-800">
                        {formatCurrency(product.price)}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {statusBadge(product)}
                      <span className="text-xs text-slate-500">
                        Stock: {product.stock}
                        {product.featured ? ' · Destacado' : ''}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Link
                        to={`/admin/products/${product.id}/edit`}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleToggle(product)}
                        disabled={togglingId === product.id}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                      >
                        {product.active ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(product)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar producto"
        message={`¿Seguro que quieres eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer. Los pedidos históricos conservarán su información.`}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}