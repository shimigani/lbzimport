export function friendlyError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  const msg = raw.toLowerCase()

  if (msg.includes('slug') && (msg.includes('duplic') || msg.includes('unique') || msg.includes('23505'))) {
    return 'El slug ya existe. Usa otro.'
  }
  if (msg.includes('sku') && (msg.includes('duplic') || msg.includes('unique') || msg.includes('23505'))) {
    return 'El SKU ya existe. Usa otro.'
  }
  if (msg.includes('row-level security') || msg.includes('rls policy')) {
    return 'No tienes permisos para realizar esta operación.'
  }
  if (msg.includes('stock insuficiente')) {
    return 'Stock insuficiente para uno de los productos.'
  }
  return raw
}