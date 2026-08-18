const CURRENCY_SYMBOLS: Record<string, string> = {
  BOB: 'Bs.',
  USD: '$',
}

export function formatCurrency(amount: number, currency: string = 'BOB'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? 'Bs.'
  const value = Number.isFinite(amount) ? amount : 0
  return `${symbol} ${value.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}