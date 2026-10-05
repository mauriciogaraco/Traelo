import { Link } from 'react-router-dom'
import { AuthPrompt } from '../components/auth/AuthPrompt'
import { formatCup } from '../components/catalog/Price'
import { EmptyState } from '../components/ui/EmptyState'
import { RowsSkeleton } from '../components/ui/Skeleton'
import { businessPath } from '../features/catalog'
import { useFavorites } from '../hooks/useFavorites'
import { useCatalogStore } from '../store/catalogStore'

const ROW =
  'block rounded-r-lg bg-surface border border-border/60 shadow-card p-3 hover:shadow-card-hover transition'

/** Favoritos de la cuenta (`FavoritesScreen` de mobile): negocios y productos guardados. */
export function FavoritesPage() {
  const { isAuthenticated, businesses, products, loaded } = useFavorites()
  const catalogBusinesses = useCatalogStore((state) => state.businesses)

  if (!isAuthenticated) {
    return (
      <AuthPrompt
        title="Guarda tus favoritos"
        description="Con una cuenta puedes guardar tus negocios y productos favoritos."
      />
    )
  }

  if (!loaded) {
    return (
      <div className="px-4 lg:px-0 pt-6">
        <RowsSkeleton rows={4} />
      </div>
    )
  }

  if (businesses.length === 0 && products.length === 0) {
    return (
      <EmptyState
        icon="heart"
        title="Sin favoritos todavía"
        description="Toca el corazón en un negocio o producto para guardarlo aquí."
      />
    )
  }

  return (
    <div className="px-4 lg:px-0 pt-6 pb-10 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-h1 text-text-primary">Favoritos</h1>

      {businesses.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-h3 text-text-primary">Negocios</h2>
          <ul className="space-y-2">
            {businesses.map((item) => (
              <li key={item.businessId}>
                <Link to={businessPath(item.businessId, catalogBusinesses)} className={ROW}>
                  <span className="block font-semibold text-text-primary">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {products.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-h3 text-text-primary">Productos</h2>
          <ul className="space-y-2">
            {products.map((item) => (
              <li key={item.productId}>
                <Link to={`/producto/${item.productId}`} className={ROW}>
                  <span className="block font-semibold text-text-primary">{item.name}</span>
                  {item.price != null && (
                    <span className="block text-caption text-text-secondary">{formatCup(item.price)}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
