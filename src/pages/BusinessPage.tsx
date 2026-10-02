import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { BusinessStatusBadge } from '../components/catalog/BusinessStatusBadge'
import { CatalogImage } from '../components/catalog/CatalogImage'
import { ProductCard } from '../components/catalog/ProductCard'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { FavoriteButton } from '../components/catalog/FavoriteButton'
import { Icon } from '../components/ui/Icon'
import { ProductGridSkeleton, Skeleton } from '../components/ui/Skeleton'
import { findBusinessByLegacyId, isBackendId } from '../features/catalog'
import { useToast } from '../context/ToastContext'
import { useFavorites } from '../hooks/useFavorites'
import { useIncrementalList } from '../hooks/useIncrementalList'
import { useQuickAdd } from '../hooks/useQuickAdd'
import { favoriteToast } from '../lib/favoriteToast'
import { toggleFavoriteBusiness } from '../services/favoritesService'
import { useCatalogStore } from '../store/catalogStore'

/**
 * Negocio — `BusinessScreen` de mobile: foto, nombre, dirección, teléfono, estado y sus productos.
 * En escritorio el encabezado queda a la izquierda (fijo) y los productos en grilla a la derecha.
 * El corazón de favoritos solo aparece con sesión, como en mobile.
 */
export function BusinessPage() {
  const { id = '' } = useParams()
  const businesses = useCatalogStore((state) => state.businesses)
  const allProducts = useCatalogStore((state) => state.products)
  const waiting = useCatalogStore((state) => !state.hydrated || (state.businesses.length === 0 && state.isSyncing))
  const quickAdd = useQuickAdd()
  const { showToast } = useToast()
  const { isAuthenticated, businesses: favoriteBusinesses } = useFavorites()

  const business = useMemo(() => businesses.find((b) => b.id === id), [businesses, id])
  const products = useMemo(() => allProducts.filter((p) => p.businessId === id), [allProducts, id])
  const productList = useIncrementalList(products, id)

  if (!business) {
    // Enlace viejo de la web (/negocio/cronos): se traduce al negocio del backend.
    if (!isBackendId(id)) {
      const legacy = findBusinessByLegacyId(id, businesses)
      if (legacy) return <Navigate replace to={`/negocio/${legacy.id}`} />
    }
    if (waiting) {
      return (
        <div className="px-4 pt-4 space-y-4">
          <Skeleton className="h-40 w-full rounded-r-lg" />
          <Skeleton className="h-7 w-2/3" />
          <ProductGridSkeleton />
        </div>
      )
    }
    return (
      <EmptyState
        icon="home"
        title="Negocio no encontrado"
        description="Puede que ya no esté disponible."
        action={
          <Link
            to="/buscar"
            className="inline-flex min-h-12 items-center rounded-r-md border border-primary px-4 font-semibold text-primary-text hover:bg-primary/5"
          >
            Ver otros negocios
          </Link>
        }
      />
    )
  }

  const phoneHref = `tel:${business.phone.replace(/[^\d+]/g, '')}`

  return (
    <div className="px-4 lg:px-6 pt-3 lg:pt-6 lg:grid lg:grid-cols-[320px_1fr] lg:gap-8 lg:items-start">
      <header className="space-y-1.5 pb-4 lg:sticky lg:top-24">
        <CatalogImage
          uri={business.logoUrl}
          width={640}
          label={business.name}
          alt={business.name}
          eager
          className="w-full h-40 lg:h-56 rounded-r-lg mb-2"
        />
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-h1 text-text-primary">{business.name}</h1>
          {isAuthenticated && (
            <FavoriteButton
              isFavorite={favoriteBusinesses.some((b) => b.businessId === business.id)}
              onToggle={async () => {
                const { message, type } = favoriteToast(await toggleFavoriteBusiness(business), business.name)
                showToast(message, type)
              }}
            />
          )}
        </div>
        <p className="flex items-start gap-1 text-body text-text-secondary">
          <Icon name="location" size={16} className="mt-[3px] shrink-0 text-text-tertiary" />
          {business.address}
        </p>
        <a href={phoneHref} className="inline-block text-caption font-semibold text-primary-text hover:underline">
          {business.phone}
        </a>
        <div>
          <BusinessStatusBadge business={business} />
        </div>
      </header>

      <section aria-label={`Productos de ${business.name}`}>
        {products.length === 0 ? (
          <p className="py-6 text-center text-caption text-text-secondary">Este negocio todavía no tiene productos disponibles.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {productList.visible.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={quickAdd} />
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
        )}
      </section>
    </div>
  )
}
