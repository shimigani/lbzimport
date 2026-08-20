import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getPublicSettings } from '../../services/store'
import { useCart } from '../../hooks/useCart'
import { useAuth } from '../../hooks/useAuth'
import { CartIcon, MenuIcon, SearchIcon, WhatsAppIcon } from './icons'
import { buildGeneralContactMessage, buildWhatsAppHref } from '../../lib/whatsapp'
import type { StoreSettings } from '../../types'

function Header() {
  const navigate = useNavigate()
  const { count, openCart } = useCart()
  const { isAdmin, loading: authLoading } = useAuth()
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
  const whatsapp = settings?.whatsapp_number?.replace(/\D/g, '')

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    const query = term.trim()
    navigate(query ? `/?q=${encodeURIComponent(query)}` : '/')
    setMenuOpen(false)
  }

  const waHref = whatsapp
    ? buildWhatsAppHref(whatsapp, buildGeneralContactMessage(settings))
    : null

  function scrollToCatalog() {
    setMenuOpen(false)
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const searchInput = (
    <input
      type="search"
      value={term}
      onChange={(e) => setTerm(e.target.value)}
      placeholder="Buscar productos..."
      aria-label="Buscar productos"
      className="w-full rounded-full border border-white/10 bg-surface-2 py-2 pl-9 pr-4 text-sm text-ink placeholder:text-ink-muted/70 outline-none transition focus:border-gold/40 focus:bg-surface focus:ring-2 focus:ring-gold/30"
    />
  )

  const navLinkClass =
    'rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-white/5 hover:text-gold'

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-night/85 shadow-lg shadow-black/20 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2" aria-label={brand}>
          {settings?.logo_url ? (
            <img
              src={settings.logo_url}
              alt={brand}
              className="h-10 w-auto max-w-36 object-contain drop-shadow"
            />
          ) : (
            <span className="truncate text-lg font-bold text-gold">{brand}</span>
          )}
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegación principal">
          <Link to="/" className={navLinkClass}>
            Inicio
          </Link>
          <button type="button" onClick={scrollToCatalog} className={navLinkClass}>
            Categorías
          </button>
          {isAdmin && (
            <Link to="/admin" className={navLinkClass}>
              Panel
            </Link>
          )}
        </nav>

        <form
          onSubmit={handleSearch}
          role="search"
          className="relative mx-auto hidden w-full max-w-md flex-1 sm:block"
        >
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted/70">
            <SearchIcon className="h-4 w-4" />
          </span>
          {searchInput}
        </form>

        <nav className="ml-auto flex items-center gap-1 sm:ml-0" aria-label="Acciones">
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Escribir por WhatsApp"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-ink-muted transition hover:bg-white/5 hover:text-gold sm:flex"
            >
              <WhatsAppIcon className="h-5 w-5" />
            </a>
          )}
          <button
            type="button"
            onClick={openCart}
            aria-label={`Ver carrito (${count} ${count === 1 ? 'producto' : 'productos'})`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-muted transition hover:bg-white/5 hover:text-gold"
          >
            <CartIcon className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-xs font-bold text-night">
                {count}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-muted transition hover:bg-white/5 hover:text-gold lg:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </nav>
      </div>

      <div className="border-t border-white/10 px-4 py-2 sm:hidden">
        <form onSubmit={handleSearch} role="search" className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted/70">
            <SearchIcon className="h-4 w-4" />
          </span>
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar productos..."
            aria-label="Buscar productos"
            className="w-full rounded-full border border-white/10 bg-surface-2 py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-ink-muted/70 outline-none transition focus:border-gold/40 focus:bg-surface focus:ring-2 focus:ring-gold/30"
          />
        </form>
      </div>

      {menuOpen && (
        <nav
          className="animate-fade-in border-t border-white/10 bg-surface px-4 py-3 lg:hidden"
          aria-label="Menú móvil"
        >
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-white/5 hover:text-gold"
          >
            Inicio
          </Link>
          <button
            type="button"
            onClick={scrollToCatalog}
            className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink transition hover:bg-white/5 hover:text-gold"
          >
            Categorías
          </button>
          {isAdmin && !authLoading && (
            <Link
              to="/admin"
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-white/5 hover:text-gold"
            >
              Panel administrativo
            </Link>
          )}
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-white/5 hover:text-gold"
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