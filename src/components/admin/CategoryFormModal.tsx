import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Category, CategoryFormInput } from '../../types'
import { slugify } from '../../utils/slug'
import { validateCategory } from '../../utils/validators'
import { friendlyError } from '../../utils/errors'
import { Button, Input, Textarea } from '../ui/primitives'
import { useToast } from '../../hooks/useToast'
import { createCategory, updateCategory } from '../../services/categories'
import { deleteFile, pathFromUrl, PRODUCTS_BUCKET, uploadFile } from '../../services/storage'

type Props = {
  open: boolean
  category?: Category | null
  onClose: () => void
  onSaved: () => void
}

function toInput(category?: Category | null): CategoryFormInput {
  return {
    name: category?.name ?? '',
    slug: category?.slug ?? '',
    description: category?.description ?? '',
    active: category?.active ?? true,
  }
}

export function CategoryFormModal({ open, category, onClose, onSaved }: Props) {
  const { toast } = useToast()
  const [input, setInput] = useState<CategoryFormInput>(() => toInput(category))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageRemoved, setImageRemoved] = useState(false)
  const [slugEdited, setSlugEdited] = useState(Boolean(category))
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setInput(toInput(category))
      setErrors({})
      setImageFile(null)
      setImageRemoved(false)
      setSlugEdited(Boolean(category))
    }
  }, [open, category])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(imageFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  function setField<K extends keyof CategoryFormInput>(key: K, value: CategoryFormInput[K]) {
    setInput((current) => ({ ...current, [key]: value }))
  }

  const shownUrl = previewUrl ?? (imageRemoved ? null : category?.image_url ?? null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const validationErrors = validateCategory(input)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSaving(true)
    try {
      let categoryId: string
      let imageUrl = imageRemoved ? null : category?.image_url ?? null

      if (category) {
        await updateCategory(category.id, input, imageUrl)
        categoryId = category.id
      } else {
        const created = await createCategory(input, imageUrl)
        categoryId = created.id
      }

      if (imageFile) {
        const { url, error } = await uploadFile(PRODUCTS_BUCKET, `categories/${categoryId}`, imageFile)
        if (error) throw new Error(error)
        if (category?.image_url) {
          const oldPath = pathFromUrl(PRODUCTS_BUCKET, category.image_url)
          if (oldPath) await deleteFile(PRODUCTS_BUCKET, oldPath)
        }
        await updateCategory(categoryId, input, url)
      } else if (imageRemoved && category?.image_url) {
        const oldPath = pathFromUrl(PRODUCTS_BUCKET, category.image_url)
        if (oldPath) await deleteFile(PRODUCTS_BUCKET, oldPath)
      }

      toast('success', category ? 'Categoría actualizada correctamente.' : 'Categoría creada correctamente.')
      onSaved()
      onClose()
    } catch (err) {
      toast('error', `Error al guardar la categoría: ${friendlyError(err)}`)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-label={category ? 'Editar categoría' : 'Nueva categoría'}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {category ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <Input
            label="Nombre"
            value={input.name}
            error={errors.name}
            onChange={(e) => {
              setField('name', e.target.value)
              if (!slugEdited) setField('slug', slugify(e.target.value))
            }}
          />
          <Input
            label="Slug"
            value={input.slug}
            error={errors.slug}
            onChange={(e) => {
              setSlugEdited(true)
              setField('slug', e.target.value)
            }}
          />
          <Textarea
            label="Descripción"
            rows={3}
            value={input.description}
            onChange={(e) => setField('description', e.target.value)}
          />

          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Imagen</p>
            <div className="flex items-start gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                {shownUrl ? (
                  <img src={shownUrl} alt="Vista previa" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-slate-400">Sin imagen</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  {shownUrl ? 'Reemplazar' : 'Subir imagen'}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setImageFile(file)
                        setImageRemoved(false)
                      }
                      e.target.value = ''
                    }}
                  />
                </label>
                {shownUrl && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setImageFile(null)
                      setImageRemoved(true)
                    }}
                  >
                    Quitar
                  </Button>
                )}
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={input.active}
              onChange={(e) => setField('active', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Categoría activa
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            {category ? 'Guardar cambios' : 'Crear categoría'}
          </Button>
        </div>
      </form>
    </div>
  )
}