import { getPublicSettings } from '../services/store'

/**
 * Integración centralizada de TikTok Pixel.
 *
 * - Se activa únicamente cuando store_settings.tiktok_pixel_id no está vacío.
 * - El Pixel ID es un identificador público: puede vivir en el frontend.
 * - Nunca se usa Access Token / service_role / ningún secreto aquí.
 * - Si TikTok no está configurado, todas las funciones son no-op silenciosas.
 * - Protección contra duplicados por re-render, StrictMode y doble clic.
 */

export type TikTokContent = {
  content_id: string
  content_type: 'product'
  content_name?: string
  quantity?: number
  price?: number
}

export type TikTokViewContentParams = {
  content_id: string
  content_name?: string
  content_category?: string
  value: number
  currency: string
}

export type TikTokAddToCartParams = TikTokViewContentParams & {
  quantity: number
}

export type TikTokInitiateCheckoutParams = {
  value: number
  currency: string
  contents: TikTokContent[]
}

export type TikTokCompletePaymentParams = {
  contents: TikTokContent[]
  content_name?: string
  quantity: number
  value: number
  currency: string
  order_id: string
}

declare global {
  interface Window {
    ttq?: {
      page: () => void
      track: (event: string, params?: Record<string, unknown>, eventId?: unknown) => void
    }
  }
}

const TTQ_METHODS = [
  'page',
  'track',
  'identify',
  'instances',
  'debug',
  'on',
  'off',
  'once',
  'ready',
  'alias',
  'group',
  'enableCookie',
  'disableCookie',
  'holdConsent',
  'revokeConsent',
  'grantConsent',
]
  .map((method) => JSON.stringify(method))
  .join(',')

function buildPixelCode(pixelId: string): string {
  return [
    '!function(w,d,t){',
    'w.TiktokAnalyticsObject=t;',
    'var ttq=w[t]=w[t]||[];',
    `ttq.methods=[${TTQ_METHODS}];`,
    'ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};',
    'for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);',
    'ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq.push(["load",e,r]);if(o)ttq.push(["partner",o])};',
    `ttq.load(${JSON.stringify(pixelId)});`,
    '}(window,document,\'ttq\');',
  ].join('')
}

let config: { enabled: boolean } | null = null
let configPromise: Promise<boolean> | null = null
let injected = false

async function ensureConfigured(): Promise<boolean> {
  if (config) return config.enabled

  configPromise ??= getPublicSettings()
    .then((settings) => {
      const id = settings?.tiktok_pixel_id?.trim() ?? ''
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
  script.id = 'tiktok-pixel'
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
  window.ttq?.track(event, params ? sanitizeParams(params) : undefined, eventId)
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
    window.ttq?.page()
  })()
}

/** ViewContent: una vez por producto visto (deduplicado por content_id). */
export function trackViewContent(params: TikTokViewContentParams): void {
  if (isDuplicate('view_content', params.content_id)) return
  void pushEvent('ViewContent', {
    ...params,
    content_type: 'product',
  })
}

/** AddToCart: se dispara por cada acción real de "Agregar" (no por cambios de cantidad). */
export function trackAddToCart(params: TikTokAddToCartParams): void {
  void pushEvent('AddToCart', {
    ...params,
    content_type: 'product',
  })
}

/** InitiateCheckout: una vez por llegada real al checkout. */
export function trackInitiateCheckout(params: TikTokInitiateCheckoutParams): void {
  if (isDuplicate('initiate_checkout', 'checkout')) return
  void pushEvent('InitiateCheckout', {
    value: params.value,
    currency: params.currency,
    contents: params.contents,
  })
}

/**
 * CompletePayment: una sola vez por pedido (deduplicado permanentemente por
 * order_id). value proviene SIEMPRE de la respuesta del servidor (result.total).
 */
export function trackCompletePayment(params: TikTokCompletePaymentParams): void {
  if (firedOrders.has(params.order_id)) return
  firedOrders.add(params.order_id)

  void pushEvent(
    'CompletePayment',
    {
      content_type: 'product',
      content_id: params.contents[0]?.content_id,
      content_name: params.content_name,
      contents: params.contents,
      quantity: params.quantity,
      value: params.value,
      currency: params.currency,
      order_id: params.order_id,
    },
    params.order_id,
  )
}