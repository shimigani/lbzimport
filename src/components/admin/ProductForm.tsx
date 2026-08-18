import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Category, Product, ProductFormInput, ProductImage } from '../../types'
import { slugify } from '../../utils/slug'
import { validateProduct } from '../../utils/validators'
import { friendlyError } from '../../utils/errors'
import { Button, Input, Select, Textarea } from '../ui/primitives'
import { useToast } from '../../hooks/useToast'
import { ProductImages } from './ProductImages'
import { toGalleryImages } from '../../utils/gallery'
import type { GalleryImage } from '../../utils/gallery'
import {
  addProductImage,
  createProduct,
  deleteProductImage,
  listProductImages,
  updateProduct,
  updateImageSort,
  updateProductImageUrl,
} from '../../services/products'
import { deleteFile, pathFromUrl, PRODUCTS_BUCKET, uploadFile } from '../../services/storage'

type Props = {
  mode: 'create' | 'edit'
  product?: Product
  categories: Category[]
}

function toFields(product?: Product): ProductFormInput {
  if (!product) {
    return {
      name: '',
      slug: '',
      short_description: '',
      description: '',
      price: '',
      compare_price: '',
      cost_price: '',
      sku: '',
      stock: '0',
      category_id: '',
      active: true,
      featured: false,
    }
  }
  return {
    name: product.name,
    slug: product.slug,
    short_description: product.short_description ?? '',
    description: product.description ?? '',
    price: String(product.price),
    compare_price: product.compare_price != null ? String(product.compare_price) : '',
    cost_price: product.cost_price != null ? String(product.cost_price) : '',
    sku: product.sku ?? '',
    stock: String(product.stock),
    category_id: product.category_id ?? '',
    active: product.active,
    featured: product.featured,
  }
}

