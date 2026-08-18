import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPublicProductBySlug, getPublicSettings } from '../services/store'
import type { PublicProductDetail } from '../services/store'
import { friendlyError } from '../utils/errors'
import { formatCurrency } from '../utils/format'
import { DEFAULT_PRIMARY } from '../utils/theme'
import { useSeo } from '../hooks/useSeo'
import { useCart } from '../hooks/useCart'
import { useToast } from '../hooks/useToast'
import { trackAddToCart as trackTikTokAddToCart, trackViewContent as trackTikTokViewContent } from '../lib/tiktok'
import { trackAddToCart as trackMetaAddToCart, trackViewContent as trackMetaViewContent } from '../lib/meta'
import { trackAddToCart as trackAnalyticsAddToCart, trackViewItem as trackAnalyticsViewItem } from '../lib/analytics'
import { MinusIcon, PlusIcon, WhatsAppIcon } from '../components/store/icons'
import { Alert, Skeleton } from '../components/ui/primitives'
import type { StoreSettings } from '../types'

function ProductDetail() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { addItem, openCart } = useCart()
  const { toast } = useToast()

  const [product, setProduct] = useState<PublicProductDetail | null>(null)
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [mainIndex, setMainIndex] = useState(0)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setProduct(null)
    setError(null)
    setQuantity(1)
    setMainIndex(0)
    async function load() {
      try {
        const [product, settings] = await Promise.all([
          getPublicProductBySlug(slug),
          getPublicSettings(),
        ])
        if (!mounted) return
        setProduct(product)
        setSettings(settings)
      } catch (err) {
        if (mounted) setError(friendlyError(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => {
      mounted = false
    }
  }, [slug])

  const currency = settings?.currency ?? 'BOB'
  const primary = settings?.primary_color ?? DEFAULT_PRIMARY

  useSeo({
    title: product ? `${product.name} | ${settings?.store_name ?? 'Mi Tienda'}` : 'Producto',
    description: product?.short_description ?? undefined,
    image: product?.image_url ?? settings?.social_image_url ?? undefined,
    canonical: product ? `${window.location.origin}/producto/${product.slug}` : undefined,
  })

  useEffect(() => {
    if (!product) return
    trackTikTokViewContent({
      content_id: product.id,
      content_name: product.name,
      value: product.price,
      currency,
    })
    trackMetaViewContent({
      content_ids: [product.id],
      content_name: product.name,
      value: product.price,
      currency,
    })
    trackAnalyticsViewItem({
      currency,
      value: product.price,
      items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: 1 }],
    })
  }, [product, currency])

  if (loading) {
    return (
      <div className="grid gap-8 md:grid-cols-2">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return <Alert tone="error">{error}</Alert>
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Producto no encontrado</h1>
        <p className="text-sm text-slate-600">
          El producto que buscas no existe o ya no está disponible.
        </p>
        <Link
          to="/"
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: primary }}
        >
          Volver a la tienda
        </Link>
      </div>
    )
  }

  const gallery = product.images.length > 0 ? product.images.map((i) => i.image_url) : []
  if (product.image_url && !gallery.includes(product.image_url)) {
    gallery.unshift(product.image_url)
  }
  const mainImage = gallery[mainIndex] ?? product.image_url
  const outOfStock = product.stock <= 0
  const discount =
    product.compare_price && product.compare_price > product.price
      ? Math.round((1 - product.price / product.compare_price) * 100)
      : null
  const whatsapp = settings?.whatsapp_number?.replace(/\D/g, '')

  function handleAddToCart() {
    if (!product || outOfStock) return
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      imageUrl: product.image_url,
      quantity,
      stock: product.stock,
    })
    trackTikTokAddToCart({
      content_id: product.id,
      content_name: product.name,
      quantity,
      value: product.price * quantity,
      currency,
    })
    trackMetaAddToCart({
      content_ids: [product.id],
      content_name: product.name,
      value: product.price * quantity,
      currency,
      contents: [{ id: product.id, quantity, item_price: product.price }],
    })
    trackAnalyticsAddToCart({
      currency,
      value: product.price * quantity,
      items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity }],
    })
    toast('success', 'Producto agregado al carrito')
    openCart()
  }

  return (
    <div className="space-y-6">
      <nav aria-label="Migajas" className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-900">
          Inicio
        </Link>
        <span aria-hidden="true">/</span>
        {product.category ? (
          <>
            <Link to="/" className="hover:text-slate-900">
              {product.category.name}
            </Link>
            <span aria-hidden="true">/</span>
          </>
        ) : null}
        <span className="truncate font-medium text-slate-800">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-slate-100">
            {mainImage ? (
              <img
                src={mainImage}
                alt={product.name}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-2xl text-sm text-slate-300">
                Sin imagen
              </div>
            )}
            {discount !== null && (
              <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
                -{discount}%
              </span>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {gallery.map((url, index) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setMainIndex(index)}
                  aria-label={`Ver imagen ${index + 1}`}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 sm:h-20 sm:w-20 ${
                    index === mainIndex ? 'border-indigo-500' : 'border-gray-200 hover:border-slate-300'
                  }`}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.category && (
            <Link to="/" className="text-sm font-medium hover:underline" style={{ color: primary }}>
              {product.category.name}
            </Link>
          )}
          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">
              {formatCurrency(product.price, currency)}
            </span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-lg text-slate-400 line-through">
                {formatCurrency(product.compare_price, currency)}
              </span>
            )}
            {discount !== null && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                Oferta -{discount}%
              </span>
            )}
          </div>

          <p className="mt-3 text-sm">
            {outOfStock ? (
              <span className="font-medium text-red-600">Agotado</span>
            ) : product.stock <= 5 ? (
              <span className="font-medium text-amber-600">Quedan {product.stock} unidades</span>
            ) : (
              <span className="font-medium text-emerald-600">Disponible</span>
            )}
          </p>

          {product.short_description && (
            <p className="mt-4 text-slate-600">{product.short_description}</p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            {!outOfStock && (
              <div className="flex items-center justify-between rounded-lg border border-gray-300 sm:justify-start">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Disminuir cantidad"
                  className="p-3 text-slate-600 hover:bg-slate-100"
                >
                  <MinusIcon className="h-5 w-5" />
                </button>
                <span className="w-12 text-center font-semibold text-gray-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  aria-label="Aumentar cantidad"
                  className="p-3 text-slate-600 hover:bg-slate-100"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-semibold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: primary }}
            >
              {outOfStock ? 'No disponible' : 'Agregar al carrito'}
            </button>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                  `Hola, me interesa el producto "${product.name}" (${formatCurrency(
                    product.price,
                    currency,
                  )}). ¿Está disponible?`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-600 active:scale-[0.99]"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Pedir por WhatsApp
              </a>
            )}
          </div>

          {product.description && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h2 className="mb-2 font-semibold text-gray-900">Descripción</h2>
              <div className="whitespace-pre-line text-sm text-slate-600">
                {product.description}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductDetail