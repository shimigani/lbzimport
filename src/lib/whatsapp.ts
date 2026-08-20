import type { StoreSettings, WhatsAppMessageKey, WhatsAppMessages } from '../types'

// ---------------------------------------------------------------------------
// Sistema centralizado de plantillas de mensajes de WhatsApp.
// Todas las plantillas (editables desde Admin -> Configuración -> WhatsApp)
// se resuelven aquí. Si una plantilla guardada falta o está vacía, se usa el
// valor predeterminado. Los callers aportan SOLO los datos reales del pedido.
// ---------------------------------------------------------------------------

export type WhatsAppTemplateScope = 'order' | 'product' | 'store'

export type WhatsAppTemplateMeta = {
  key: WhatsAppMessageKey
  title: string
  emoji: string
  description: string
  scope: WhatsAppTemplateScope
  variables?: string[]
}

export type WhatsAppVariableInfo = {
  name: string
  description: string
  scope: 'order' | 'product' | 'all'
}

export const WHATSAPP_TEMPLATES: WhatsAppTemplateMeta[] = [
  {
    key: 'order_whatsapp',
    title: 'Pedido por WhatsApp',
    emoji: '💬',
    description: 'Mensaje que recibe el cliente al pulsar el botón Pedir por WhatsApp.',
    scope: 'order',
    variables: ['{{store_name}}', '{{order_number}}', '{{products}}', '{{total}}'],
  },
  {
    key: 'product_inquiry',
    title: 'Consulta de producto',
    emoji: '🛒',
    description: 'Botón "Pedir por WhatsApp" en la ficha del producto.',
    scope: 'product',
    variables: [
      '{{product_name}}',
      '{{product_price}}',
      '{{product_url}}',
      '{{quantity}}',
      '{{store_name}}',
      '{{store_phone}}',
    ],
  },
  {
    key: 'contact_customer',
    title: 'Contactar cliente (admin)',
    emoji: '💬',
    description: 'Botón "Contactar al cliente" en el detalle del pedido.',
    scope: 'order',
    variables: [
      '{{customer_name}}',
      '{{order_number}}',
      '{{store_name}}',
      '{{store_phone}}',
    ],
  },
  {
    key: 'general_contact',
    title: 'Contacto general',
    emoji: '📣',
    description: 'Botones de contacto: header, footer, botón flotante e inicio.',
    scope: 'store',
    variables: ['{{store_name}}', '{{store_phone}}'],
  },
]

export const DEFAULT_WHATSAPP_MESSAGES: Record<WhatsAppMessageKey, string> = {
  order_whatsapp: [
    '👋 Hola, gracias por comprar en {{store_name}}.',
    '',
    '🧾 Número de orden: #{{order_number}}',
    '',
    '🛍️ Tu pedido:',
    '{{products}}',
    '',
    '💰 Total: {{total}}',
    '',
    '✅ Hemos recibido tu pedido correctamente.',
    '',
    'En este momento te estamos atendiendo por WhatsApp. En breve te responderemos para coordinar tu pedido.',
    '',
    '¡Gracias por confiar en {{store_name}}! 🙌',
  ].join('\n'),
  product_inquiry:
    'Hola 👋 Me interesa el producto "{{product_name}}" (Bs {{product_price}}). ¿Está disponible?',
  contact_customer:
    'Hola {{customer_name}}, respecto a tu pedido {{order_number}}, te contacto desde {{store_name}} para coordinar la entrega.',
  general_contact: 'Hola, me gustaría más información.',
}

export const WHATSAPP_VARIABLES: WhatsAppVariableInfo[] = [
  { name: '{{order_number}}', description: 'Número del pedido', scope: 'order' },
  { name: '{{customer_name}}', description: 'Nombre del cliente', scope: 'order' },
  { name: '{{products}}', description: 'Lista de productos del pedido', scope: 'order' },
  { name: '{{total}}', description: 'Total del pedido', scope: 'order' },
  { name: '{{product_name}}', description: 'Nombre del producto', scope: 'product' },
  { name: '{{product_price}}', description: 'Precio del producto', scope: 'product' },
  { name: '{{product_url}}', description: 'URL del producto', scope: 'product' },
  { name: '{{quantity}}', description: 'Cantidad', scope: 'product' },
  { name: '{{store_name}}', description: 'Nombre de la tienda', scope: 'all' },
  { name: '{{store_phone}}', description: 'Teléfono de la tienda', scope: 'all' },
]

// Datos de ejemplo usados SOLO en la vista previa del panel (no se envía nada).
export const WHATSAPP_PREVIEW_DATA: Record<string, string> = {
  order_number: 'ORD-000123',
  customer_name: 'Juan Pérez',
  products: '* Producto de prueba × 2\n* Otro producto × 1',
  total: '150',
  product_name: 'Producto de prueba',
  product_price: '50',
  product_url: 'https://mitienda.com/producto/producto-de-prueba',
  quantity: '2',
  store_name: 'Mi Tienda',
  store_phone: '70000000',
}

export function getWhatsAppTemplate(
  messages: WhatsAppMessages | null | undefined,
  key: WhatsAppMessageKey,
): string {
  const template = messages?.[key]
  return template && template.trim() ? template : DEFAULT_WHATSAPP_MESSAGES[key]
}

export function buildWhatsAppMessage(
  template: string | undefined | null,
  data: Record<string, string | number>,
): string {
  const raw = template?.trim()
  if (!raw) return ''
  return raw.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = data[key]
    if (value === undefined || value === null) return match
    return String(value)
  })
}

export function buildWhatsAppHref(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return ''
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

// Convierte los productos reales del pedido en una lista legible para {{products}}.
export function formatProductLines(
  items: { name: string; quantity: number }[],
): string {
  return items.map((item) => `* ${item.name} × ${item.quantity}`).join('\n')
}

// Mensaje de contacto general (header, footer, botón flotante e inicio).
export function buildGeneralContactMessage(settings: StoreSettings | null | undefined): string {
  return buildWhatsAppMessage(
    getWhatsAppTemplate(settings?.whatsapp_messages, 'general_contact'),
    {
      store_name: settings?.store_name ?? 'Mi Tienda',
      store_phone: settings?.whatsapp_number ?? '',
    },
  )
}