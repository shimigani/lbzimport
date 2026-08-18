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
}

export type WhatsAppVariableInfo = {
  name: string
  description: string
  scope: 'order' | 'product' | 'all'
}

export const WHATSAPP_TEMPLATES: WhatsAppTemplateMeta[] = [
  {
    key: 'order_cod',
    title: 'Pago contra entrega',
    emoji: '💵',
    description: 'Pedido confirmado cuando el cliente paga al recibir.',
    scope: 'order',
  },
  {
    key: 'order_qr',
    title: 'Pago por QR',
    emoji: '📱',
    description: 'Pedido confirmado cuando el cliente paga por QR.',
    scope: 'order',
  },
  {
    key: 'order_whatsapp',
    title: 'Confirmar por WhatsApp',
    emoji: '💬',
    description: 'Pedido confirmado directamente por WhatsApp.',
    scope: 'order',
  },
  {
    key: 'proof_qr',
    title: 'Comprobante de pago',
    emoji: '🧾',
    description: 'Mensaje al adjuntar el comprobante de pago por QR.',
    scope: 'order',
  },
  {
    key: 'product_inquiry',
    title: 'Consulta de producto',
    emoji: '🛒',
    description: 'Botón "Pedir por WhatsApp" en la ficha del producto.',
    scope: 'product',
  },
  {
    key: 'contact_customer',
    title: 'Contactar cliente (admin)',
    emoji: '💬',
    description: 'Botón "Contactar al cliente" en el detalle del pedido.',
    scope: 'order',
  },
  {
    key: 'general_contact',
    title: 'Contacto general',
    emoji: '📣',
    description: 'Botones de contacto: header, footer, botón flotante e inicio.',
    scope: 'store',
  },
]

export const DEFAULT_WHATSAPP_MESSAGES: Record<WhatsAppMessageKey, string> = {
  order_cod: [
    'Hola 👋 Quiero confirmar mi pedido.',
    '',
    '🛍️ PEDIDO: {{order_number}}',
    '',
    '👤 Cliente: {{customer_name}}',
    '📱 Teléfono: {{phone}}',
    '📍 Ciudad: {{city}}',
    '🏠 Dirección: {{address}}',
    '📌 Referencia: {{reference}}',
    '',
    '🛒 PRODUCTOS:',
    '{{products}}',
    '',
    '💰 Subtotal: Bs {{subtotal}}',
    '💵 TOTAL: Bs {{total}}',
    '',
    '💳 Método de pago: Pago contra entrega',
    '',
    'Gracias.',
  ].join('\n'),
  order_qr: [
    'Hola 👋 Quiero confirmar mi pedido.',
    '',
    '🛍️ PEDIDO: {{order_number}}',
    '',
    '👤 Cliente: {{customer_name}}',
    '📱 Teléfono: {{phone}}',
    '📍 Ciudad: {{city}}',
    '🏠 Dirección: {{address}}',
    '📌 Referencia: {{reference}}',
    '',
    '🛒 PRODUCTOS:',
    '{{products}}',
    '',
    '💰 Subtotal: Bs {{subtotal}}',
    '💵 TOTAL: Bs {{total}}',
    '',
    '📱 Método de pago: Pago por QR',
    '',
    'Adjunto mi comprobante de pago.',
  ].join('\n'),
  order_whatsapp: [
    'Hola 👋 Quiero confirmar mi pedido.',
    '',
    '🛍️ PEDIDO: {{order_number}}',
    '',
    '👤 Cliente: {{customer_name}}',
    '📱 Teléfono: {{phone}}',
    '📍 Ciudad: {{city}}',
    '🏠 Dirección: {{address}}',
    '📌 Referencia: {{reference}}',
    '',
    '🛒 PRODUCTOS:',
    '{{products}}',
    '',
    '💰 Subtotal: Bs {{subtotal}}',
    '💵 TOTAL: Bs {{total}}',
    '',
    '💬 Método de pago: Confirmar por WhatsApp',
    '',
    'Gracias.',
  ].join('\n'),
  proof_qr: [
    'Hola 👋 Adjunto el comprobante de pago de mi pedido.',
    '',
    '🛍️ Pedido: {{order_number}}',
    '',
    '👤 Cliente: {{customer_name}}',
    '',
    '💵 Total: Bs {{total}}',
    '',
    '📱 Método de pago: Pago por QR',
    '',
    'Adjunto mi comprobante.',
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
  { name: '{{phone}}', description: 'Teléfono del cliente', scope: 'order' },
  { name: '{{city}}', description: 'Ciudad', scope: 'order' },
  { name: '{{address}}', description: 'Dirección', scope: 'order' },
  { name: '{{reference}}', description: 'Referencia', scope: 'order' },
  { name: '{{note}}', description: 'Nota del cliente', scope: 'order' },
  { name: '{{products}}', description: 'Lista de productos del pedido', scope: 'order' },
  { name: '{{subtotal}}', description: 'Subtotal del pedido', scope: 'order' },
  { name: '{{total}}', description: 'Total del pedido', scope: 'order' },
  { name: '{{payment_method}}', description: 'Método de pago seleccionado', scope: 'order' },
  { name: '{{product_name}}', description: 'Nombre del producto', scope: 'product' },
  { name: '{{product_price}}', description: 'Precio del producto', scope: 'product' },
  { name: '{{product_url}}', description: 'URL del producto', scope: 'product' },
  { name: '{{quantity}}', description: 'Cantidad', scope: 'product' },
  { name: '{{store_name}}', description: 'Nombre de la tienda', scope: 'all' },
  { name: '{{store_phone}}', description: 'Teléfono de la tienda', scope: 'all' },
]

export function variablesForScope(
  scope: WhatsAppTemplateScope,
): WhatsAppVariableInfo[] {
  if (scope === 'store') {
    return WHATSAPP_VARIABLES.filter((v) => v.scope === 'all')
  }
  return WHATSAPP_VARIABLES.filter((v) => v.scope === scope || v.scope === 'all')
}

// Datos de ejemplo usados SOLO en la vista previa del panel (no se envía nada).
export const WHATSAPP_PREVIEW_DATA: Record<string, string> = {
  order_number: 'ORD-000123',
  customer_name: 'Juan Pérez',
  phone: '70000000',
  city: 'Cochabamba',
  address: 'Av. Ejemplo 123',
  reference: '',
  note: '',
  products: '* Producto de prueba x2 — Bs 100',
  subtotal: '100',
  total: '100',
  payment_method: 'Pago contra entrega',
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
  items: { name: string; quantity: number; subtotal: number }[],
): string {
  return items.map((item) => `* ${item.name} x${item.quantity} — Bs ${item.subtotal}`).join('\n')
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