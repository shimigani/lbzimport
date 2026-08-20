type StoreRow = {
  store_name?: string | null
  description?: string | null
  social_image_url?: string | null
}

type ProductRow = {
  name?: string | null
  short_description?: string | null
  image_url?: string | null
}

const DEFAULT_DESCRIPTION =
  'Tienda en línea: descubre nuestros productos y realiza tu pedido fácilmente.'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function isSocialCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase()
  return [
    'whatsapp',
    'facebookexternalhit',
    'facebot',
    'twitterbot',
    'linkedinbot',
    'telegrambot',
    'slackbot',
    'skypeuripreview',
    'pinterest',
    'discordbot',
    'vkshare',
    'viber',
    'line/',
    'messenger',
    'embedly',
    'redditbot',
    'tumblr',
    'quora link preview',
    'baiduspider',
    'petalbot',
    'semrushbot',
  ].some((needle) => ua.includes(needle))
}

function metaTag(property: string, content: string): string {
  return `  <meta property="${property}" content="${escapeHtml(content)}" />`
}

function nameTag(name: string, content: string): string {
  return `  <meta name="${name}" content="${escapeHtml(content)}" />`
}

export function buildMetaHtml(input: {
  storeName: string
  title: string
  description: string
  image: string
  url: string
}): string {
  const { storeName, title, description, image, url } = input
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    ${nameTag('description', description)}
    ${metaTag('og:type', 'website')}
    ${metaTag('og:site_name', storeName)}
    ${metaTag('og:title', title)}
    ${metaTag('og:description', description)}
    ${metaTag('og:url', url)}
    ${metaTag('og:image', image)}
    ${metaTag('og:image:alt', storeName)}
    ${nameTag('twitter:card', 'summary_large_image')}
    ${nameTag('twitter:title', title)}
    ${nameTag('twitter:description', description)}
    ${nameTag('twitter:image', image)}
  </head>
  <body style="margin:0;background:#0b0b0d"></body>
</html>
`
}

async function fetchJson(url: string, apikey: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { apikey, Authorization: `Bearer ${apikey}` },
  })
  if (!res.ok) throw new Error(`Supabase ${res.status}`)
  return res.json()
}

export default async function middleware(request: Request): Promise<Response | undefined> {
  if (request.method !== 'GET') return undefined
  const userAgent = request.headers.get('user-agent') ?? ''
  if (!isSocialCrawler(userAgent)) return undefined

  const url = new URL(request.url)
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl || !supabaseKey) return undefined

  try {
    const origin = `${url.protocol}//${url.host}`
    const pathname = url.pathname

    const settings = (await fetchJson(
      `${supabaseUrl}/rest/v1/store_settings?select=store_name,description,social_image_url&limit=1`,
      supabaseKey,
    )) as StoreRow[]
    const store = settings?.[0] ?? {}
    const storeName = store.store_name || 'Mi Tienda'

    let title = `${storeName} | Tienda`
    let description = store.description || DEFAULT_DESCRIPTION
    let image = store.social_image_url || `${origin}/default-share.png`
    let canonicalUrl = `${origin}/`

    if (pathname.startsWith('/producto/')) {
      const slug = decodeURIComponent(pathname.replace('/producto/', '').split('/')[0])
      const products = (await fetchJson(
        `${supabaseUrl}/rest/v1/products?select=name,short_description,image_url&slug=eq.${encodeURIComponent(slug)}&active=eq.true&limit=1`,
        supabaseKey,
      )) as ProductRow[]
      const product = products?.[0]
      if (product) {
        title = `${product.name || storeName} | ${storeName}`
        description = product.short_description || store.description || DEFAULT_DESCRIPTION
        image = product.image_url || store.social_image_url || `${origin}/default-share.png`
        canonicalUrl = `${origin}/producto/${encodeURIComponent(slug)}`
      }
    }

    const html = buildMetaHtml({ storeName, title, description, image, url: canonicalUrl })

    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch {
    return undefined
  }
}

export const config = {
  matcher: ['/', '/producto/:path*'],
}