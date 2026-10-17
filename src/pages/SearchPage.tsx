import { useDeferredValue, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { track } from '../analytics'
import { searchQueryProperties } from '../analytics/privacy'
import { BusinessCard } from '../components/catalog/BusinessCard'
import { BusinessListSkeleton } from '../components/catalog/CatalogSkeletons'
import { ProductCard } from '../components/catalog/ProductCard'
import { SearchInput } from '../components/catalog/SearchBar'
import { Button } from '../components/ui/Button'
import { ChipRow, type ChipItem } from '../components/ui/ChipRow'
import { EmptyState } from '../components/ui/EmptyState'
import { SegmentedTabs } from '../components/ui/SegmentedTabs'
import { ProductGridSkeleton } from '../components/ui/Skeleton'
import {
  TOP_RATED_MIN_REVIEWS,
  businessOrders,
  effectiveSort,
  filterBusinesses,
  findBusinessByParam,
  filterProducts,
  productPopularitySource,
  productUnits,
  searchBusinesses,
  searchProducts,
  sortBusinesses,
  sortProducts,
  topIds,
  type BusinessSort,
  type ProductSort,
} from '../features/catalog'
import { useIncrementalList } from '../hooks/useIncrementalList'
import { useQuickAdd } from '../hooks/useQuickAdd'
import { refreshCatalogStats } from '../services/statsService'
import { useCatalogStore } from '../store/catalogStore'
import { useStatsStore } from '../store/statsStore'

type Tab = 'products' | 'businesses'

const PRODUCT_SORT_LABELS: Record<ProductSort, string> = {
  relevance: '✨ Relevancia',
  popular: '🔥 Populares',
  priceAsc: '↑ Menor precio',
  priceDesc: '↓ Mayor precio',
  recentOffers: '🕒 Ofertas recientes',
}

const BUSINESS_SORT_LABELS: Record<BusinessSort, string> = {
  relevance: '✨ Relevancia',
  popular: '🔥 Populares',
  rating: '⭐ Mejor valorados',
  recent: '🕒 Recientes',
  alphabetical: '🔤 Alfabético',
}

/** Cuánta información real hay detrás del orden elegido: si no hay, el encabezado no debe presumir de "más pedido". */
type DataBasis = 'full' | 'business' | 'none'

function summaryText(params: { hasQuery: boolean; query: string; count: number; tab: Tab; sort: string; basis: DataBasis }): string {
  const { hasQuery, query, count, tab, sort, basis } = params
  if (hasQuery) return `${count} ${count === 1 ? 'resultado' : 'resultados'} para “${query.trim()}”`
  const plain = tab === 'products' ? 'Productos' : 'Negocios'
  switch (sort) {
    case 'popular':
      if (basis === 'none') return plain
      if (tab === 'products') return basis === 'business' ? 'De los negocios más pedidos' : 'Lo más pedido en Tráelo'
      return 'Los negocios más pedidos'
    case 'rating':
      return basis === 'none' ? plain : 'Los negocios mejor valorados'
    case 'priceAsc':
      return 'De menor a mayor precio'
    case 'priceDesc':
      return 'De mayor a menor precio'
    case 'recent':
      return basis === 'none' ? plain : 'Los negocios más nuevos'
    case 'alphabetical':
      return 'Negocios de la A a la Z'
    case 'recentOffers':
      return basis === 'none' ? plain : 'Ofertas recientes'
    default:
      return plain
  }
}

/**
 * Buscar — `SearchScreen` de mobile. Dos pestañas (Productos | Negocios), cada una con su orden y
 * sus filtros; sin texto se muestra el ranking, no una pantalla vacía. Todo se calcula en el
 * navegador con el catálogo y las estadísticas guardadas, así que también funciona sin conexión.
 * La búsqueda vive en la URL (`?q=`): Categorías y los enlaces compartidos llegan con ella.
 */
export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  // `?tab=negocios|productos`: "Ver todos los negocios" (Home) y las categorías eligen la pestaña con la que se abre.
  const urlTab: Tab | null = params.get('tab') === 'productos' ? 'products' : params.get('tab') === 'negocios' ? 'businesses' : null
  const setQuery = (q: string) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (q) next.set('q', q)
      else next.delete('q')
      return next
    }, { replace: true })

  const hydrated = useCatalogStore((state) => state.hydrated)
  const catalogLoading = useCatalogStore((state) => state.businesses.length === 0 && state.isSyncing)
  const businesses = useCatalogStore((state) => state.businesses)
  const products = useCatalogStore((state) => state.products)
  const stats = useStatsStore((state) => state.stats)
  const quickAdd = useQuickAdd()

  // Los resultados se calculan con una copia "diferida" de la búsqueda: escribir no traba la pantalla.
  const deferredQuery = useDeferredValue(query)
  const [tabChoice, setTabChoice] = useState<Tab | null>(null)
  const [productSort, setProductSort] = useState<'auto' | ProductSort>('auto')
  const [businessSort, setBusinessSort] = useState<'auto' | BusinessSort>('auto')
  const [onlyOffers, setOnlyOffers] = useState(false)
  const [onlyOpen, setOnlyOpen] = useState(false)

  useEffect(() => {
    void refreshCatalogStats()
  }, [])

  const hasQuery = deferredQuery.trim().length > 0
  const productSortNow = effectiveSort<ProductSort>(productSort, hasQuery) as ProductSort
  // Sin búsqueda ni orden elegido, los negocios van de la A a la Z: así cada quien encuentra el suyo en la lista.
  const businessSortNow = (businessSort === 'auto' && !hasQuery ? 'alphabetical' : effectiveSort<BusinessSort>(businessSort, hasQuery)) as BusinessSort

  const matchedProducts = useMemo(() => searchProducts(deferredQuery, products), [deferredQuery, products])
  const matchedBusinesses = useMemo(() => searchBusinesses(deferredQuery, businesses), [deferredQuery, businesses])
  const visibleProducts = useMemo(
    () => sortProducts(filterProducts(matchedProducts, { categoryId: null, onlyOffers }), productSortNow, stats),
    [matchedProducts, onlyOffers, productSortNow, stats],
  )
  const visibleBusinesses = useMemo(
    () => sortBusinesses(filterBusinesses(matchedBusinesses, { onlyOpen }), businessSortNow, stats),
    [matchedBusinesses, onlyOpen, businessSortNow, stats],
  )
  // Los negocios van primero. Solo si lo escrito no coincide con ningún negocio pero sí con productos,
  // se abre en Productos; en cuanto la persona elige una pestaña, se respeta su elección.
  const autoTab: Tab = hasQuery && matchedBusinesses.length === 0 && matchedProducts.length > 0 ? 'products' : 'businesses'
  const tab: Tab = tabChoice ?? urlTab ?? autoTab
  const setTab = setTabChoice
  const businessNameById = useMemo(() => new Map(businesses.map((b) => [b.id, b.name])), [businesses])

  // Insignias solo cuando el orden las justifica y hay datos reales detrás.
  const popularProductIds = useMemo(
    () => (productSortNow === 'popular' ? topIds(visibleProducts, (p) => productUnits(p, stats)) : new Set<string>()),
    [visibleProducts, productSortNow, stats],
  )
  const businessBadgeIds = useMemo(() => {
    if (businessSortNow === 'popular') return topIds(visibleBusinesses, (b) => businessOrders(b, stats))
    if (businessSortNow === 'rating') {
      return topIds(visibleBusinesses, (b) => stats?.businesses[b.id]?.ratingCount ?? 0, 3, TOP_RATED_MIN_REVIEWS)
    }
    return new Set<string>()
  }, [visibleBusinesses, businessSortNow, stats])

  const productList = useIncrementalList(visibleProducts, `${deferredQuery}|${productSortNow}|${onlyOffers}`)

  const sortItems: ChipItem[] =
    tab === 'products'
      ? (Object.keys(PRODUCT_SORT_LABELS) as ProductSort[])
          .filter((key) => key !== 'relevance' || hasQuery)
          .map((key) => ({ key, label: PRODUCT_SORT_LABELS[key], selected: productSortNow === key }))
      : (Object.keys(BUSINESS_SORT_LABELS) as BusinessSort[])
          .filter((key) => key !== 'relevance' || hasQuery)
          .map((key) => ({ key, label: BUSINESS_SORT_LABELS[key], selected: businessSortNow === key }))

  const filterItems: ChipItem[] =
    tab === 'products'
      ? [{ key: 'offers', label: '🏷️ Con oferta', selected: onlyOffers }]
      : [{ key: 'open', label: '🕒 Abierto ahora', selected: onlyOpen }]

  const filtersActive = tab === 'products' ? onlyOffers : onlyOpen
  const currentSort = tab === 'products' ? productSortNow : businessSortNow
  const count = tab === 'products' ? visibleProducts.length : visibleBusinesses.length
  const otherCount = tab === 'products' ? matchedBusinesses.length : matchedProducts.length

  const basis: DataBasis = (() => {
    if (currentSort === 'popular') {
      if (tab === 'products') {
        const source = productPopularitySource(visibleProducts, stats)
        return source === 'units' ? 'full' : source
      }
      return visibleBusinesses.some((b) => businessOrders(b, stats) > 0) ? 'full' : 'none'
    }
    if (currentSort === 'rating') {
      return visibleBusinesses.some((b) => (stats?.businesses[b.id]?.ratingCount ?? 0) > 0) ? 'full' : 'none'
    }
    if (currentSort === 'recent') return visibleBusinesses.some((b) => b.joinedAt) ? 'full' : 'none'
    if (currentSort === 'recentOffers') return visibleProducts.some((p) => p.offer?.startsAt) ? 'full' : 'none'
    return 'full'
  })()

  // Honestidad: si no hay datos reales detrás del orden elegido, se dice en vez de aparentar un ranking.
  const dataHint =
    basis === 'full'
      ? null
      : currentSort === 'rating'
        ? 'Todavía no hay reseñas de clientes; por ahora se ordena por pedidos.'
        : currentSort === 'recent' || currentSort === 'recentOffers'
          ? 'Actualiza el catálogo para ver este orden; por ahora se ordena por nombre.'
          : basis === 'business'
            ? 'Aún no hay ventas por producto; se muestran primero los de los negocios más pedidos.'
            : 'Todavía no hay pedidos suficientes para medir la popularidad; por ahora se ordena por nombre.'

  const loading = !hydrated || catalogLoading

  // Intención de búsqueda: se registra cuando la persona deja de escribir (no cada tecla), una vez por
  // texto, con cuántos resultados hubo (0 = lo que quiso y no encontró).
  const lastTrackedQuery = useRef('')
  useEffect(() => {
    const text = deferredQuery.trim()
    if (loading || text.length < 2 || text === lastTrackedQuery.current) return
    const timer = window.setTimeout(() => {
      lastTrackedQuery.current = text
      track('search', {
        properties: {
          ...searchQueryProperties(text),
          tab,
          resultCount: count,
          businessCount: matchedBusinesses.length,
          productCount: matchedProducts.length,
        },
      })
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [deferredQuery, loading, tab, count, matchedBusinesses.length, matchedProducts.length])

  // Qué resultado abrió tras buscar (delegado: sirve para tarjetas de negocios y de productos).
  const handleResultClick = (event: MouseEvent<HTMLElement>) => {
    if (!hasQuery) return
    const href = (event.target as HTMLElement).closest('a[href]')?.getAttribute('href')
    if (!href) return
    const text = searchQueryProperties(deferredQuery)
    if (href.startsWith('/producto/')) {
      track('search_result_click', { productId: href.slice('/producto/'.length), properties: { ...text, target: 'product' } })
    } else if (href.startsWith('/negocio/')) {
      const business = findBusinessByParam(decodeURIComponent(href.slice('/negocio/'.length)), businesses)
      if (business) track('search_result_click', { businessId: business.id, properties: { ...text, target: 'business' } })
    }
  }

  const empty = filtersActive ? (
    <EmptyState
      icon="search"
      title="Sin resultados con estos filtros"
      description="Prueba quitando algún filtro."
      action={
        <Button variant="outline" onClick={() => { setOnlyOffers(false); setOnlyOpen(false) }}>
          Quitar filtros
        </Button>
      }
    />
  ) : (
    <EmptyState
      icon="search"
      title={tab === 'products' ? 'No encontramos productos' : 'No encontramos negocios'}
      description={hasQuery ? `Sin resultados para “${query.trim()}”.` : 'Todavía no hay nada para mostrar aquí.'}
      action={
        hasQuery && otherCount > 0 ? (
          <Button variant="outline" onClick={() => setTab(tab === 'products' ? 'businesses' : 'products')}>
            Ver {otherCount} {tab === 'products' ? 'negocios' : 'productos'}
          </Button>
        ) : undefined
      }
    />
  )

  return (
    <div className="px-4 lg:px-6 pt-3 lg:pt-6 space-y-3" onClick={handleResultClick}>
      <div className="space-y-3 lg:flex lg:items-center lg:gap-4 lg:space-y-0">
        <div className="lg:flex-1">
          <SearchInput value={query} onChange={setQuery} autoFocus={!query && !urlTab} />
        </div>
        <div className="lg:w-80">
          <SegmentedTabs
            label="Qué buscar"
            value={tab}
            onChange={setTab}
            options={[
              { key: 'businesses', label: 'Negocios', count: matchedBusinesses.length },
              { key: 'products', label: 'Productos', count: matchedProducts.length },
            ]}
          />
        </div>
      </div>

      <div className="space-y-2 -mx-4 px-4 lg:mx-0 lg:px-0">
        <ChipRow
          label="Ordenar por"
          items={sortItems}
          onPress={(key) => (tab === 'products' ? setProductSort(key as ProductSort) : setBusinessSort(key as BusinessSort))}
        />
        <ChipRow
          label="Filtros"
          items={filterItems}
          onPress={(key) => (key === 'offers' ? setOnlyOffers((v) => !v) : setOnlyOpen((v) => !v))}
        />
      </div>

      {loading ? (
        tab === 'products' ? <ProductGridSkeleton /> : <BusinessListSkeleton />
      ) : (
        <>
          <div className="pt-1">
            <h2 className="text-h3 text-text-primary" aria-live="polite">
              {summaryText({ hasQuery, query: deferredQuery, count, tab, sort: currentSort, basis })}
            </h2>
            {dataHint && !hasQuery && <p className="text-caption text-text-secondary">{dataHint}</p>}
          </div>

          {count === 0 ? (
            empty
          ) : tab === 'products' ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {productList.visible.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    subtitle={businessNameById.get(product.businessId)}
                    badge={popularProductIds.has(product.id) ? '🔥 Popular' : undefined}
                    onAdd={quickAdd}
                  />
                ))}
              </div>
              {productList.hasMore && (
                <div ref={productList.sentinelRef} className="flex justify-center py-4">
                  <Button variant="soft" onClick={productList.showMore}>
                    Ver más productos
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {visibleBusinesses.map((business) => (
                <BusinessCard
                  key={business.id}
                  business={business}
                  stats={stats?.businesses[business.id] ?? null}
                  badge={
                    businessBadgeIds.has(business.id)
                      ? businessSortNow === 'rating'
                        ? '⭐ Top valorado'
                        : '🔥 Popular'
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
