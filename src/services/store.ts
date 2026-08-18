import { supabase } from '../lib/supabase'
import type { Category, ProductImage, StoreSettings } from '../types'

export type PublicCategory = Pick<Category, 'id' | 'name' | 'slug' | 'image_url'>

export type PublicProduct = {
  id: string
  name: string
  slug: string
  short_description: string | null
  description: string | null
  price: number
  compare_price: number | null
  stock: number
  category_id: string | null
  image_url: string | null
  featured: boolean
  category: PublicCategory | null
}

export type PublicProductDetail = PublicProduct & {
  images: ProductImage[]
}

export type CreateOrderInput = {
  customer_name: string
  customer_phone: string
  city?: string
  address?: string
  reference?: string
  note?: string
  items: { product_id: string; quantity: number }[]
}

export type CreateOrderResult = {
  order_id: string
  order_number: string
  subtotal: number
  total: number
}

type ProductRow = {
  id: string
  name: string
  slug: string
  short_description: string | null
  description: string | null
  price: number
  compare_price: number | null
  stock: number
  category_id: string | null
  image_url: string | null
  featured: boolean
  categories: PublicCategory | null
  product_images?: ProductImage[]
}

let settingsPromise: Promise<StoreSettings | null> | null = null

async function fetchSettings(): Promise<StoreSettings | null> {
  const { data } = await supabase.from('store_settings').select('*').single()
  return (data as StoreSettings | null) ?? null
}

export function getPublicSettings(): Promise<StoreSettings | null> {
  settingsPromise ??= fetchSettings()
  return settingsPromise
}

export function invalidateSettingsCache(): void {
  settingsPromise = null
}

function toPublicProduct(row: ProductRow): PublicProduct {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    short_description: row.short_description,
    description: row.description,
    price: Number(row.price),
    compare_price: row.compare_price,
    stock: Number(row.stock),
    category_id: row.category_id,
    image_url: row.image_url,
    featured: Boolean(row.featured),
    category: row.categories ?? null,
  }
}

const PUBLIC_PRODUCT_SELECT = `
  id, name, slug, short_description, description, price, compare_price,
  stock, category_id, image_url, featured,
  categories(id, name, slug, image_url)
`

export async function getPublicCategories(): Promise<PublicCategory[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, image_url')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as PublicCategory[]
}

export async function getPublicProducts(): Promise<PublicProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PUBLIC_PRODUCT_SELECT)
    .eq('active', true)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as ProductRow[]).map(toPublicProduct)
}

export async function getPublicProductBySlug(slug: string): Promise<PublicProductDetail | null> {
  const { data, error } = await supabase
    .from('products')
    .select(
      `${PUBLIC_PRODUCT_SELECT}, product_images(id, image_url, alt_text, sort_order)`,
    )
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (error) return null

  const row = data as unknown as ProductRow
  const { product_images = [], ...rest } = row
  return {
    ...toPublicProduct(rest),
    images: [...product_images].sort((a, b) => a.sort_order - b.sort_order),
  }
}

export async function createStoreOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const { data, error } = await supabase.rpc('create_order', {
    p_customer_name: input.customer_name,
    p_customer_phone: input.customer_phone,
    p_city: input.city ?? null,
    p_address: input.address ?? null,
    p_reference: input.reference ?? null,
    p_note: input.note ?? null,
    p_items: input.items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
    })),
  })

  if (error) throw new Error(error.message)
  return data as CreateOrderResult
}