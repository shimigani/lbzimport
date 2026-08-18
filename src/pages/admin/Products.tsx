import { useCallback, useEffect, useState } from 'react'
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

export function Products() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

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
        ) : (
          <div className="overflow-x-auto">
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
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
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
                    <td className="px-3 py-3">
                      {product.active ? (
                        <Badge tone="green">Activo</Badge>
                      ) : (
                        <Badge tone="slate">Inactivo</Badge>
                      )}
                    </td>
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
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                        >
                          Editar
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleToggle(product)}
                          disabled={togglingId === product.id}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                        >
                          {product.active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(product)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
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