import { lazy } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { ProductGridSkeleton } from '../components/ui/Skeleton'
import { findProductByLegacyId, isBackendId } from '../features/catalog'
import { useCatalogStore } from '../store/catalogStore'

const ProductDetailPage = lazy(() => import('./ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })))

/**
 * /producto/:id — los enlaces ya compartidos de la web anterior usan ids como "cr-014": se buscan
 * por `externalId` en el catálogo del backend y se redirige al producto actual.
 */
export function ProductRoute() {
  const { id = '' } = useParams()
  const products = useCatalogStore((state) => state.products)
  const waiting = useCatalogStore((state) => !state.hydrated || (state.products.length === 0 && state.isSyncing))

  if (!isBackendId(id) && !products.some((p) => p.id === id)) {
    const current = findProductByLegacyId(id, products)
    if (current) return <Navigate replace to={`/producto/${current.id}`} />
    if (waiting) {
      return (
        <div className="px-4 pt-4">
          <ProductGridSkeleton count={2} />
        </div>
      )
    }
  }
  return <ProductDetailPage />
}
