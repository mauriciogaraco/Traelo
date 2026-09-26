import { useEffect, useMemo } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { BusinessCard } from '../components/catalog/BusinessCard'
import { HomeSkeleton } from '../components/catalog/CatalogSkeletons'
import { CategoryCard } from '../components/catalog/CategoryCard'
import { HeroBusinessCarousel } from '../components/catalog/HeroBusinessCarousel'
import { ProductCard } from '../components/catalog/ProductCard'
import { SearchLink } from '../components/catalog/SearchBar'
import { Rail, Section } from '../components/catalog/Section'
import { ShareSection } from '../components/home/ShareSection'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import {
  businessOrdersWeek,
  findBusinessByLegacyId,
  isSoldOut,
  productUnitsWeek,
  sortBusinessesByWeeklyOrders,
  sortProductsByWeeklyUnits,
  topIds,
} from '../features/catalog'
import { useQuickAdd } from '../hooks/useQuickAdd'
import { refreshFeaturedProducts } from '../services/featuredProductsService'
import { refreshCatalogStats } from '../services/statsService'
import { syncCatalog } from '../services/catalogSync'
import { useCatalogStore } from '../store/catalogStore'
import { useFeaturedProductsStore } from '../store/featuredProductsStore'
import { useStatsStore } from '../store/statsStore'

const TOP_PRODUCTS_LIMIT = 10
const TOP_BUSINESSES_LIMIT = 10

/**
 * Home — `HomeScreen` de mobile: hero con buscador, categorías, ofertas destacadas, top negocios y
 * productos top de la semana. Todo sale del catálogo guardado + estadísticas del backend.
 */
export function HomePage() {
  const categories = useCatalogStore((state) => state.categories)
  const businesses = useCatalogStore((state) => state.businesses)
  const products = useCatalogStore((state) => state.products)
  const hydrated = useCatalogStore((state) => state.hydrated)
  const isSyncing = useCatalogStore((state) => state.isSyncing)
  const isOffline = useCatalogStore((state) => state.isOffline)
  const syncError = useCatalogStore((state) => state.syncError)
  const stats = useStatsStore((state) => state.stats)
  const featuredProducts = useFeaturedProductsStore((state) => state.products)
  const quickAdd = useQuickAdd()
  const legacyRedirect = useLegacyHomeRedirect()

  useEffect(() => {
    void refreshCatalogStats()
    void refreshFeaturedProducts()
  }, [])

  // "Top Negocios" / "Productos top": popularidad de la ÚLTIMA SEMANA, solo los que sí vendieron.
  const topBusinesses = useMemo(
    () =>
      sortBusinessesByWeeklyOrders(businesses, stats)
        .filter((business) => businessOrdersWeek(business, stats) > 0)
        .slice(0, TOP_BUSINESSES_LIMIT),
    [businesses, stats],
  )
  const topProducts = useMemo(
    () =>
      sortProductsByWeeklyUnits(products, stats)
        .filter((product) => productUnitsWeek(product, stats) > 0 && !isSoldOut(product))
        .slice(0, TOP_PRODUCTS_LIMIT),
    [products, stats],
  )
  const popularBusinessIds = useMemo(() => topIds(topBusinesses, (b) => businessOrdersWeek(b, stats)), [topBusinesses, stats])
  const popularProductIds = useMemo(() => topIds(topProducts, (p) => productUnitsWeek(p, stats)), [topProducts, stats])

  if (legacyRedirect) return legacyRedirect

  if (!hydrated || (businesses.length === 0 && isSyncing)) return <HomeSkeleton />

  if (businesses.length === 0) {
    if (syncError) {
      return <ErrorState title="No pudimos cargar el catálogo" description={syncError} onRetry={() => void syncCatalog()} />
    }
    if (isOffline) {
      return (
        <EmptyState icon="wifi-off" title="Sin conexión" description="Conéctate a Internet para cargar el catálogo por primera vez." />
      )
    }
    return <EmptyState icon="home" title="No hay negocios disponibles ahora" description="Vuelve a intentarlo en un momento." />
  }

  return (
    <div className="px-4 lg:px-6 pt-3 lg:pt-6 space-y-5 lg:space-y-8 animate-fade-in">
      <section className="relative overflow-hidden rounded-[24px] lg:min-h-[280px] lg:flex lg:items-end">
        <HeroBusinessCarousel />
        <div className="relative p-4 lg:p-8 space-y-1 lg:max-w-xl">
          <h1 className="text-h1 lg:text-display text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.35)]">¿Qué te traemos hoy?</h1>
          <p className="text-body text-white/95 pb-2 [text-shadow:0_1px_6px_rgba(0,0,0,0.35)]">
            Pide en tus negocios de siempre y te lo llevamos a la puerta.
          </p>
          <SearchLink />
        </div>
      </section>

      {categories.length > 0 && (
        <Section title="Categorías">
          <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1 lg:mx-0 lg:px-0 lg:flex-wrap lg:overflow-visible">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </Section>
      )}

      {featuredProducts.length > 0 && (
        <Section title="Ofertas destacadas">
          <Rail>
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} layout="rail" onAdd={quickAdd} />
            ))}
          </Rail>
        </Section>
      )}

      {topBusinesses.length > 0 && (
        <Section title="Top Negocios">
          <Rail desktopColumns={3}>
            {topBusinesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                stats={stats?.businesses[business.id] ?? null}
                badge={popularBusinessIds.has(business.id) ? '🔥 Popular' : undefined}
                layout="rail"
              />
            ))}
          </Rail>
        </Section>
      )}

      {topProducts.length > 0 && (
        <Section title="Productos top">
          <Rail>
            {topProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                layout="rail"
                badge={popularProductIds.has(product.id) ? '🔥 Popular' : undefined}
                onAdd={quickAdd}
              />
            ))}
          </Rail>
        </Section>
      )}

      {/* Solo web: compartir el enlace/QR del sitio (en la app se comparte la tienda). */}
      <div className="lg:max-w-md">
        <ShareSection />
      </div>
    </div>
  )
}

/**
 * Enlaces viejos del Home de la web anterior: `?negocio=<id viejo>` abre ese negocio, `?q=` y
 * `?categoria=` abren Buscar. Devuelve la redirección o null.
 */
function useLegacyHomeRedirect() {
  const [params] = useSearchParams()
  const businesses = useCatalogStore((state) => state.businesses)
  const waiting = useCatalogStore((state) => !state.hydrated || (state.businesses.length === 0 && state.isSyncing))
  const legacyBusiness = params.get('negocio')
  const query = params.get('q') ?? params.get('categoria')

  if (legacyBusiness) {
    const business = findBusinessByLegacyId(legacyBusiness, businesses)
    if (business) return <Navigate replace to={`/negocio/${business.id}`} />
    // Todavía sin catálogo: se espera; si ya cargó y no existe, se queda en el Home.
    if (waiting) return <HomeSkeleton />
  }
  if (query) return <Navigate replace to={`/buscar?q=${encodeURIComponent(query)}`} />
  return null
}
