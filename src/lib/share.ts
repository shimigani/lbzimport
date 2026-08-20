export const DEFAULT_SHARE_IMAGE = '/default-share.png'

export function resolveShareImage(
  socialImageUrl: string | null | undefined,
  origin?: string,
): string | null {
  if (socialImageUrl) return socialImageUrl
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : '')
  return base ? `${base}${DEFAULT_SHARE_IMAGE}` : null
}