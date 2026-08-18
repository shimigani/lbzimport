import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils/format'
import { useCart } from '../../hooks/useCart'
import { useToast } from '../../hooks/useToast'
import { trackAddToCart as trackTikTokAddToCart } from '../../lib/tiktok'
import { trackAddToCart as trackMetaAddToCart } from '../../lib/meta'
import { trackAddToCart as trackAnalyticsAddToCart } from '../../lib/analytics'
import { CartIcon } from './icons'
import type { PublicProduct } from '../../services/store'

type Props = {
  product: PublicProduct
  currency: string
  primaryColor: string
}

function ProductCard({ product, currency, primaryColor }: Props) {
  const { addItem, openCart } = useCart()
  const { toast } = useToast()

  const discount =
    product.compare_price && product.compare_price > product.price
      ? Math.round((1 - product.price / product.compare_price) * 100)
      : null
  const isOffer = product.compare_price != null && product.compare_price > product.price
  const outOfStock = product.stock <= 0

  function handleAdd(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock) return
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      imageUrl: product.image_url,
      quantity: 1,
      stock: product.stock,
    })
    trackTikTokAddToCart({
      content_id: product.id,
      content_name: product.name,
      quantity: 1,
      value: product.price,
      currency,
    })
    trackMetaAddToCart({
      content_ids: [product.id],
      content_name: product.name,
      value: product.price,
      currency,
      contents: [{ id: product.id, quantity: 1, item_price: product.price }],
    })
    trackAnalyticsAddToCart({
      currency,
      value: product.price,
      items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: 1 }],
    })
    toast('success', 'Producto agregado al carrito')
    openCart()
  }

  return (
    <div className="group animate-fade-in-up relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <Link
        to={`/producto/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-slate-100"
        aria-label={`Ver ${product.name}`}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-300">
            Sin imagen
          </div>
        )}
        {discount !== null && (
          <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
            -{discount}%
          </span>
        )}
        {isOffer && (
          <span
            className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-bold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Oferta
          </span>
        )}
        {outOfStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/75 text-sm font-semibold text-slate-700">
            Agotado
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <p className="text-xs text-slate-500">{product.category?.name}</p>
        <Link
          to={`/producto/${product.slug}`}
          className="line-clamp-2 min-h-10 text-sm font-medium text-gray-900 hover:underline"
        >
          {product.name}
        </Link>

        <div className="mt-auto pt-2">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-base font-bold text-gray-900">
              {formatCurrency(product.price, currency)}
            </span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-xs text-slate-400 line-through">
                {formatCurrency(product.compare_price, currency)}
              </span>
            )}
          </div>

          {outOfStock ? (
            <div className="mt-2 w-full rounded-lg bg-slate-100 px-3 py-2.5 text-center text-sm font-medium text-slate-400">
              Agotado
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              aria-label={`Agregar ${product.name} al carrito`}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98]"
              style={{ backgroundColor: primaryColor }}
            >
              <CartIcon className="h-4 w-4" />
              Agregar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductCard