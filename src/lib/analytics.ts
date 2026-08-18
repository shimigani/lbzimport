import { getPublicSettings } from '../services/store'

/**
 * Integración centralizada de Google Analytics 4 (GA4) vía gtag.js.
 *
 * - Se activa únicamente cuando store_settings.google_analytics_id no está vacío
 *   (Measurement ID con formato G-XXXXXXXXXX).
 * - Carga el script una sola vez y define window.dataLayer / gtag de forma controlada.
 * - No se usan secretos ni datos personales innecesarios.
 * - No implementa Google Ads, GTM, Enhanced Conversions ni Conversions API.
 * - Si GA4 no está configurado, todas las funciones son no-op silenciosas.
 * - Protección contra duplicados por re-render, StrictMode, doble clic y remount.
 */

export type AnalyticsItem = {
  item_id: string
  item_name: string
  price: number
  quantity: number
}

export type AnalyticsViewItemParams = {
  currency: string
  value: number
  items: AnalyticsItem[]
}

export type AnalyticsAddToCartParams = AnalyticsViewItemParams

export type AnalyticsBeginCheckoutParams = AnalyticsViewItemParams

export type AnalyticsPurchaseParams = {
  currency: string
  value: number
  transaction_id: string
  items: AnalyticsItem[]
}

export type AnalyticsPageViewParams = {
  page_path: string
  page_title?: string
  page_location: string
}

declare global {
  interface Window {
    dataLayer?: unknown[][]
    gtag?: (...args: unknown[]) => void
  }
}

let config: { enabled: boolean } | null = null
let configPromise: Promise<boolean> | null = null
let injected = false

async function ensureConfigured(): Promise<boolean> {
  if (config) return config.enabled

  configPromise ??= getPublicSettings()
    .then((settings) => {
      const id = settings?.google_analytics_id?.trim() ?? ''
      config = { enabled: id.length > 0 }
      if (config.enabled) injectTag(id)
      return config.enabled
    })
    .catch(() => {
      config = { enabled: false }
      return false
    })

  return configPromise
}

function injectTag(measurementId: string): void {
  if (injected) return
  injected = true

  if (!window.dataLayer) {
    window.dataLayer = []
  }
  window.gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args)
  }
  window.gtag('js', new Date())
  window.gtag('config', measurementId)

  const script = document.createElement('script')
  script.id = 'ga4-script'
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
  document.head.appendChild(script)
}

function sanitizeParams(params: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter((entry) => entry[1] !== undefined),
  )
}

async function sendEvent(name: string, params: Record<string, unknown>): Promise<void> {
  if (!(await ensureConfigured())) return
  window.gtag?.('event', name, sanitizeParams(params))
}

type DedupEntry = { key: string; at: number }

const recentEvents = new Map<string, DedupEntry>()
const firedTransactions = new Set<string>()

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

/** page_view: una vez por ruta (el caller la controla por pathname). */
export function trackPageView(params: AnalyticsPageViewParams): void {
  if (isDuplicate('page_view', params.page_path)) return
  void sendEvent('page_view', {
    page_path: params.page_path,
    page_title: params.page_title,
    page_location: params.page_location,
  })
}

/** view_item: una vez por producto visto (deduplicado por item_id). */
export function trackViewItem(params: AnalyticsViewItemParams): void {
  const key = params.items.map((item) => item.item_id).join('|')
  if (isDuplicate('view_item', key)) return
  void sendEvent('view_item', {
    currency: params.currency,
    value: params.value,
    items: params.items,
  })
}

/** add_to_cart: se dispara por cada acción real de "Agregar" (no por cambios de cantidad). */
export function trackAddToCart(params: AnalyticsAddToCartParams): void {
  void sendEvent('add_to_cart', {
    currency: params.currency,
    value: params.value,
    items: params.items,
  })
}

/** begin_checkout: una vez por llegada real al checkout. */
export function trackBeginCheckout(params: AnalyticsBeginCheckoutParams): void {
  if (isDuplicate('begin_checkout', 'checkout')) return
  void sendEvent('begin_checkout', {
    currency: params.currency,
    value: params.value,
    items: params.items,
  })
}

/**
 * purchase: una sola vez por pedido (deduplicado permanentemente por
 * transaction_id = result.order_number). value proviene SIEMPRE de la
 * respuesta del servidor (result.total).
 */
export function trackPurchase(params: AnalyticsPurchaseParams): void {
  if (firedTransactions.has(params.transaction_id)) return
  firedTransactions.add(params.transaction_id)

  void sendEvent('purchase', {
    currency: params.currency,
    transaction_id: params.transaction_id,
    value: params.value,
    items: params.items,
  })
}