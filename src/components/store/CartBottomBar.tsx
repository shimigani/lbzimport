import { useCart } from '../../hooks/useCart'
import { useWhatsAppOrder } from '../../hooks/useWhatsAppOrder'
import { formatCurrency } from '../../utils/format'
import { CartIcon } from './icons'

type Props = {
  currency: string
}

function CartBottomBar({ currency }: Props) {
  const { items, count, subtotal } = useCart()
  const { creating, placeOrder } = useWhatsAppOrder()

  if (items.length === 0) return null

  const unitLabel = count === 1 ? 'producto' : 'productos'
  const ariaLabel = `Pedir por WhatsApp (${count} ${unitLabel}, total ${formatCurrency(
    subtotal,
    currency,
  )})`

  return (
    <>
      <div aria-hidden="true" className="h-20 pb-[env(safe-area-inset-bottom)]" />
      <div className="animate-fade-in-up fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-xl px-4 pb-3">
          <div className="flex items-center gap-3 rounded-2xl border border-gold/25 bg-surface px-4 py-3 shadow-xl shadow-black/50">
            <div className="flex shrink-0 items-center gap-2">
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-gold">
                <CartIcon className="h-5 w-5" />
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-night">
                  {count}
                </span>
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-semibold text-ink">
                  {count} {unitLabel}
                </p>
                <p className="text-xs text-ink-muted">En tu carrito</p>
              </div>
            </div>

            <span className="ml-auto text-base font-bold text-gold-light sm:text-lg">
              {formatCurrency(subtotal, currency)}
            </span>

            <button
              type="button"
              onClick={() => void placeOrder()}
              disabled={creating}
              aria-label={ariaLabel}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gold px-4 py-3 text-sm font-semibold text-night shadow-sm shadow-gold/20 transition hover:bg-gold-light active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 sm:px-5"
            >
              {creating ? 'Creando pedido...' : '💬 Pedir por WhatsApp'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default CartBottomBar