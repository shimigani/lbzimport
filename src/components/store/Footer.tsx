import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { getPublicSettings } from '../../services/store'
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from './icons'
import { buildGeneralContactMessage, buildWhatsAppHref } from '../../lib/whatsapp'
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
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-ink-muted transition hover:border-gold/50 hover:bg-white/5 hover:text-gold"
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
  const whatsapp = settings?.whatsapp_number?.replace(/\D/g, '')
  const waHref = whatsapp
    ? buildWhatsAppHref(whatsapp, buildGeneralContactMessage(settings))
    : null

  return (
    <footer className="mt-14 border-t border-white/10 bg-[#08080a]">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <Link to="/" className="flex items-center gap-2">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt={brand} className="h-10 w-auto object-contain" />
              ) : (
                <span className="text-lg font-bold text-gold">{brand}</span>
              )}
            </Link>
            {settings?.description && (
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">
                {settings.description}
              </p>
            )}
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Escríbenos
              </a>
            )}
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink">
              Navegación
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-ink-muted transition hover:text-gold">
                  Inicio
                </Link>
              </li>
              <li>
                <a href="/#catalogo" className="text-ink-muted transition hover:text-gold">
                  Catálogo
                </a>
              </li>
              <li>
                <a href="/#ofertas" className="text-ink-muted transition hover:text-gold">
                  Ofertas
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink">
              Contacto
            </h3>
            {whatsapp && (
              <p className="mb-3 text-sm text-ink-muted">
                WhatsApp: <span className="font-medium text-ink">+{whatsapp}</span>
              </p>
            )}
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

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-ink-muted/60">
          &copy; {new Date().getFullYear()} {brand}. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
}

export default Footer