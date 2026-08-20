import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getPublicCategories, getPublicProducts, getPublicSettings } from '../services/store'
import type { PublicCategory, PublicProduct } from '../services/store'
import { friendlyError } from '../utils/errors'
import { useSeo } from '../hooks/useSeo'
import ProductCard from '../components/store/ProductCard'
import { Alert } from '../components/ui/primitives'
import {
  ArrowRightIcon,
  ChatIcon,
  PackageIcon,
  TruckIcon,
  WhatsAppIcon,
} from '../components/store/icons'
import { buildGeneralContactMessage, buildWhatsAppHref } from '../lib/whatsapp'
import type { StoreSettings } from '../types'

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
    </div>
  )
}

function BenefitItem({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="animate-fade-in-up flex items-start gap-3 rounded-2xl border border-white/10 bg-surface p-4 shadow-lg shadow-black/20 transition duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-xl hover:shadow-black/30">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{description}</p>
      </div>
    </div>
  )
}

function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''

  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [categories, setCategories] = useState<PublicCategory[]>([])
  const [products, setProducts] = useState<PublicProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState('all')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [settings, categories, products] = await Promise.all([
          getPublicSettings(),
          getPublicCategories(),
          getPublicProducts(),
        ])
        if (!mounted) return
        setSettings(settings)
        setCategories(categories)
        setProducts(products)
      } catch (err) {
        if (mounted) setError(friendlyError(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => {
      mounted = false
    }
  }, [])

  const storeName = settings?.store_name ?? 'Mi Tienda'

  useSeo({
    title: `${storeName} | Tienda`,
    description: settings?.description ?? undefined,
    image: settings?.social_image_url ?? undefined,
    canonical: window.location.origin,
    favicon: settings?.logo_url ?? undefined,
  })

  const currency = settings?.currency ?? 'BOB'
  const whatsapp = settings?.whatsapp_number?.replace(/\D/g, '')

  useEffect(() => {
    setCategoryId('all')
  }, [q])

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const product of products) {
      if (product.category_id) {
        counts.set(product.category_id, (counts.get(product.category_id) ?? 0) + 1)
      }
    }
    return counts
  }, [products])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return products.filter((product) => {
      const okCategory = categoryId === 'all' || product.category_id === categoryId
      const okSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        (product.short_description?.toLowerCase().includes(term) ?? false) ||
        (product.description?.toLowerCase().includes(term) ?? false) ||
        (product.category?.name.toLowerCase().includes(term) ?? false)
      return okCategory && okSearch
    })
  }, [products, categoryId, q])

  const offers = useMemo(
    () => products.filter((product) => product.compare_price != null && product.compare_price > product.price),
    [products],
  )

  function selectCategory(id: string) {
    setCategoryId(id)
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const benefits = [
    {
      icon: <WhatsAppIcon className="h-5 w-5" />,
      title: 'Pedido por WhatsApp',
      description: 'Agrega tus productos y pide directo por WhatsApp.',
    },
    {
      icon: <TruckIcon className="h-5 w-5" />,
      title: 'Entrega coordinada',
      description: 'Coordinamos la entrega contigo por WhatsApp.',
    },
    {
      icon: <ChatIcon className="h-5 w-5" />,
      title: 'Atención por WhatsApp',
      description: 'Te atendemos directo por WhatsApp.',
    },
    {
      icon: <PackageIcon className="h-5 w-5" />,
      title: 'Productos disponibles',
      description: 'Compra con la seguridad de que tu pedido existe.',
    },
  ]

  return (
    <div className="space-y-12 sm:space-y-16">
      <section
        className="animate-fade-in-up relative overflow-hidden rounded-3xl border border-white/10 px-6 py-14 text-center sm:py-20"
        style={{
          background:
            'radial-gradient(80% 120% at 50% -10%, rgba(212, 175, 55, 0.18), transparent 60%), radial-gradient(60% 80% at 90% 110%, rgba(212, 175, 55, 0.08), transparent 55%), linear-gradient(160deg, #1d1d22 0%, #0b0b0d 75%)',
        }}
      >
        {settings?.logo_url && (
          <img
            src={settings.logo_url}
            alt={storeName}
            className="mx-auto mb-5 h-24 w-auto object-contain drop-shadow"
          />
        )}
        <span className="mx-auto inline-flex rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-light">
          Tienda en línea
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {settings?.welcome_text ?? storeName}
        </h1>
        {settings?.description && (
          <p className="mx-auto mt-4 max-w-xl text-ink-muted">{settings.description}</p>
        )}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#catalogo"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-night shadow-lg shadow-gold/20 transition hover:bg-gold-light active:scale-[0.98] sm:w-auto"
          >
            Ver productos
            <ArrowRightIcon className="h-4 w-4" />
          </a>
          {whatsapp && (
            <a
              href={buildWhatsAppHref(whatsapp, buildGeneralContactMessage(settings))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gold/40 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-gold/10 active:scale-[0.98] sm:w-auto"
            >
              <ChatIcon className="h-4 w-4" />
              Contacto por WhatsApp
            </a>
          )}
        </div>
      </section>

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <SkeletonGrid />
      ) : (
        <>
          <section aria-label="Por qué comprar con nosotros">
            <SectionHeader
              title="¿Por qué comprar con nosotros?"
              subtitle="Todo lo que necesitas para una compra rápida y segura."
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map((benefit) => (
                <BenefitItem key={benefit.title} {...benefit} />
              ))}
            </div>
          </section>

          {offers.length > 0 && (
            <section id="ofertas" aria-label="Ofertas">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/40" />
                <SectionHeader title="🔥 Ofertas" subtitle="Aprovecha precios especiales." />
                <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/40" />
              </div>
              <ProductGrid products={offers} currency={currency} />
            </section>
          )}

          <section id="catalogo" aria-label="Catálogo de productos">
            <SectionHeader
              title="🛍️ Todos nuestros productos"
              subtitle={q.trim() ? `Resultados para "${q.trim()}"` : 'Explora todos nuestros productos.'}
            />

            {categories.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryId('all')}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    categoryId === 'all'
                      ? 'bg-gold text-night shadow-sm shadow-gold/20'
                      : 'bg-surface-2 text-ink-muted hover:bg-white/10 hover:text-ink'
                  }`}
                >
                  Todas
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategoryId(category.id)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                      categoryId === category.id
                        ? 'bg-gold text-night shadow-sm shadow-gold/20'
                        : 'bg-surface-2 text-ink-muted hover:bg-white/10 hover:text-ink'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-xl">
                  📦
                </div>
                <h3 className="text-sm font-semibold text-ink">
                  {q.trim() ? 'No encontramos productos' : 'Aún no hay productos'}
                </h3>
                <p className="max-w-sm text-sm text-ink-muted">
                  {q.trim()
                    ? `No hay resultados para "${q.trim()}". Prueba con otro término.`
                    : 'La tienda aún no tiene productos publicados. Vuelve pronto.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryId('all')
                    setSearchParams({})
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-night transition hover:bg-gold-light active:scale-[0.98]"
                >
                  Ver todos los productos
                </button>
              </div>
            ) : (
              <ProductGrid products={filtered} currency={currency} />
            )}
          </section>

          {categories.length > 0 && (
            <section aria-label="Comprar por categoría">
              <SectionHeader
                title="🛍️ Comprar por categorías"
                subtitle="Encuentra rápido lo que buscas."
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {categories.map((category) => {
                  const count = categoryCounts.get(category.id) ?? 0
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => selectCategory(category.id)}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface text-left shadow-lg shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-xl hover:shadow-black/30"
                    >
                      <div className="relative h-24 overflow-hidden bg-surface-2 sm:h-28">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.05]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-ink-muted/30">
                            {category.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-night/70 to-transparent" />
                        {count > 0 && (
                          <span className="absolute right-2 top-2 rounded-full border border-gold/40 bg-night/80 px-2 py-0.5 text-[11px] font-semibold text-gold-light shadow-sm">
                            {count} {count === 1 ? 'producto' : 'productos'}
                          </span>
                        )}
                      </div>
                      <span className="truncate px-3 py-2.5 text-sm font-medium text-ink">
                        {category.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function ProductGrid({
  products,
  currency,
}: {
  products: PublicProduct[]
  currency: string
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} currency={currency} />
      ))}
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-surface">
          <div className="animate-pulse aspect-square w-full bg-surface-2" />
          <div className="space-y-2 p-3">
            <div className="animate-pulse h-3 w-1/2 rounded-md bg-white/10" />
            <div className="animate-pulse h-4 w-3/4 rounded-md bg-white/10" />
            <div className="animate-pulse h-4 w-1/3 rounded-md bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default Home