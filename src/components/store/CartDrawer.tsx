import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { useWhatsAppOrder } from '../../hooks/useWhatsAppOrder'
import { formatCurrency } from '../../utils/format'
import { CloseIcon, MinusIcon, PlusIcon, PackageIcon, TrashIcon } from './icons'

type Props = {
  currency: string
  primaryColor: string
}

function CartDrawer({ currency, primaryColor }: Props) {
  const { items, isOpen, closeCart, setQuantity, removeItem, clear, subtotal } = useCart()
  const { creating, placeOrder } = useWhatsAppOrder()

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, closeCart])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="animate-fade-in absolute inset-0 bg-slate-900/50"
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside
        className="animate-slide-in-right absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            Tu carrito ({items.length} {items.length === 1 ? 'artículo' : 'artículos'})
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Cerrar carrito"
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <PackageIcon className="h-8 w-8" />
            </span>
            <h3 className="text-base font-semibold text-gray-900">Tu carrito está vacío</h3>
            <p className="max-w-xs text-sm text-slate-500">
              Explora nuestros productos y encuentra lo que necesitas.
            </p>
            <Link
              to="/"
              onClick={closeCart}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98]"
              style={{ backgroundColor: primaryColor }}
            >
              Ver productos
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-gray-100 overflow-y-auto">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-3 px-4 py-3.5">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-16 w-16 shrink-0 rounded-xl border border-gray-100 object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 shrink-0 rounded-xl bg-slate-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/producto/${item.slug}`}
                      onClick={closeCart}
                      className="line-clamp-2 text-sm font-medium text-gray-900 transition hover:text-indigo-600"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatCurrency(item.price, currency)} c/u
                    </p>
                    <div className="mt-2 inline-flex items-center rounded-lg border border-gray-300">
                      <button
                        type="button"
                        onClick={() => setQuantity(item.productId, item.quantity - 1)}
                        aria-label="Disminuir cantidad"
                        className="flex h-8 w-8 items-center justify-center rounded-l-lg text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
                        disabled={item.quantity <= 1}
                      >
                        <MinusIcon className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        aria-label="Aumentar cantidad"
                        className="flex h-8 w-8 items-center justify-center rounded-r-lg text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {item.quantity >= item.stock && (
                      <p className="mt-1 text-[11px] font-medium text-amber-600">
                        Máximo disponible: {item.stock}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(item.price * item.quantity, currency)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      aria-label={`Eliminar ${item.name} del carrito`}
                      className="rounded-lg p-1 text-slate-400 transition hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="space-y-3 border-t border-gray-200 px-5 py-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(subtotal, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Total</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(subtotal, currency)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void placeOrder()}
                disabled={creating}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-70 disabled:active:scale-100"
                style={{ backgroundColor: primaryColor }}
              >
                {creating ? 'Creando pedido...' : '💬 Pedir por WhatsApp'}
              </button>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={closeCart}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  Seguir comprando
                </button>
                <button
                  type="button"
                  onClick={clear}
                  className="text-xs text-slate-400 transition hover:text-red-500"
                >
                  Vaciar carrito
                </button>
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}

export default CartDrawer