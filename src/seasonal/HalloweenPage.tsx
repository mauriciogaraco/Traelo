import { Link, Navigate } from 'react-router-dom'
import { useQuickAdd } from '../hooks/useQuickAdd'
import { ProductCard } from '../components/catalog/ProductCard'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'
import { useCatalogStore } from '../store/catalogStore'
import { isHalloweenActive } from './halloween'
import { useSeasonProducts } from './useSeasonProducts'

/** Tope de la lista completa: con cientos de dulces la página sería interminable y pesada. */
const PAGE_LIMIT = 60

/**
 * Lista completa de la campaña: los productos disponibles del negocio destacado (Cronos) y de los dulces, en una
 * sola lista mezclada. Fuera de campaña vuelve al Home.
 */
export function HalloweenPage() {
  const { featured, businesses, seasonProducts } = useSeasonProducts(PAGE_LIMIT)
  const hydrated = useCatalogStore((state) => state.hydrated)
  const quickAdd = useQuickAdd()

  if (!isHalloweenActive()) return <Navigate replace to="/" />

  const businessName = new Map(businesses.map((business) => [business.id, business.name]))
  const title = featured ? `${featured.name} y dulces` : 'Dulces para esta noche'

  return (
    <div className="px-4 lg:px-6 pt-4 lg:pt-6 pb-10 space-y-4">
      <div className="space-y-1">
        <Link to="/" className="inline-flex items-center gap-0.5 text-body-sm font-semibold text-primary-text hover:underline">
          <Icon name="chevron-left" size={16} />
          Inicio
        </Link>
        <h1 className="text-h1 text-text-primary">{title}</h1>
        <p className="text-body-sm text-text-secondary">Feliz Halloween: solo lo que está disponible ahora.</p>
      </div>

      {seasonProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {seasonProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              subtitle={businessName.get(product.businessId)}
              onAdd={quickAdd}
            />
          ))}
        </div>
      ) : hydrated ? (
        <EmptyState icon="home" title="Por ahora no hay nada disponible" description="Vuelve en un rato: se actualiza solo." />
      ) : null}
    </div>
  )
}
