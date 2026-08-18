import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getPublicCategories, getPublicProducts, getPublicSettings } from '../services/store'
import type { PublicCategory, PublicProduct } from '../services/store'
import { friendlyError } from '../utils/errors'
import { useSeo } from '../hooks/useSeo'
import { DEFAULT_PRIMARY, DEFAULT_SECONDARY } from '../utils/theme'
import ProductCard from '../components/store/ProductCard'
import { Alert, EmptyState, Skeleton } from '../components/ui/primitives'
import type { StoreSettings } from '../types'

function Home() {
  const [searchParams] = useSearchParams()
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
  const primary = settings?.primary_color ?? DEFAULT_PRIMARY
  const secondary = settings?.secondary_color ?? DEFAULT_SECONDARY

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return products.filter((product) => {
      const okCategory = categoryId === 'all' || product.category_id === categoryId
      const okSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        (product.short_description?.toLowerCase().includes(term) ?? false) ||
        (product.description?.toLowerCase().includes(term) ?? false)
      return okCategory && okSearch
    })
  }, [products, categoryId, q])

  const featured = useMemo(() => products.filter((product) => product.featured), [products])
  const offers = useMemo(
    () => products.filter((product) => product.compare_price != null && product.compare_price > product.price),
    [products],
  )

  function selectCategory(id: string) {
    setCategoryId(id)
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-12">
      <section
        className="rounded-3xl px-6 py-12 text-center text-white sm:py-16"
        style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
      >
        {settings?.logo_url && (
          <img
            src={settings.logo_url}
            alt={storeName}
            className="mx-auto mb-4 h-20 w-auto object-contain drop-shadow"
          />
        )}
        <h1 className="text-3xl font-bold sm:text-4xl">
          {settings?.welcome_text ?? storeName}
        </h1>
        {settings?.description && (
          <p className="mx-auto mt-3 max-w-xl text-white/85">{settings.description}</p>
        )}
        <a
          href="#catalogo"
          className="mt-6 inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold shadow transition hover:bg-slate-50 active:scale-[0.98]"
          style={{ color: primary }}
        >
          Ver productos
        </a>
      </section>

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <SkeletonGrid />
      ) : (
        <>
          {categories.length > 0 && (
            <section aria-label="Categorías">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Categorías</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => selectCategory(category.id)}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-left transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="h-24 overflow-hidden bg-slate-100 sm:h-28">
                      {category.image_url ? (
                        <img
                          src={category.image_url}
                          alt={category.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-slate-200">
                          {category.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="truncate px-3 py-2.5 text-sm font-medium text-gray-800">
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {featured.length > 0 && (
            <section aria-label="Productos destacados">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Destacados</h2>
              <ProductGrid products={featured} currency={currency} primaryColor={primary} />
            </section>
          )}

          {offers.length > 0 && (
            <section id="ofertas" aria-label="Ofertas">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Ofertas</h2>
              <ProductGrid products={offers} currency={currency} primaryColor={primary} />
            </section>
          )}

          <section id="catalogo" aria-label="Catálogo de productos">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Catálogo</h2>

            {categories.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryId('all')}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    categoryId === 'all'
                      ? 'text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={categoryId === 'all' ? { backgroundColor: primary } : undefined}
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
                        ? 'text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    style={categoryId === category.id ? { backgroundColor: primary } : undefined}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}

            {filtered.length === 0 ? (
              q.trim() ? (
                <EmptyState
                  title="No encontramos productos para tu búsqueda."
                  description={`No hay resultados para "${q.trim()}". Prueba con otro término.`}
                />
              ) : (
                <EmptyState
                  title="Aún no hay productos"
                  description="La tienda aún no tiene productos publicados. Vuelve pronto."
                />
              )
            ) : (
              <ProductGrid products={filtered} currency={currency} primaryColor={primary} />
            )}
          </section>
        </>
      )}
    </div>
  )
}

function ProductGrid({
  products,
  currency,
  primaryColor,
}: {
  products: PublicProduct[]
  currency: string
  primaryColor: string
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          currency={currency}
          primaryColor={primaryColor}
        />
      ))}
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default Home