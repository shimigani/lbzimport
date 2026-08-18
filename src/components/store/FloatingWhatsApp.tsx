import { useEffect, useState } from 'react'
import { getPublicSettings } from '../../services/store'
import { WhatsAppIcon } from './icons'
import type { StoreSettings } from '../../types'

function FloatingWhatsApp() {
  const [settings, setSettings] = useState<StoreSettings | null>(null)

  useEffect(() => {
    let mounted = true
    getPublicSettings().then((loaded) => {
      if (mounted) setSettings(loaded)
    })
    return () => {
      mounted = false
    }
  }, [])

  const whatsapp = settings?.whatsapp_number?.replace(/\D/g, '')

  if (!settings?.floating_whatsapp_enabled || !whatsapp) return null

  return (
    <a
      href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hola, me gustaría más información.')}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition hover:scale-105 hover:bg-emerald-600"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  )
}

export default FloatingWhatsApp