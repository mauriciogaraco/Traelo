import { isSoldOut, productUnitsWeek } from '../features/catalog'
import type { CatalogProduct, CatalogStats } from '../types/backend/catalog'

/** Negocio que la campaña destaca (su slug de /negocio/<slug>). Si no está en el catálogo activo, no se muestra nada. */
export const FEATURED_BUSINESS_SLUG = 'cronos'

/** Cuántos productos del negocio destacado se ofrecen en el carrusel. */
export const FEATURED_PRODUCTS_LIMIT = 10

/**
 * Productos del negocio destacado para el carrusel: solo los disponibles (los agotados no se ofrecen), los más
 * pedidos de la semana primero y, entre iguales, por nombre.
 */
export function pickFeaturedProducts(
  products: CatalogProduct[],
  businessId: string,
  stats: CatalogStats | null,
  limit: number = FEATURED_PRODUCTS_LIMIT,
): CatalogProduct[] {
  return products
    .filter((product) => product.businessId === businessId && !isSoldOut(product))
    .sort((a, b) => productUnitsWeek(b, stats) - productUnitsWeek(a, stats) || a.name.localeCompare(b.name, 'es'))
    .slice(0, limit)
}
