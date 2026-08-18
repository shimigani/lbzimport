import type { ProductImage } from '../types'

export type GalleryImage = {
  key: string
  id?: string
  url?: string
  file?: File
  sort_order: number
  row?: ProductImage
}

export function toGalleryImages(existing: ProductImage[]): GalleryImage[] {
  return existing.map((img) => ({
    key: img.id,
    id: img.id,
    url: img.image_url,
    sort_order: img.sort_order,
    row: img,
  }))
}