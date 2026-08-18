import { useRef } from 'react'
import type { GalleryImage } from '../../utils/gallery'

type Props = {
  images: GalleryImage[]
  onChange: (images: GalleryImage[]) => void
}

function newKey(): string {
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function ProductImages({ images, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const next: GalleryImage[] = []
    for (const file of Array.from(files)) {
      next.push({ key: newKey(), file, sort_order: images.length + next.length })
    }
    onChange([...images, ...next])
  }

  function remove(index: number) {
    onChange(images.filter((_, i) => i !== index))
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= images.length) return
    const next = [...images]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    onChange(next)
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <p className="text-sm text-slate-500">Aún no hay imágenes en la galería.</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Subir imágenes
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => (
          <div
            key={image.key}
            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
          >
            {image.file ? (
              <img
                src={URL.createObjectURL(image.file)}
                alt="Vista previa"
                className="h-28 w-full object-cover"
              />
            ) : (
              <img
                src={image.url}
                alt="Imagen del producto"
                className="h-28 w-full object-cover"
              />
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-slate-900/70 to-transparent p-1.5">
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className="rounded bg-white/90 px-1.5 py-0.5 text-xs text-slate-700 hover:bg-white disabled:opacity-40"
                  aria-label="Subir"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={index === images.length - 1}
                  onClick={() => move(index, 1)}
                  className="rounded bg-white/90 px-1.5 py-0.5 text-xs text-slate-700 hover:bg-white disabled:opacity-40"
                  aria-label="Bajar"
                >
                  ↓
                </button>
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                className="rounded bg-white/90 px-1.5 py-0.5 text-xs font-semibold text-red-600 hover:bg-white"
                aria-label="Eliminar imagen"
              >
                ✕
              </button>
            </div>
            {image.file && (
              <span className="absolute right-1.5 top-1.5 rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                nuevo
              </span>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
      >
        + Agregar más imágenes
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <p className="text-xs text-slate-500">
        JPG, PNG, WebP o GIF · Máximo 5 MB por imagen. Usa las flechas para ordenar.
      </p>
    </div>
  )
}