import { useCallback, useEffect, useState } from 'react'
import type { Category } from '../../types'
import { friendlyError } from '../../utils/errors'
import {
  deleteCategory,
  listCategories,
  toggleCategoryActive,
} from '../../services/categories'
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
import { CategoryFormModal } from '../../components/admin/CategoryFormModal'

export function Categories() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCategories(await listCategories())
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleToggle(category: Category) {
    try {
      await toggleCategoryActive(category.id, !category.active)
      toast('success', category.active ? 'Categoría desactivada.' : 'Categoría activada.')
      await load()
    } catch (err) {
      toast('error', friendlyError(err))
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteCategory(deleteTarget)
      toast('success', 'Categoría eliminada correctamente.')
      setDeleteTarget(null)
      await load()
    } catch (err) {
      toast('error', `Error al eliminar la categoría: ${friendlyError(err)}`)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Categorías"
        description="Organiza tus productos por categorías."
        action={<Button onClick={() => { setEditing(null); setFormOpen(true) }}>+ Nueva categoría</Button>}
      />

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <Card>
          {categories.length === 0 ? (
            <EmptyState
              title="Aún no hay categorías"
              description="Crea tu primera categoría para organizar los productos."
              action={
                <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
                  + Nueva categoría
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-medium">Categoría</th>
                    <th className="px-3 py-3 font-medium">Slug</th>
                    <th className="px-3 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {category.image_url ? (
                            <img
                              src={category.image_url}
                              alt={category.name}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                              —
                            </span>
                          )}
                          <span className="font-medium text-slate-800">{category.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{category.slug}</td>
                      <td className="px-3 py-3">
                        {category.active ? (
                          <Badge tone="green">Activa</Badge>
                        ) : (
                          <Badge tone="slate">Inactiva</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => { setEditing(category); setFormOpen(true) }}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleToggle(category)}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                          >
                            {category.active ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(category)}
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
      )}

      <CategoryFormModal
        open={formOpen}
        category={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => void load()}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar categoría"
        message={`¿Seguro que quieres eliminar la categoría "${deleteTarget?.name}"? Los productos de esa categoría quedarán sin categoría, no se eliminarán.`}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}