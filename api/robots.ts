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

export default function handler(req: IncomingMessage, res: ServerResponse): void {
  const origin = getOrigin(req)
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /login',
    'Disallow: /checkout',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n')

  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.end(body)
}