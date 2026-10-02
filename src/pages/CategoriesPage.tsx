import { Link } from 'react-router-dom'
import { CatalogImage } from '../components/catalog/CatalogImage'
import { categoryImageUrl, categorySearchHref } from '../components/catalog/CategoryCard'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { visualForCategory } from '../features/catalog'
import { useCatalogStore } from '../store/catalogStore'

/**
 * Categorías — `CategoriesScreen` de mobile: grilla de fotos; cada una abre Buscar con su nombre.
 * 2 columnas en teléfono, más en pantallas grandes.
 */
export function CategoriesPage() {
  const categories = useCatalogStore((state) => state.categories)
  const waiting = useCatalogStore((state) => !state.hydrated || (state.categories.length === 0 && state.isSyncing))

  return (
    <div className="px-4 lg:px-6 pt-3 lg:pt-6">
      <h1 className="text-h1 text-text-primary mb-3">Categorías</h1>
      {waiting ? (
        <div role="status" aria-label="Cargando categorías" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-r-lg" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState icon="grid" title="Sin categorías todavía" description="Vuelve a intentarlo en un momento." />
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                to={categorySearchHref(category)}
                className="group relative block h-28 lg:h-36 overflow-hidden rounded-r-lg shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <CatalogImage
                  uri={categoryImageUrl(category)}
                  width={320}
                  visual={visualForCategory(category)}
                  className="absolute inset-0 transition-transform duration-300 group-hover:scale-105"
                />
                <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(20,12,8,0.75))]" />
                <span className="absolute left-3 right-3 bottom-2 text-[15px] font-semibold text-white truncate">{category.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
