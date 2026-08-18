import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPublicProductBySlug, getPublicProducts, getPublicSettings } from '../services/store'
import type { PublicProduct, PublicProductDetail } from '../services/store'
import { friendlyError } from '../utils/errors'
import { formatCurrency } from '../utils/format'
import { useSeo } from '../hooks/useSeo'
import { useCart } from '../hooks/useCart'
import { useToast } from '../hooks/useToast'
import { trackAddToCart as trackTikTokAddToCart, trackViewContent as trackTikTokViewContent } from '../lib/tiktok'
import { trackAddToCart as trackMetaAddToCart, trackViewContent as trackMetaViewContent } from '../lib/meta'
import { trackAddToCart as trackAnalyticsAddToCart, trackViewItem as trackAnalyticsViewItem } from '../lib/analytics'
import { MinusIcon, PlusIcon, WhatsAppIcon, CheckIcon } from '../components/store/icons'
import { Alert } from '../components/ui/primitives'
import {
  buildWhatsAppHref,
  buildWhatsAppMessage,
  getWhatsAppTemplate,
} from '../lib/whatsapp'
import ProductCard from '../components/store/ProductCard'
import type { StoreSettings } from '../types'

function QuantityStepper({
  value,
  max,
  onChange,
  disabled = false,
}: {
  value: number
  max: number
  onChange: (next: number) => void
  disabled?: boolean
}) {
  const clamped = Math.max(1, Math.min(value, max))
  return (
    <div
      className="inline-flex items-center overflow-hidden rounded-xl border border-white/10 bg-surface-2"
      role="group"
      aria-label="Seleccionar cantidad"
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(1, clamped - 1))}
        disabled={disabled || clamped <= 1}
        aria-label="Disminuir cantidad"
        className="flex h-12 w-12 items-center justify-center text-ink transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <MinusIcon className="h-4 w-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={clamped}
        disabled={disabled}
        onChange={(e) => {
          const parsed = Number.parseInt(e.target.value, 10)
          onChange(Number.isNaN(parsed) ? 1 : Math.max(1, Math.min(max, parsed)))
        }}
        aria-label="Cantidad"
        className="h-12 w-14 border-x border-white/10 bg-transparent text-center text-base font-semibold text-ink outline-none focus:bg-gold/10"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, clamped + 1))}
        disabled={disabled || clamped >= max}
        aria-label="Aumentar cantidad"
        className="flex h-12 w-12 items-center justify-center text-ink transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
  )
}

