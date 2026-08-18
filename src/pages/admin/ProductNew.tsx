import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Category } from '../../types'
import { listCategories } from '../../services/categories'
import { friendlyError } from '../../utils/errors'
import { PageHeader, Alert, Skeleton } from '../../components/ui/primitives'
import { ProductForm } from '../../components/admin/ProductForm'

export function ProductNew() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    listCategories()
      .then((data) => {
        if (active) setCategories(data)
      })
      .catch((err) => {
        if (active) setError(friendlyError(err))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div>
      <PageHeader
        title="Nuevo producto"
        description="Completa la información para crear un producto."
        action={
          <Link to="/admin/products" className="text-sm font-medium text-indigo-600 hover:underline">
            ← Volver a productos
          </Link>
        }
      />
      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}
      {loading ? (
        <Skeleton className="h-96" />
      ) : (
        <ProductForm mode="create" categories={categories} />
      )}
    </div>
  )
}