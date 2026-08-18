import { getPublicSettings } from '../services/store'

/**
 * Integración centralizada de Meta Pixel (Facebook + Instagram Ads).
 *
 * - Se activa únicamente cuando store_settings.meta_pixel_id no está vacío.
 * - El Pixel ID es un identificador público: puede vivir en el frontend.
 * - Nunca se usa Access Token / App Secret / service_role / ningún secreto.
 * - No implementa Advanced Matching ni Conversions API (etapas separadas).
 * - Si Meta no está configurado, todas las funciones son no-op silenciosas.
 * - Protección contra duplicados por re-render, StrictMode, refresh y remount.
 */

export type MetaContent = {
  id: string
  quantity?: number
  item_price?: number
}

export type MetaViewContentParams = {
  content_ids: string[]
  content_name?: string
  value: number
  currency: string
}

export type MetaAddToCartParams = {
  content_ids: string[]
  content_name?: string
  value: number
  currency: string
  contents: MetaContent[]
}

export type MetaInitiateCheckoutParams = {
  value: number
  currency: string
  contents: MetaContent[]
}

export type MetaPurchaseParams = {
  value: number
  currency: string
  content_ids: string[]
  contents: MetaContent[]
  num_items: number
  order_id: string
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

const FBQ_BASE_CODE = [
  "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');",
].join('')

function buildPixelCode(pixelId: string): string {
  return `${FBQ_BASE_CODE}fbq('init', ${JSON.stringify(pixelId)});`
}

let config: { enabled: boolean } | null = null
let configPromise: Promise<boolean> | null = null
let injected = false

async function ensureConfigured(): Promise<boolean> {
  if (config) return config.enabled

  configPromise ??= getPublicSettings()
    .then((settings) => {
      const id = settings?.meta_pixel_id?.trim() ?? ''
      config = { enabled: id.length > 0 }
      if (config.enabled) injectPixel(id)
      return config.enabled
    })
    .catch(() => {
      config = { enabled: false }
      return false
    })

  return configPromise
}

function injectPixel(pixelId: string): void {
  if (injected) return
  injected = true

  const script = document.createElement('script')
  script.id = 'meta-pixel'
  script.textContent = buildPixelCode(pixelId)
  document.head.appendChild(script)
}

function sanitizeParams(params: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter((entry) => entry[1] !== undefined),
  )
}

async function pushEvent(
  event: string,
  params: Record<string, unknown> | undefined,
  eventId?: string,
): Promise<void> {
  if (!(await ensureConfigured())) return
  const fbq = window.fbq
  if (!fbq) return

  const clean = params ? sanitizeParams(params) : undefined
  if (eventId) {
    fbq('track', event, clean, { eventID: eventId })
  } else {
    fbq('track', event, clean)
  }
}

type DedupEntry = { key: string; at: number }

const recentEvents = new Map<string, DedupEntry>()
const firedOrders = new Set<string>()

const DEDUP_WINDOW_MS = 1000

function isDuplicate(kind: string, key: string): boolean {
  const now = Date.now()
  const entry = recentEvents.get(kind)
  if (entry && entry.key === key && now - entry.at < DEDUP_WINDOW_MS) {
    return true
  }
  recentEvents.set(kind, { key, at: now })
  return false
}

/** PageView: una vez por ruta (el caller la controla por pathname). */
export function trackPageView(): void {
  void (async () => {
    if (!(await ensureConfigured())) return
    window.fbq?.('track', 'PageView')
  })()
}

/** ViewContent: una vez por producto visto (deduplicado por content_ids). */
export function trackViewContent(params: MetaViewContentParams): void {
  const key = params.content_ids.join('|')
  if (isDuplicate('view_content', key)) return
  void pushEvent('ViewContent', {
    ...params,
    content_type: 'product',
  })
}

/** AddToCart: se dispara por cada acción real de "Agregar" (no por cambios de cantidad). */
export function trackAddToCart(params: MetaAddToCartParams): void {
  void pushEvent('AddToCart', {
    ...params,
    content_type: 'product',
  })
}

/** InitiateCheckout: una vez por llegada real al checkout. */
export function trackInitiateCheckout(params: MetaInitiateCheckoutParams): void {
  if (isDuplicate('initiate_checkout', 'checkout')) return
  void pushEvent('InitiateCheckout', {
    value: params.value,
    currency: params.currency,
    contents: params.contents,
  })
}

/**
 * Purchase: una sola vez por pedido (deduplicado permanentemente por order_id).
 * value proviene SIEMPRE de la respuesta del servidor (result.total).
 */
export function trackPurchase(params: MetaPurchaseParams): void {
  if (firedOrders.has(params.order_id)) return
  firedOrders.add(params.order_id)

  void pushEvent(
    'Purchase',
    {
      value: params.value,
      currency: params.currency,
      content_type: 'product',
      content_ids: params.content_ids,
      contents: params.contents,
      num_items: params.num_items,
      order_id: params.order_id,
    },
    params.order_id,
  )
}