function ProductDetail() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { addItem } = useCart()
  const { toast } = useToast()

  const [product, setProduct] = useState<PublicProductDetail | null>(null)
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [related, setRelated] = useState<PublicProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [mainIndex, setMainIndex] = useState(0)
  const [adding, setAdding] = useState(false)
  const timerRef = useRef<number | null>(null)

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
        if (product?.category_id) {
          const all = await getPublicProducts()
          if (mounted) {
            setRelated(
              all.filter((p) => p.id !== product.id && p.category_id === product.category_id).slice(0, 4),
            )
          }
        }
      } catch (err) {
        if (mounted) setError(friendlyError(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => {
      mounted = false
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [slug])

  const currency = settings?.currency ?? 'BOB'

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
        <div className="animate-pulse aspect-square w-full rounded-3xl bg-surface-2" />
        <div className="space-y-4">
          <div className="animate-pulse h-4 w-24 rounded-md bg-white/10" />
          <div className="animate-pulse h-8 w-3/4 rounded-md bg-white/10" />
          <div className="animate-pulse h-6 w-32 rounded-md bg-white/10" />
          <div className="animate-pulse h-40 w-full rounded-md bg-white/10" />
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
        <h1 className="text-2xl font-bold text-ink">Producto no encontrado</h1>
        <p className="text-sm text-ink-muted">
          El producto que buscas no existe o ya no está disponible.
        </p>
        <Link
          to="/"
          className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-night transition hover:bg-gold-light"
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
  const lowStock = !outOfStock && product.stock <= 5
  const discount =
    product.compare_price && product.compare_price > product.price
      ? Math.round((1 - product.price / product.compare_price) * 100)
      : null
  const whatsapp = settings?.whatsapp_number?.replace(/\D/g, '')

  function handleAddToCart() {
    if (!product || outOfStock || adding) return
    setAdding(true)
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
    timerRef.current = window.setTimeout(() => setAdding(false), 1400)
  }

  const stockBadge = outOfStock ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
      Agotado
    </span>
  ) : lowStock ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
      Últimas unidades · {product.stock} {product.stock === 1 ? 'disponible' : 'disponibles'}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
      <CheckIcon className="h-3.5 w-3.5" />
      Disponible
    </span>
  )

  const quantityChips = Array.from(
    { length: Math.min(product.stock, 5) },
    (_, index) => index + 1,
  )

  return (
    <div className="space-y-10">
      <nav aria-label="Migajas" className="flex flex-wrap items-center gap-1 text-sm text-ink-muted">
        <Link to="/" className="transition hover:text-gold">
          Inicio
        </Link>
        <span aria-hidden="true">/</span>
        {product.category ? (
          <>
            <Link to="/" className="transition hover:text-gold">
              {product.category.name}
            </Link>
            <span aria-hidden="true">/</span>
          </>
        ) : null}
        <span className="truncate font-medium text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-surface-2 shadow-xl shadow-black/30">
            {mainImage ? (
              <img
                src={mainImage}
                alt={product.name}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-3xl text-sm text-ink-muted/50">
                Sin imagen
              </div>
            )}
            {discount !== null && (
              <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-1 text-xs font-bold text-night shadow-sm">
                -{discount}%
              </span>
            )}
            {outOfStock && (
              <span className="absolute inset-0 flex items-center justify-center bg-night/80 text-lg font-bold uppercase tracking-wide text-ink">
                Agotado
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
                  aria-pressed={index === mainIndex}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-20 sm:w-20 ${
                    index === mainIndex
                      ? 'border-gold shadow-lg shadow-black/30'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          {product.category && (
            <Link
              to="/"
              className="text-sm font-semibold uppercase tracking-wide text-gold transition hover:text-gold-light hover:underline"
            >
              {product.category.name}
            </Link>
          )}
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-3xl font-bold text-ink">
              {formatCurrency(product.price, currency)}
            </span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-lg text-ink-muted line-through">
                {formatCurrency(product.compare_price, currency)}
              </span>
            )}
            {discount !== null && (
              <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold-light">
                Oferta -{discount}%
              </span>
            )}
          </div>

          <div className="mt-3">{stockBadge}</div>

          {product.short_description && (
            <p className="mt-4 leading-relaxed text-ink-muted">{product.short_description}</p>
          )}

          <div className="mt-7">
            <p className="mb-2 text-sm font-semibold text-ink">Cantidad</p>
            {outOfStock ? (
              <div className="rounded-xl bg-surface-2 px-4 py-3 text-sm font-medium text-ink-muted/70">
                No hay unidades disponibles.
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <QuantityStepper value={quantity} max={product.stock} onChange={setQuantity} />
                <span className="text-xs text-ink-muted">
                  Stock disponible: {product.stock}
                </span>
                {quantityChips.length > 1 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {quantityChips.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setQuantity(chip)}
                        aria-label={`Cantidad ${chip}`}
                        aria-pressed={quantity === chip}
                        className={`h-9 w-9 rounded-full text-sm font-semibold transition ${
                          quantity === chip
                            ? 'bg-gold text-night shadow-sm shadow-gold/20'
                            : 'bg-surface-2 text-ink-muted hover:bg-white/10 hover:text-ink'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={outOfStock || adding}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold shadow-sm transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: adding ? '#059669' : '#d4af37',
                color: adding ? '#ffffff' : '#0b0b0d',
              }}
            >
              {adding ? (
                <>
                  <CheckIcon className="h-4 w-4" />
                  Agregado
                </>
              ) : (
                <>
                  {outOfStock ? 'No disponible' : 'Agregar al carrito'}
                </>
              )}
            </button>
            {whatsapp && (
              <a
                href={buildWhatsAppHref(
                  whatsapp,
                  buildWhatsAppMessage(
                    getWhatsAppTemplate(settings?.whatsapp_messages, 'product_inquiry'),
                    {
                      product_name: product.name,
                      product_price: product.price,
                      product_url: window.location.href,
                      quantity: 1,
                      store_name: settings?.store_name ?? 'Mi Tienda',
                      store_phone: settings?.whatsapp_number ?? '',
                    },
                  ),
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-600 active:scale-[0.99]"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Pedir por WhatsApp
              </a>
            )}
          </div>

          {product.description && (
            <div className="mt-8 border-t border-white/10 pt-5">
              <h2 className="mb-2 font-semibold text-ink">Descripción</h2>
              <div className="whitespace-pre-line text-sm leading-relaxed text-ink-muted">
                {product.description}
              </div>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section aria-label="También te puede interesar">
          <div className="mb-5">
            <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
              También te puede interesar
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} currency={currency} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default ProductDetail