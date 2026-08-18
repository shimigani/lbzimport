import { supabase } from '../lib/supabase'
import type { Product, ProductFormInput, ProductImage } from '../types'
import { deleteFile, pathFromUrl, PRODUCTS_BUCKET } from './storage'

export async function listProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(id, name, slug)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Product[]
}

export async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(id, name, slug)')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Product
}

export async function createProduct(input: ProductFormInput): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: input.name.trim(),
      slug: input.slug.trim(),
      short_description: input.short_description.trim() || null,
      description: input.description.trim() || null,
      price: Number(input.price) || 0,
      compare_price: input.compare_price !== '' ? Number(input.compare_price) : null,
      cost_price: input.cost_price !== '' ? Number(input.cost_price) : null,
      sku: input.sku.trim() || null,
      stock: Number(input.stock) || 0,
      category_id: input.category_id || null,
      active: input.active,
      featured: input.featured,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as Product
}

export async function updateProduct(id: string, input: ProductFormInput): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({
      name: input.name.trim(),
      slug: input.slug.trim(),
      short_description: input.short_description.trim() || null,
      description: input.description.trim() || null,
      price: Number(input.price) || 0,
      compare_price: input.compare_price !== '' ? Number(input.compare_price) : null,
      cost_price: input.cost_price !== '' ? Number(input.cost_price) : null,
      sku: input.sku.trim() || null,
      stock: Number(input.stock) || 0,
      category_id: input.category_id || null,
      active: input.active,
      featured: input.featured,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function updateProductImageUrl(id: string, imageUrl: string | null): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ image_url: imageUrl })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function toggleProductActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from('products').update({ active }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteProduct(id: string): Promise<void> {
  const [{ data: product }, { data: images }] = await Promise.all([
    supabase.from('products').select('image_url').eq('id', id).single(),
    supabase.from('product_images').select('image_url').eq('product_id', id),
  ])

  const paths: string[] = []
  const main = pathFromUrl(PRODUCTS_BUCKET, (product as Product | null)?.image_url)
  if (main) paths.push(main)
  for (const image of (images as ProductImage[] | null) ?? []) {
    const p = pathFromUrl(PRODUCTS_BUCKET, image.image_url)
    if (p) paths.push(p)
  }
  if (paths.length > 0) {
    await supabase.storage.from(PRODUCTS_BUCKET).remove(paths)
  }

  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function listProductImages(productId: string): Promise<ProductImage[]> {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as ProductImage[]
}

export async function addProductImage(
  productId: string,
  imageUrl: string,
  sortOrder: number,
): Promise<void> {
  const { error } = await supabase
    .from('product_images')
    .insert({ product_id: productId, image_url: imageUrl, sort_order: sortOrder })

  if (error) throw new Error(error.message)
}

export async function updateImageSort(id: string, sortOrder: number): Promise<void> {
  const { error } = await supabase
    .from('product_images')
    .update({ sort_order: sortOrder })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function deleteProductImage(image: ProductImage): Promise<void> {
  const storagePath = pathFromUrl(PRODUCTS_BUCKET, image.image_url)
  if (storagePath) {
    await deleteFile(PRODUCTS_BUCKET, storagePath)
  }
  const { error } = await supabase.from('product_images').delete().eq('id', image.id)
  if (error) throw new Error(error.message)
}