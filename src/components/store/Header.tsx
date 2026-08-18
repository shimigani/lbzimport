import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getPublicSettings } from '../../services/store'
import { useCart } from '../../hooks/useCart'
import { CartIcon, MenuIcon, SearchIcon, WhatsAppIcon } from './icons'
import { DEFAULT_PRIMARY } from '../../utils/theme'
import type { StoreSettings } from '../../types'

function Header() {
  const navigate = useNavigate()
  const { count, openCart } = useCart()
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [term, setTerm] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

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

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    const query = term.trim()
    navigate(query ? `/?q=${encodeURIComponent(query)}` : '/')
    setMenuOpen(false)
  }

  const waHref = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent('Hola, me gustaría más información.')}`
    : null

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2" aria-label={brand}>
          {settings?.logo_url ? (
            <img
              src={settings.logo_url}
              alt={brand}
              className="h-10 w-auto max-w-36 object-contain"
            />
          ) : (
            <span className="truncate text-lg font-bold" style={{ color: brandColor }}>
              {brand}
            </span>
          )}
        </Link>

        <form
          onSubmit={handleSearch}
          role="search"
          className="relative mx-auto hidden w-full max-w-md flex-1 sm:block"
        >
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <SearchIcon className="h-4 w-4" />
          </span>
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar productos..."
            aria-label="Buscar productos"
            className="w-full rounded-full border border-gray-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-gray-900 outline-none transition focus:border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-300"
          />
        </form>

        <nav className="ml-auto flex items-center gap-1 sm:ml-0" aria-label="Navegación">
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Escribir por WhatsApp"
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <WhatsAppIcon className="h-5 w-5" />
            </a>
          )}
          <button
            type="button"
            onClick={openCart}
            aria-label={`Abrir carrito (${count} artículos)`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <CartIcon className="h-5 w-5" />
            {count > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold text-white"
                style={{ backgroundColor: brandColor }}
              >
                {count}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </nav>
      </div>

      <div className="border-t border-gray-100 px-4 py-2 sm:hidden">
        <form onSubmit={handleSearch} role="search" className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <SearchIcon className="h-4 w-4" />
          </span>
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar productos..."
            aria-label="Buscar productos"
            className="w-full rounded-full border border-gray-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-gray-900 outline-none focus:border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-300"
          />
        </form>
      </div>

      {menuOpen && (
        <nav
          className="animate-fade-in border-t border-gray-100 bg-white px-4 py-2 lg:hidden"
          aria-label="Menú móvil"
        >
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-slate-50"
          >
            Inicio
          </Link>
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-slate-50"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Contacto por WhatsApp
            </a>
          )}
        </nav>
      )}
    </header>
  )
}

export default Header