import { useRef, useState } from 'react'
import { Button, Spinner } from '../ui/primitives'
import { validateImageFile } from '../../services/storage'

type Props = {
  label: string
  url: string | null
  uploading: boolean
  hint?: string
  onUpload: (file: File) => Promise<void>
  onRemove: () => void
}

export function AssetImageField({ label, url, uploading, hint, onUpload, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    const validationError = validateImageFile(file)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    await onUpload(file)
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700">{label}</p>
      <div className="flex items-start gap-4">
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          {url ? (
            <img src={url} alt={label} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-slate-400">Sin imagen</span>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Spinner />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            size="sm"
            loading={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {url ? 'Reemplazar' : 'Subir imagen'}
          </Button>
          {url && (
            <Button variant="danger" size="sm" onClick={onRemove}>
              Eliminar
            </Button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
              e.target.value = ''
            }}
          />
          {hint && <p className="text-xs text-slate-500">{hint}</p>}
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}