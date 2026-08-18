import { supabase } from '../lib/supabase'
import type { Category, CategoryFormInput } from '../types'
import { deleteFile, pathFromUrl, PRODUCTS_BUCKET } from './storage'

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Category[]
}

export async function createCategory(
  input: CategoryFormInput,
  imageUrl: string | null,
): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: input.name.trim(),
      slug: input.slug.trim(),
      description: input.description.trim() || null,
      image_url: imageUrl,
      active: input.active,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as Category
}

export async function updateCategory(
  id: string,
  input: CategoryFormInput,
  imageUrl: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update({
      name: input.name.trim(),
      slug: input.slug.trim(),
      description: input.description.trim() || null,
      image_url: imageUrl,
      active: input.active,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function toggleCategoryActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from('categories').update({ active }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteCategory(category: Category): Promise<void> {
  const storagePath = pathFromUrl(PRODUCTS_BUCKET, category.image_url)
  if (storagePath) {
    await deleteFile(PRODUCTS_BUCKET, storagePath)
  }
  const { error } = await supabase.from('categories').delete().eq('id', category.id)
  if (error) throw new Error(error.message)
}