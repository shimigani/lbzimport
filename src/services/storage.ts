import { supabase } from '../lib/supabase'

export const PRODUCTS_BUCKET = 'products'
export const STORE_ASSETS_BUCKET = 'store-assets'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
export const MAX_IMAGE_SIZE_MB = 5

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Solo se permiten imágenes (JPG, PNG, WebP, GIF).'
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return `La imagen supera el tamaño máximo de ${MAX_IMAGE_SIZE_MB} MB.`
  }
  return null
}

function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot >= 0 ? name.slice(dot).toLowerCase() : ''
}

export async function uploadFile(
  bucket: string,
  folder: string,
  file: File,
): Promise<{ url: string; error: string | null }> {
  const validationError = validateImageFile(file)
  if (validationError) {
    return { url: '', error: validationError }
  }

  const extension = fileExtension(file.name)
  const path = `${folder}/${crypto.randomUUID()}${extension}`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: '3600', upsert: true })

  if (error) {
    return { url: '', error: error.message }
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export function pathFromUrl(bucket: string, url: string | null | undefined): string | null {
  if (!url) return null
  const marker = `/object/public/${bucket}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  const path = url.slice(index + marker.length)
  return path.split('?')[0] || null
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) {
    throw new Error(error.message)
  }
}