export function ProductForm({ mode, product, categories }: Props) {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [fields, setFields] = useState<ProductFormInput>(() => toFields(product))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [mainFile, setMainFile] = useState<File | null>(null)
  const [mainRemoved, setMainRemoved] = useState(false)
  const [images, setImages] = useState<GalleryImage[]>([])
  const [imagesLoading, setImagesLoading] = useState(mode === 'edit')
  const [removedImages, setRemovedImages] = useState<ProductImage[]>([])
  const [slugEdited, setSlugEdited] = useState(mode === 'edit')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (mode !== 'edit' || !product) return
    let active = true
    listProductImages(product.id)
      .then((loaded) => {
        if (active) setImages(toGalleryImages(loaded))
      })
      .catch(() => {
        toast('error', 'Error al cargar la galería del producto.')
      })
      .finally(() => {
        if (active) setImagesLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, product?.id])

  function setField<K extends keyof ProductFormInput>(key: K, value: ProductFormInput[K]) {
    setFields((current) => ({ ...current, [key]: value }))
  }

  function handleNameChange(value: string) {
    setField('name', value)
    if (!slugEdited) {
      setField('slug', slugify(value))
    }
  }

  function handleImagesChange(next: GalleryImage[]) {
    const nextKeys = new Set(next.map((i) => i.key))
    const removedNow = images
      .filter((i) => i.row && !nextKeys.has(i.key))
      .map((i) => i.row as ProductImage)
    if (removedNow.length > 0) {
      setRemovedImages((prev) => [...prev, ...removedNow])
    }
    setImages(next)
  }

  const existingMainUrl = mode === 'edit' && product && !mainRemoved ? product.image_url : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const validationErrors = validateProduct(fields)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    try {
      let productId: string
      if (mode === 'create') {
        const created = await createProduct(fields)
        productId = created.id
      } else if (product) {
        await updateProduct(product.id, fields)
        productId = product.id
      } else {
        throw new Error('Producto no disponible')
      }

      if (mainFile) {
        const { url, error } = await uploadFile(PRODUCTS_BUCKET, `products/${productId}`, mainFile)
        if (error) throw new Error(error)
        if (existingMainUrl) {
          const oldPath = pathFromUrl(PRODUCTS_BUCKET, existingMainUrl)
          if (oldPath) await deleteFile(PRODUCTS_BUCKET, oldPath)
        }
        await updateProductImageUrl(productId, url)
      } else if (mode === 'edit' && mainRemoved && product?.image_url) {
        const oldPath = pathFromUrl(PRODUCTS_BUCKET, product.image_url)
        if (oldPath) await deleteFile(PRODUCTS_BUCKET, oldPath)
        await updateProductImageUrl(productId, null)
      }

      for (const img of images.filter((i) => i.file)) {
        if (!img.file) continue
        const { url, error } = await uploadFile(
          PRODUCTS_BUCKET,
          `products/${productId}/gallery`,
          img.file,
        )
        if (error) throw new Error(error)
        await addProductImage(productId, url, img.sort_order)
      }

      for (const img of removedImages) {
        await deleteProductImage(img)
      }

      for (let index = 0; index < images.length; index += 1) {
        const img = images[index]
        if (img.id && img.sort_order !== index) {
          await updateImageSort(img.id, index)
        }
      }

      toast(
        'success',
        mode === 'create' ? 'Producto creado correctamente.' : 'Producto actualizado correctamente.',
      )
      navigate('/admin/products')
    } catch (err) {
      toast('error', `Error al guardar el producto: ${friendlyError(err)}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Información básica</h3>
            <div className="space-y-4">
              <Input
                label="Nombre"
                placeholder="Ej. Camiseta básica"
                value={fields.name}
                error={errors.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
              <Input
                label="Slug"
                placeholder="ej. camiseta-basica"
                value={fields.slug}
                error={errors.slug}
                onChange={(e) => {
                  setSlugEdited(true)
                  setField('slug', e.target.value)
                }}
              />
              <Textarea
                label="Descripción corta"
                rows={2}
                value={fields.short_description}
                onChange={(e) => setField('short_description', e.target.value)}
              />
              <Textarea
                label="Descripción completa"
                rows={5}
                value={fields.description}
                onChange={(e) => setField('description', e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Precios e inventario</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Precio (Bs.)"
                type="number"
                min="0"
                step="0.01"
                value={fields.price}
                error={errors.price}
                onChange={(e) => setField('price', e.target.value)}
              />
              <Input
                label="Precio anterior (Bs.)"
                type="number"
                min="0"
                step="0.01"
                value={fields.compare_price}
                error={errors.compare_price}
                onChange={(e) => setField('compare_price', e.target.value)}
              />
              <Input
                label="Costo (Bs.)"
                type="number"
                min="0"
                step="0.01"
                value={fields.cost_price}
                error={errors.cost_price}
                onChange={(e) => setField('cost_price', e.target.value)}
              />
              <Input
                label="SKU"
                placeholder="Opcional"
                value={fields.sku}
                onChange={(e) => setField('sku', e.target.value)}
              />
              <Input
                label="Stock"
                type="number"
                min="0"
                step="1"
                value={fields.stock}
                error={errors.stock}
                onChange={(e) => setField('stock', e.target.value)}
              />
              <Select
                label="Categoría"
                value={fields.category_id}
                onChange={(e) => setField('category_id', e.target.value)}
              >
                <option value="">Sin categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Galería de imágenes</h3>
            {imagesLoading ? (
              <p className="text-sm text-slate-500">Cargando imágenes…</p>
            ) : (
              <ProductImages images={images} onChange={handleImagesChange} />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Imagen principal</h3>
            <div className="flex flex-col items-center gap-3">
              <div className="relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                {mainFile ? (
                  <img
                    src={URL.createObjectURL(mainFile)}
                    alt="Imagen principal"
                    className="h-full w-full object-cover"
                  />
                ) : existingMainUrl ? (
                  <img
                    src={existingMainUrl}
                    alt="Imagen principal"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-slate-400">Sin imagen</span>
                )}
              </div>
              <div className="flex gap-2">
                <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  {existingMainUrl || mainFile ? 'Reemplazar' : 'Subir'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setMainFile(file)
                        setMainRemoved(false)
                      }
                      e.target.value = ''
                    }}
                  />
                </label>
                {(existingMainUrl || mainFile) && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setMainFile(null)
                      setMainRemoved(true)
                    }}
                  >
                    Quitar
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-500">JPG, PNG, WebP o GIF · Máximo 5 MB.</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Publicación</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={fields.active}
                  onChange={(e) => setField('active', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Producto activo
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={fields.featured}
                  onChange={(e) => setField('featured', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Destacado
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => navigate('/admin/products')}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {mode === 'create' ? 'Crear producto' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}