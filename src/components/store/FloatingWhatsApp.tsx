import { useEffect, useState } from 'react'
import { getPublicSettings } from '../../services/store'
import { useCart } from '../../hooks/useCart'
import { WhatsAppIcon } from './icons'
import { buildGeneralContactMessage, buildWhatsAppHref } from '../../lib/whatsapp'
import type { StoreSettings } from '../../types'

function FloatingWhatsApp() {
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const { count } = useCart()

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
  const cartVisible = count > 0

  if (!settings?.floating_whatsapp_enabled || !whatsapp) return null

  return (
    <a
      href={buildWhatsAppHref(whatsapp, buildGeneralContactMessage(settings))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
      className={`fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-white/20 transition hover:scale-105 hover:bg-emerald-600 ${
        cartVisible ? 'bottom-24 sm:bottom-5' : 'bottom-5'
      }`}
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  )
}

export default FloatingWhatsApp