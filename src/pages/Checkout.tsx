import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { createStoreOrder, getPublicSettings } from '../services/store'
import { friendlyError } from '../utils/errors'
import { formatCurrency } from '../utils/format'
import { DEFAULT_PRIMARY } from '../utils/theme'
import { useCart } from '../hooks/useCart'
import { useSeo } from '../hooks/useSeo'
import { trackCompletePayment as trackTikTokCompletePayment, trackInitiateCheckout as trackTikTokInitiateCheckout } from '../lib/tiktok'
import { trackPurchase as trackMetaPurchase, trackInitiateCheckout as trackMetaInitiateCheckout } from '../lib/meta'
import { trackBeginCheckout as trackAnalyticsBeginCheckout, trackPurchase as trackAnalyticsPurchase } from '../lib/analytics'
import { Alert, Button, Input, Textarea } from '../components/ui/primitives'
import { WhatsAppIcon } from '../components/store/icons'
import type { StoreSettings } from '../types'

type FormValues = {
  customer_name: string
  customer_phone: string
  city: string
  address: string
  reference: string
  note: string
}

type OrderSnapshot = {
  orderId: string
  orderNumber: string
  customerName: string
  city: string
  address: string
  items: { name: string; quantity: number; price: number; subtotal: number }[]
  subtotal: number
  total: number
}

function validate(values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!values.customer_name.trim()) {
    errors.customer_name = 'El nombre es obligatorio.'
  }
  if (!values.customer_phone.trim()) {
    errors.customer_phone = 'El teléfono es obligatorio.'
  } else if (!/^[+\d][\d\s-]*$/.test(values.customer_phone.trim())) {
    errors.customer_phone = 'Ingresa un teléfono válido.'
  }
  return errors
}

