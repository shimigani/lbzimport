import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils/format'
import { useCart } from '../../hooks/useCart'
import { useToast } from '../../hooks/useToast'
import { trackAddToCart as trackTikTokAddToCart } from '../../lib/tiktok'
import { trackAddToCart as trackMetaAddToCart } from '../../lib/meta'
import { trackAddToCart as trackAnalyticsAddToCart } from '../../lib/analytics'
import { CartIcon, CheckIcon, MinusIcon, PlusIcon } from './icons'
import type { PublicProduct } from '../../services/store'

type Props = {
  product: PublicProduct
  currency: string
}

function ProductCard({ product, currency }: Props) {
  const { addItem } = useCart()
  const { toast } = useToast()
  const [adding, setAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  const discount =
    product.compare_price && product.compare_price > product.price
      ? Math.round((1 - product.price / product.compare_price) * 100)
      : null
  const isOffer = product.compare_price != null && product.compare_price > product.price
  const outOfStock = product.stock <= 0
  const lowStock = !outOfStock && product.stock <= 5
  const maxReached = quantity >= product.stock

  function decrease() {
    setQuantity((prev) => Math.max(1, prev - 1))
  }

  function increase() {
    setQuantity((prev) => Math.min(product.stock, prev + 1))
  }

  function handleAdd(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock || adding) return
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
    setQuantity(1)
    timerRef.current = window.setTimeout(() => setAdding(false), 1400)
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-lg shadow-black/30 transition duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-xl hover:shadow-black/40">
      <Link
        to={`/producto/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-surface-2"
        aria-label={`Ver ${product.name}`}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-ink-muted/50">
            Sin imagen
          </div>
        )}
        {discount !== null && (
          <span className="absolute left-2 top-2 rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-night shadow-sm">
            -{discount}%
          </span>
        )}
        {isOffer && !outOfStock && (
          <span className="absolute right-2 top-2 rounded-full border border-gold/40 bg-night/80 px-2 py-0.5 text-xs font-bold text-gold-light shadow-sm">
            Oferta
          </span>
        )}
        {outOfStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-night/80 text-sm font-semibold uppercase tracking-wide text-ink">
            Agotado
          </span>
        )}
        {lowStock && (
          <span className="absolute bottom-2 left-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
            Últimas unidades
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <p className="text-xs text-ink-muted/70">{product.category?.name ?? 'General'}</p>
        <Link
          to={`/producto/${product.slug}`}
          className="line-clamp-2 min-h-10 text-sm font-medium text-ink transition hover:text-gold-light"
        >
          {product.name}
        </Link>

        <div className="mt-auto pt-2">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-base font-bold text-ink">
              {formatCurrency(product.price, currency)}
            </span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-xs text-ink-muted/70 line-through">
                {formatCurrency(product.compare_price, currency)}
              </span>
            )}
          </div>

          {outOfStock ? (
            <div className="mt-2 w-full rounded-lg bg-surface-2 px-3 py-2.5 text-center text-sm font-semibold text-ink-muted/60">
              Agotado
            </div>
          ) : (
            <>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center overflow-hidden rounded-lg border border-white/10 bg-surface-2">
                  <button
                    type="button"
                    onClick={decrease}
                    disabled={quantity <= 1}
                    aria-label="Disminuir cantidad"
                    className="flex h-8 w-8 items-center justify-center text-ink transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-ink-muted/40"
                  >
                    <MinusIcon className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-ink">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={increase}
                    disabled={maxReached}
                    aria-label="Aumentar cantidad"
                    className="flex h-8 w-8 items-center justify-center text-ink transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-ink-muted/40"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
                {maxReached && (
                  <span className="text-[11px] font-medium text-amber-300/90">
                    Máximo disponible
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleAdd}
                disabled={adding}
                aria-label={`Agregar ${product.name} al carrito`}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-gold px-3 py-2.5 text-sm font-semibold text-night transition hover:bg-gold-light active:scale-[0.98] disabled:opacity-90"
                style={adding ? { backgroundColor: '#059669' } : undefined}
              >
                {adding ? <CheckIcon className="h-4 w-4" /> : <CartIcon className="h-4 w-4" />}
                {adding ? (
                  <span className="text-white">Agregado</span>
                ) : (
                  'Agregar'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductCard