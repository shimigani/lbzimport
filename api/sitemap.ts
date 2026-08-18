import { createClient } from '@supabase/supabase-js'
import type { IncomingMessage, ServerResponse } from 'node:http'

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

function getOrigin(req: IncomingMessage): string {
  const proto = firstHeader(req.headers['x-forwarded-proto']) ?? 'https'
  const host = firstHeader(req.headers['x-forwarded-host']) ?? firstHeader(req.headers.host)
  return `${proto}://${host}`
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('Configuración de Supabase no disponible')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data: products, error } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('active', true)
    .order('created_at', { ascending: false })

  if (error) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end(error.message)
    return
  }

  const origin = getOrigin(req)
  const urls: string[] = []

  urls.push(`  <url><loc>${escapeXml(origin)}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`)

  const seen = new Set<string>()
  for (const product of products ?? []) {
    const loc = `${origin}/producto/${escapeXml(product.slug)}`
    if (seen.has(loc)) continue
    seen.add(loc)
    const lastmod = product.updated_at
      ? `<lastmod>${product.updated_at.slice(0, 10)}</lastmod>`
      : ''
    urls.push(
      `  <url><loc>${loc}</loc>${lastmod}<changefreq>weekly</changefreq><priority>0.8</priority></url>`,
    )
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.end(xml)
}