import { Link } from 'react-router-dom'
import { track } from '../../analytics'
import { visualForCategory } from '../../features/catalog'
import type { CatalogCategory } from '../../types/backend/catalog'
import { CatalogImage } from './CatalogImage'

/**
 * Fotos de categoría que trae la propia web (copiadas de la app, reducidas): las categorías
 * definitivas nunca piden su foto al backend. Mismos slugs que `CATEGORY_IMAGES` de mobile.
 */
const LOCAL_CATEGORY_IMAGES = new Set([
  'electrodomesticos', 'aseo-y-limpieza', 'asados', 'bebidas', 'comida-criolla', 'compra-mayorista',
  'confituras', 'carnicos', 'dulces', 'farmacia', 'ferreteria', 'helados', 'mercado', 'panes',
  'pizzas-y-mas', 'productos-del-agro', 'restaurantes', 'ropa-y-accesorios',
])

export function categoryImageUrl(category: CatalogCategory): string | null {
  return LOCAL_CATEGORY_IMAGES.has(category.slug) ? `/assets/categories/${category.slug}.webp` : category.imageUrl
}

/** Mobile (igual que la pestaña Categorías) abre Buscar con el nombre de la categoría. */
export function categorySearchHref(category: CatalogCategory): string {
  return `/buscar?q=${encodeURIComponent(category.name)}&tab=productos`
}

/** El usuario abrió una categoría (desde el Home o la pantalla de Categorías). */
export function trackCategoryView(category: CatalogCategory, source: 'home' | 'categorias'): void {
  track('category_view', { properties: { categoryId: category.id, category: category.name, source } })
}

/** Avatar circular del carrusel de categorías del Home — `CategoryCard` de mobile. */
export function CategoryCard({ category }: { category: CatalogCategory }) {
  return (
    <Link
      to={categorySearchHref(category)}
      onClick={() => trackCategoryView(category, 'home')}
      className="w-[72px] shrink-0 flex flex-col items-center gap-1 rounded-r-md hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <CatalogImage
        uri={categoryImageUrl(category)}
        width={56}
        visual={visualForCategory(category)}
        className="w-14 h-14 rounded-full"
      />
      <span className="w-full text-center text-caption font-semibold text-text-secondary truncate">{category.name}</span>
    </Link>
  )
}
