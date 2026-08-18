import { Link } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { formatCurrency } from '../../utils/format'
import { CloseIcon, MinusIcon, PlusIcon } from './icons'

type Props = {
  currency: string
  primaryColor: string
}

function CartDrawer({ currency, primaryColor }: Props) {
  const { items, isOpen, closeCart, setQuantity, removeItem, clear, subtotal } = useCart()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="animate-fade-in absolute inset-0 bg-slate-900/50"
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside
        className="animate-slide-in-right absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="font-semibold text-gray-900">
            Tu carrito ({items.length} {items.length === 1 ? 'artículo' : 'artículos'})
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Cerrar carrito"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm text-slate-500">Tu carrito está vacío.</p>
            <Link
              to="/"
              onClick={closeCart}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Ver productos
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-gray-100 overflow-y-auto">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-3 px-4 py-3">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 shrink-0 rounded-lg bg-slate-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/producto/${item.slug}`}
                      onClick={closeCart}
                      className="line-clamp-2 text-sm font-medium text-gray-900 hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatCurrency(item.price, currency)} c/u
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity(item.productId, item.quantity - 1)}
                        aria-label="Disminuir cantidad"
                        className="rounded-md border border-gray-300 p-1.5 text-slate-600 hover:bg-slate-100"
                      >
                        <MinusIcon className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        aria-label="Aumentar cantidad"
                        className="rounded-md border border-gray-300 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(item.price * item.quantity, currency)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="space-y-3 border-t border-gray-200 px-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(subtotal, currency)}
                </span>
              </div>
              <Link
                to="/checkout"
                onClick={closeCart}
                className="block rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Ir a checkout
              </Link>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={closeCart}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Continuar comprando
                </button>
                <button
                  type="button"
                  onClick={clear}
                  className="text-xs text-slate-400 hover:text-red-500"
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