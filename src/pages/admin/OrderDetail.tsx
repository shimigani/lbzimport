import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { OrderStatus, OrderWithItems, StoreSettings } from '../../types'
import { formatCurrency, formatDate } from '../../utils/format'
import { friendlyError } from '../../utils/errors'
import { ORDER_STATUSES, orderStatusLabel, orderStatusTone } from '../../utils/orderStatus'
import { getOrder, updateOrderStatus } from '../../services/orders'
import { getPublicSettings } from '../../services/store'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  Select,
  Skeleton,
} from '../../components/ui/primitives'
import { useToast } from '../../hooks/useToast'
import { WhatsAppIcon } from '../../components/store/icons'
import {
  buildWhatsAppHref,
  buildWhatsAppMessage,
  getWhatsAppTemplate,
} from '../../lib/whatsapp'

export function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const [order, setOrder] = useState<OrderWithItems | null>(null)
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    let active = true
    getPublicSettings().then((loaded) => {
      if (active) setSettings(loaded)
    })
    return () => {
      active = false
    }
  }, [])

  async function load() {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getOrder(id)
      setOrder(data)
      if (data) setSelectedStatus(data.status)
      if (!data) setError('No se encontró el pedido.')
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleStatusChange() {
    if (!order || selectedStatus === order.status) return
    setUpdating(true)
    try {
      await updateOrderStatus(order.id, selectedStatus)
      toast('success', 'Estado del pedido actualizado correctamente.')
      await load()
    } catch (err) {
      toast('error', `Error al actualizar el estado: ${friendlyError(err)}`)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <Skeleton className="h-96" />
  }

  if (!order) {
    return (
      <div>
        <Link to="/admin/orders" className="text-sm font-medium text-indigo-600 hover:underline">
          ← Volver a pedidos
        </Link>
        <div className="mt-4">{error ? <Alert>{error}</Alert> : <Alert tone="info">Pedido no encontrado.</Alert>}</div>
      </div>
    )
  }

  const contactMessage = buildWhatsAppMessage(
    getWhatsAppTemplate(settings?.whatsapp_messages, 'contact_customer'),
    {
      customer_name: order.customer_name,
      order_number: order.order_number,
      store_name: settings?.store_name ?? 'Mi Tienda',
      store_phone: settings?.whatsapp_number ?? '',
    },
  )
  const whatsappLink = order.customer_phone
    ? buildWhatsAppHref(order.customer_phone, contactMessage) || null
    : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/admin/orders" className="text-sm font-medium text-indigo-600 hover:underline">
            ← Volver a pedidos
          </Link>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">{order.order_number}</h1>
          <p className="mt-0.5 text-sm text-slate-500">Realizado el {formatDate(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedStatus}
            disabled={updating}
            onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
            className="w-48"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          <Button
            variant="secondary"
            loading={updating}
            disabled={selectedStatus === order.status}
            onClick={() => void handleStatusChange()}
          >
            Guardar estado
          </Button>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Productos" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-medium">Producto</th>
                    <th className="px-3 py-3 font-medium">Cant.</th>
                    <th className="px-3 py-3 font-medium">Precio unitario</th>
                    <th className="px-5 py-3 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-3 font-medium text-slate-800">{item.product_name}</td>
                      <td className="px-3 py-3 text-slate-600">{item.quantity}</td>
                      <td className="px-3 py-3 text-slate-600">{formatCurrency(item.unit_price)}</td>
                      <td className="px-5 py-3 text-right font-medium text-slate-800">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 px-5 py-4">
              <div className="ml-auto max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Datos del cliente" />
            <dl className="space-y-3 px-5 py-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Nombre</dt>
                <dd className="mt-0.5 font-medium text-slate-800">{order.customer_name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Teléfono</dt>
                <dd className="mt-0.5 text-slate-700">{order.customer_phone}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Ciudad</dt>
                <dd className="mt-0.5 text-slate-700">{order.city || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Dirección</dt>
                <dd className="mt-0.5 text-slate-700">{order.address || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Referencia</dt>
                <dd className="mt-0.5 text-slate-700">{order.reference || '—'}</dd>
              </div>
              {whatsappLink && (
                <div>
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    Contactar al cliente
                  </a>
                </div>
              )}
            </dl>
          </Card>

          <Card>
            <CardHeader title="Estado del pedido" />
            <div className="px-5 py-4">
              <Badge tone={orderStatusTone(order.status)}>{orderStatusLabel(order.status)}</Badge>
              {order.note && (
                <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Nota del cliente:</span> {order.note}
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}