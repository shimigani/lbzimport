import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { getPublicSettings } from '../../services/store'
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from './icons'
import { DEFAULT_PRIMARY } from '../../utils/theme'
import type { StoreSettings } from '../../types'

type SocialLinkProps = {
  href: string
  label: string
  children: ReactNode
}

function SocialLink({ href, label, children }: SocialLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
    >
      {children}
    </a>
  )
}

function Footer() {
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

  const brand = settings?.store_name ?? 'Mi Tienda'
  const brandColor = settings?.primary_color ?? DEFAULT_PRIMARY
  const whatsapp = settings?.whatsapp_number?.replace(/\D/g, '')
  const waHref = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent('Hola, me gustaría más información.')}`
    : null

  return (
    <footer className="mt-12 border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <Link to="/" className="flex items-center gap-2">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt={brand} className="h-10 w-auto object-contain" />
              ) : (
                <span className="text-lg font-bold" style={{ color: brandColor }}>
                  {brand}
                </span>
              )}
            </Link>
            {settings?.description && (
              <p className="mt-3 max-w-xs text-sm text-slate-500">{settings.description}</p>
            )}
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Navegación</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-slate-500 hover:text-slate-900">
                  Inicio
                </Link>
              </li>
              <li>
                <a href="/#catalogo" className="text-slate-500 hover:text-slate-900">
                  Catálogo
                </a>
              </li>
              <li>
                <a href="/#ofertas" className="text-slate-500 hover:text-slate-900">
                  Ofertas
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Contacto</h3>
            <div className="flex items-center gap-1">
              {waHref && (
                <SocialLink href={waHref} label="WhatsApp">
                  <WhatsAppIcon className="h-5 w-5" />
                </SocialLink>
              )}
              {settings?.facebook_url && (
                <SocialLink href={settings.facebook_url} label="Facebook">
                  <FacebookIcon className="h-5 w-5" />
                </SocialLink>
              )}
              {settings?.instagram_url && (
                <SocialLink href={settings.instagram_url} label="Instagram">
                  <InstagramIcon className="h-5 w-5" />
                </SocialLink>
              )}
              {settings?.tiktok_url && (
                <SocialLink href={settings.tiktok_url} label="TikTok">
                  <TikTokIcon className="h-5 w-5" />
                </SocialLink>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} {brand}. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
}

export default Footer