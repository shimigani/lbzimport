export type ProfileRole = 'admin' | 'customer'

export type Profile = {
  id: string
  full_name: string
  role: ProfileRole
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export type Product = {
  id: string
  name: string
  slug: string
  short_description: string | null
  description: string | null
  price: number
  compare_price: number | null
  cost_price: number | null
  sku: string | null
  stock: number
  category_id: string | null
  image_url: string | null
  active: boolean
  featured: boolean
  created_at: string
  updated_at: string
  category?: Pick<Category, 'id' | 'name' | 'slug'> | null
}

export type ProductImage = {
  id: string
  product_id: string
  image_url: string
  alt_text: string | null
  sort_order: number
  created_at: string
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'paid'
  | 'preparing'
  | 'shipped'
  | 'completed'
  | 'cancelled'

export type Order = {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  city: string | null
  address: string | null
  reference: string | null
  note: string | null
  subtotal: number
  total: number
  status: OrderStatus
  created_at: string
  updated_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  created_at: string
}

export type OrderWithItems = Order & {
  items: OrderItem[]
}

export type StoreCurrency = 'BOB' | 'USD'

export type WhatsAppMessageKey =
  | 'order_cod'
  | 'order_qr'
  | 'order_whatsapp'
  | 'proof_qr'
  | 'product_inquiry'
  | 'contact_customer'
  | 'general_contact'

export type WhatsAppMessages = Partial<Record<WhatsAppMessageKey, string>>

export type StoreSettings = {
  id: string
  store_name: string
  description: string | null
  logo_url: string | null
  social_image_url: string | null
  whatsapp_number: string | null
  facebook_url: string | null
  instagram_url: string | null
  tiktok_url: string | null
  qr_payment_url: string | null
  payment_instructions: string | null
  payment_account_name: string | null
  payment_bank_name: string | null
  payment_account_number: string | null
  payment_account_type: string | null
  primary_color: string
  secondary_color: string
  welcome_text: string | null
  floating_whatsapp_enabled: boolean
  currency: StoreCurrency
  tiktok_pixel_id: string | null
  meta_pixel_id: string | null
  google_analytics_id: string | null
  whatsapp_messages: WhatsAppMessages | null
  created_at: string
  updated_at: string
}

export type ProductFormInput = {
  name: string
  slug: string
  short_description: string
  description: string
  price: string
  compare_price: string
  cost_price: string
  sku: string
  stock: string
  category_id: string
  active: boolean
  featured: boolean
}

export type CategoryFormInput = {
  name: string
  slug: string
  description: string
  active: boolean
}