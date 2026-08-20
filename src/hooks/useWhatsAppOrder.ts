import { useCallback, useRef, useState } from 'react'
import { useCart } from './useCart'
import { useToast } from './useToast'
import { createStoreOrder, getPublicSettings } from '../services/store'
import { friendlyError } from '../utils/errors'
import { formatCurrency } from '../utils/format'
import {
  buildWhatsAppHref,
  buildWhatsAppMessage,
  formatProductLines,
  getWhatsAppTemplate,
} from '../lib/whatsapp'
import {
  trackCompletePayment as trackTikTokCompletePayment,
  trackInitiateCheckout as trackTikTokInitiateCheckout,
} from '../lib/tiktok'
import {
  trackInitiateCheckout as trackMetaInitiateCheckout,
  trackPurchase as trackMetaPurchase,
} from '../lib/meta'
import {
  trackBeginCheckout as trackAnalyticsBeginCheckout,
  trackPurchase as trackAnalyticsPurchase,
} from '../lib/analytics'

// Evita pedidos duplicados incluso si se pulsan los dos botones
// (barra inferior y vista del carrito) al mismo tiempo.
let orderInFlight = false

export function useWhatsAppOrder() {
  const { items, clear } = useCart()
  const { toast } = useToast()
  const [creating, setCreating] = useState(false)
  const trackedSession = useRef(false)

  const placeOrder = useCallback(async () => {
    if (orderInFlight || creating || items.length === 0) return
    orderInFlight = true
    setCreating(true)
    // Se abre una ventana vacía de inmediato (gesto del usuario) para que el
    // navegador no bloquee la ventana de WhatsApp al abrirla después del pedido.
    let win: Window | null = null
    try {
      win = window.open('', '_blank')

      const settings = await getPublicSettings()
      const phoneDigits = (settings?.whatsapp_number ?? '').replace(/\D/g, '')
      if (!phoneDigits) {
        toast('error', 'La tienda aún no configuró su número de WhatsApp.')
        return
      }

      const currency = settings?.currency ?? 'BOB'

      if (!trackedSession.current) {
        trackedSession.current = true
        trackTikTokInitiateCheckout({
          value: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
          currency,
          contents: items.map((item) => ({
            content_id: item.productId,
            content_type: 'product',
            content_name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        })
        trackMetaInitiateCheckout({
          value: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
          currency,
          contents: items.map((item) => ({
            id: item.productId,
            quantity: item.quantity,
            item_price: item.price,
          })),
        })
        trackAnalyticsBeginCheckout({
          currency,
          value: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
          items: items.map((item) => ({
            item_id: item.productId,
            item_name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        })
      }

      const result = await createStoreOrder({
        // Sin formulario: valores internos para satisfacer la estructura del
        // pedido. La información real del cliente llega por el chat de WhatsApp.
        customer_name: 'Cliente de WhatsApp',
        customer_phone: 'Pendiente por WhatsApp',
        items: items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
        })),
      })

      trackTikTokCompletePayment({
        contents: items.map((item) => ({
          content_id: item.productId,
          content_type: 'product',
          content_name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        content_name: items[0]?.name,
        quantity: items.reduce((sum, item) => sum + item.quantity, 0),
        value: result.total,
        currency,
        order_id: result.order_id,
      })
      trackMetaPurchase({
        value: result.total,
        currency,
        content_ids: items.map((item) => item.productId),
        contents: items.map((item) => ({
          id: item.productId,
          quantity: item.quantity,
          item_price: item.price,
        })),
        num_items: items.reduce((sum, item) => sum + item.quantity, 0),
        order_id: result.order_id,
      })
      trackAnalyticsPurchase({
        currency,
        value: result.total,
        transaction_id: result.order_number,
        items: items.map((item) => ({
          item_id: item.productId,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      })

      const message = buildWhatsAppMessage(
        getWhatsAppTemplate(settings?.whatsapp_messages, 'order_whatsapp'),
        {
          store_name: settings?.store_name ?? 'Mi Tienda',
          order_number: result.order_number,
          products: formatProductLines(
            items.map((item) => ({ name: item.name, quantity: item.quantity })),
          ),
          total: formatCurrency(result.total, currency),
        },
      )

      const href = buildWhatsAppHref(phoneDigits, message)
      if (href && win) {
        win.location.href = href
      } else if (href) {
        window.open(href, '_blank', 'noopener,noreferrer')
      }

      clear()
      toast('success', `Pedido ${result.order_number} creado. Te atendemos por WhatsApp.`)
    } catch (err) {
      win?.close()
      toast('error', friendlyError(err))
    } finally {
      orderInFlight = false
      setCreating(false)
    }
  }, [creating, items, clear, toast])

  return { creating, placeOrder }
}