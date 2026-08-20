import { useRef, useState } from 'react'
import {
  buildWhatsAppMessage,
  WHATSAPP_PREVIEW_DATA,
  WHATSAPP_TEMPLATES,
  WHATSAPP_VARIABLES,
} from '../../lib/whatsapp'
import { Button } from '../ui/primitives'
import { EyeIcon, RefreshIcon } from '../store/icons'

type Props = {
  meta: (typeof WHATSAPP_TEMPLATES)[number]
  value: string
  defaultTemplate: string
  onChange: (next: string) => void
}

export function WhatsAppTemplateEditor({ meta, value, defaultTemplate, onChange }: Props) {
  const [preview, setPreview] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const copiedTimer = useRef<number | null>(null)

  const template = value.trim() ? value : defaultTemplate
  const variables = WHATSAPP_VARIABLES.filter((v) => meta.variables?.includes(v.name))

  async function copyVariable(name: string) {
    try {
      await navigator.clipboard.writeText(name)
      setCopied(name)
      if (copiedTimer.current) window.clearTimeout(copiedTimer.current)
      copiedTimer.current = window.setTimeout(() => setCopied(null), 1500)
    } catch {
      setCopied(null)
    }
  }

  function handleRestore() {
    if (window.confirm('¿Quieres restaurar el mensaje predeterminado?')) {
      onChange(defaultTemplate)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-2">
          <span className="text-lg leading-none" aria-hidden="true">
            {meta.emoji}
          </span>
          <div>
            <h5 className="text-sm font-semibold text-slate-800">{meta.title}</h5>
            <p className="mt-0.5 text-xs text-slate-500">{meta.description}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPreview((p) => !p)}>
            <EyeIcon className="h-4 w-4" />
            Vista previa
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRestore}>
            <RefreshIcon className="h-4 w-4" />
            Restaurar
          </Button>
        </div>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={7}
        aria-label={meta.title}
        placeholder="Escribe el mensaje usando las variables disponibles..."
        className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
      <p className="mt-1 text-right text-xs text-slate-400">{value.length} caracteres</p>

      <div className="mt-2 rounded-lg bg-white p-3">
        <p className="text-xs font-medium text-slate-600">
          Variables disponibles <span className="font-normal text-slate-400">(clic para copiar)</span>
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {variables.map((v) => (
            <button
              key={v.name}
              type="button"
              onClick={() => void copyVariable(v.name)}
              title={v.description}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50"
            >
              {v.name}
              {copied === v.name && (
                <span className="font-sans font-medium text-emerald-600">✓ Copiado</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {preview && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
          <p className="mb-2 text-xs font-medium text-slate-600">
            Vista previa <span className="font-normal text-slate-400">(datos de ejemplo)</span>
          </p>
          <div className="whitespace-pre-wrap rounded-lg bg-slate-100 p-3 text-sm leading-relaxed text-slate-800">
            {buildWhatsAppMessage(template, WHATSAPP_PREVIEW_DATA)}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            La vista previa no envía ningún mensaje a WhatsApp.
          </p>
        </div>
      )}
    </div>
  )
}