function Checkout() {
  const { items, subtotal, clear } = useCart()
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [values, setValues] = useState<FormValues>({
    customer_name: '',
    customer_phone: '',
    city: '',
    address: '',
    reference: '',
    note: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [orderSnapshot, setOrderSnapshot] = useState<OrderSnapshot | null>(null)
  const checkoutTracked = useRef(false)
  const paymentTracked = useRef(false)

  useEffect(() => {
    let mounted = true
    getPublicSettings().then((loaded) => {
      if (mounted) setSettings(loaded)
    })
    return () => {
      mounted = false
    }
  }, [])

  const currency = settings?.currency ?? 'BOB'
  const primary = settings?.primary_color ?? DEFAULT_PRIMARY
  const whatsapp = settings?.whatsapp_number?.replace(/\D/g, '')

  useSeo({
    title: orderSnapshot
      ? `Pedido confirmado | ${settings?.store_name ?? 'Mi Tienda'}`
      : `Finalizar pedido | ${settings?.store_name ?? 'Mi Tienda'}`,
    noIndex: true,
  })

  useEffect(() => {
    if (checkoutTracked.current) return
    if (items.length === 0) return
    checkoutTracked.current = true
    trackTikTokInitiateCheckout({
      value: subtotal,
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
      value: subtotal,
      currency,
      contents: items.map((item) => ({
        id: item.productId,
        quantity: item.quantity,
        item_price: item.price,
      })),
    })
    trackAnalyticsBeginCheckout({
      currency,
      value: subtotal,
      items: items.map((item) => ({
        item_id: item.productId,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    })
  }, [items, subtotal, currency])

  function setField(field: keyof FormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  async function handleSubmit() {
    if (items.length === 0 || submitting) return
    const validation = validate(values)
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await createStoreOrder({
        customer_name: values.customer_name.trim(),
        customer_phone: values.customer_phone.trim(),
        city: values.city.trim(),
        address: values.address.trim(),
        reference: values.reference.trim(),
        note: values.note.trim(),
        items: items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
      })

      const snapshot: OrderSnapshot = {
        orderId: result.order_id,
        orderNumber: result.order_number,
        customerName: values.customer_name.trim(),
        city: values.city.trim(),
        address: values.address.trim(),
        items: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        })),
        subtotal: result.subtotal,
        total: result.total,
      }

      if (!paymentTracked.current) {
        paymentTracked.current = true
        trackTikTokCompletePayment({
          contents: items.map((item) => ({
            content_id: item.productId,
            content_type: 'product',
            content_name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          content_name: items[0]?.name,
          quantity: items.reduce((total, item) => total + item.quantity, 0),
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
          num_items: items.reduce((total, item) => total + item.quantity, 0),
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
      }

      setOrderSnapshot(snapshot)
      clear()
    } catch (err) {
      setSubmitError(friendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (orderSnapshot) {
    const orderLines = orderSnapshot.items
      .map((item) => `- ${item.name} x${item.quantity} (${formatCurrency(item.subtotal, currency)})`)
      .join('\n')

    const confirmMessage = [
      `Hola, acabo de hacer un pedido en ${settings?.store_name ?? 'la tienda'}.`,
      `Referencia: ${orderSnapshot.orderNumber}`,
      `Cliente: ${orderSnapshot.customerName}`,
      orderLines,
      `Subtotal: ${formatCurrency(orderSnapshot.subtotal, currency)}`,
      `Total: ${formatCurrency(orderSnapshot.total, currency)}`,
    ]
    if (orderSnapshot.city) confirmMessage.push(`Ciudad: ${orderSnapshot.city}`)
    if (orderSnapshot.address) confirmMessage.push(`Dirección: ${orderSnapshot.address}`)

    const proofMessage = [
      'Hola, acabo de realizar el pago de mi pedido.',
      '',
      `Pedido: ${orderSnapshot.orderNumber}`,
      `Cliente: ${orderSnapshot.customerName}`,
      `Total: ${formatCurrency(orderSnapshot.total, currency)}`,
      '',
      'Adjunto mi comprobante de pago.',
    ].join('\n')

    const confirmHref = whatsapp
      ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(confirmMessage.join('\n'))}`
      : null
    const proofHref = whatsapp
      ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(proofMessage)}`
      : null

    const qrUrl = settings?.qr_payment_url
    const hasPaymentData =
      Boolean(settings?.payment_instructions) ||
      Boolean(settings?.payment_account_name) ||
      Boolean(settings?.payment_bank_name) ||
      Boolean(settings?.payment_account_number) ||
      Boolean(settings?.payment_account_type)

    return (
      <div className="mx-auto max-w-2xl py-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-600">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Pedido recibido</h1>
          <p className="mt-2 text-sm text-slate-600">
            Gracias por tu compra. Tu pedido está pendiente de confirmación de pago.
          </p>
          <p className="mt-4 inline-flex flex-wrap items-center justify-center gap-x-2 rounded-full bg-slate-100 px-4 py-1.5 text-sm text-slate-700">
            Referencia:
            <span className="break-all font-semibold">{orderSnapshot.orderNumber}</span>
          </p>
          <p className="mt-3 text-lg font-semibold text-gray-900">
            Total: {formatCurrency(orderSnapshot.total, currency)}
          </p>
          <p className="mt-1 text-xs font-medium text-amber-600">
            Estado: Pendiente de confirmación de pago
          </p>
        </div>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-center text-lg font-bold text-gray-900">Paga tu pedido</h2>

          {qrUrl ? (
            <div className="mt-5 flex flex-col items-center">
              <img
                src={qrUrl}
                alt="Código QR para realizar el pago"
                className="w-56 rounded-2xl border-2 border-gray-100 bg-white p-2 sm:w-72"
              />
              <p className="mt-4 text-center text-sm text-slate-600">
                Escanea este código QR para realizar tu pago.
              </p>
            </div>
          ) : (
            <div className="mt-5 rounded-xl bg-amber-50 p-4 text-center text-sm text-amber-700">
              El método de pago aún no está configurado. Comunícate con nosotros por WhatsApp.
            </div>
          )}

          {hasPaymentData && (
            <dl className="mt-5 space-y-1.5 border-t border-gray-100 pt-4 text-sm">
              {settings?.payment_instructions && (
                <p className="whitespace-pre-line text-slate-600">{settings.payment_instructions}</p>
              )}
              {settings?.payment_bank_name && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Banco / entidad</dt>
                  <dd className="text-right font-medium text-gray-900">
                    {settings.payment_bank_name}
                  </dd>
                </div>
              )}
              {settings?.payment_account_name && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Titular</dt>
                  <dd className="text-right font-medium text-gray-900">
                    {settings.payment_account_name}
                  </dd>
                </div>
              )}
              {settings?.payment_account_number && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Número de cuenta</dt>
                  <dd className="text-right font-medium text-gray-900">
                    {settings.payment_account_number}
                  </dd>
                </div>
              )}
              {settings?.payment_account_type && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Tipo de cuenta</dt>
                  <dd className="text-right font-medium text-gray-900">
                    {settings.payment_account_type}
                  </dd>
                </div>
              )}
            </dl>
          )}

          {proofHref ? (
            <a
              href={proofHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 text-center text-sm font-semibold text-white hover:bg-emerald-600"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Enviar comprobante por WhatsApp
            </a>
          ) : (
            <p className="mt-6 text-center text-xs text-slate-500">
              WhatsApp no configurado por la tienda.
            </p>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Resumen del pedido</h2>
          <ul className="divide-y divide-gray-100">
            {orderSnapshot.items.map((item, index) => (
              <li key={index} className="flex items-center gap-3 py-2.5">
                <span className="text-xs text-slate-400">x{item.quantity}</span>
                <span className="flex-1 truncate text-sm text-gray-700">{item.name}</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(item.subtotal, currency)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(orderSnapshot.subtotal, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Total</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(orderSnapshot.total, currency)}
              </span>
            </div>
          </div>
          {confirmHref && (
            <a
              href={confirmHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Confirmar pedido por WhatsApp
            </a>
          )}
        </section>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm font-medium" style={{ color: primary }}>
            Volver a la tienda
          </Link>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Tu carrito está vacío</h1>
        <p className="text-sm text-slate-600">Agrega productos para poder realizar un pedido.</p>
        <Link
          to="/"
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: primary }}
        >
          Ver productos
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Finalizar pedido</h1>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <fieldset className="rounded-2xl border border-gray-200 bg-white p-5">
            <legend className="px-2 text-sm font-semibold text-gray-900">Tus datos</legend>
            <div className="space-y-4">
              <Input
                label="Nombre completo *"
                value={values.customer_name}
                onChange={(e) => setField('customer_name', e.target.value)}
                placeholder="Ej. María García"
                error={errors.customer_name}
              />
              <Input
                label="Teléfono / WhatsApp *"
                value={values.customer_phone}
                onChange={(e) => setField('customer_phone', e.target.value)}
                placeholder="Ej. 71234567"
                error={errors.customer_phone}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Ciudad"
                  value={values.city}
                  onChange={(e) => setField('city', e.target.value)}
                  placeholder="Ej. Santa Cruz"
                />
                <Input
                  label="Referencia"
                  value={values.reference}
                  onChange={(e) => setField('reference', e.target.value)}
                  placeholder="Ej. Cerca de la plaza"
                />
              </div>
              <Input
                label="Dirección"
                value={values.address}
                onChange={(e) => setField('address', e.target.value)}
                placeholder="Ej. Av. Principal #123"
              />
              <Textarea
                label="Nota para el vendedor"
                value={values.note}
                onChange={(e) => setField('note', e.target.value)}
                placeholder="Detalles opcionales sobre tu pedido"
                rows={3}
              />
            </div>
          </fieldset>

          {submitError && <Alert tone="error">{submitError}</Alert>}
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-gray-900">Resumen</h2>
            <ul className="divide-y divide-gray-100">
              {items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3 py-2.5">
                  <span className="text-xs text-slate-400">x{item.quantity}</span>
                  <span className="flex-1 truncate text-sm text-gray-700">{item.name}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(item.price * item.quantity, currency)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
              <span className="text-sm text-slate-600">Total</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(subtotal, currency)}
              </span>
            </div>
            <Button
              className="mt-4 w-full"
              style={{ backgroundColor: primary }}
              loading={submitting}
              onClick={() => void handleSubmit()}
            >
              Confirmar pedido
            </Button>
            <p className="mt-3 text-center text-xs text-slate-400">
              El vendedor te contactará para confirmar disponibilidad, envío y pago.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout