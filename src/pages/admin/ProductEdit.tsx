import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Category, Product } from '../../types'
import { listCategories } from '../../services/categories'
import { getProduct } from '../../services/products'
import { friendlyError } from '../../utils/errors'
import { PageHeader, Alert, Skeleton } from '../../components/ui/primitives'
import { ProductForm } from '../../components/admin/ProductForm'

export function ProductEdit() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let active = true
    Promise.all([getProduct(id), listCategories()])
      .then(([prod, cats]) => {
        if (!active) return
        setProduct(prod)
        setCategories(cats)
        if (!prod) setError('No se encontró el producto.')
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
  }, [id])

  return (
    <div>
      <PageHeader
        title="Editar producto"
        description="Actualiza la información del producto."
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
      ) : product ? (
        <ProductForm mode="edit" product={product} categories={categories} />
      ) : (
        !error && (
          <Alert tone="info">No se encontró el producto solicitado.</Alert>
        )
      )}
    </div>
  )
}