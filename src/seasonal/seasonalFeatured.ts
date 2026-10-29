import { isSoldOut, productUnitsWeek } from '../features/catalog'
import type { CatalogProduct, CatalogStats } from '../types/backend/catalog'

/** Negocio que la campaña destaca (su slug de /negocio/<slug>). Si no está en el catálogo activo, solo salen los dulces. */
export const FEATURED_BUSINESS_SLUG = 'cronos'

/** Categorías de temporada (slugs): sus productos se ofrecen junto a los del negocio destacado. */
export const SEASON_CATEGORY_SLUGS = ['dulces', 'confituras']

/** Cuántos productos se ofrecen en el carrusel. */
export const SEASON_PRODUCTS_LIMIT = 12

export type SeasonSelection = {
  /** Negocio destacado (null si no está en la localidad activa). */
  businessId: string | null
  /** Ids de las categorías de temporada que existen en la localidad activa. */
  categoryIds: ReadonlySet<string>
}

function byWeeklyUnits(stats: CatalogStats | null) {
  return (a: CatalogProduct, b: CatalogProduct) =>
    productUnitsWeek(b, stats) - productUnitsWeek(a, stats) || a.name.localeCompare(b.name, 'es')
}

/**
 * Productos del carrusel de Halloween: los del negocio destacado y los de las categorías de temporada, SOLO los
 * disponibles (los agotados no se ofrecen). Cada grupo va con los más pedidos de la semana primero y se mezclan
 * alternando (uno del negocio, uno de dulces…) para que se vean los dos desde el principio; si un grupo se acaba,
 * el otro llena el resto hasta `limit`.
 */
export function pickSeasonProducts(
  products: CatalogProduct[],
  selection: SeasonSelection,
  stats: CatalogStats | null,
  limit: number = SEASON_PRODUCTS_LIMIT,
): CatalogProduct[] {
  const available = products.filter((product) => !isSoldOut(product))
  const ofBusiness = selection.businessId ? available.filter((p) => p.businessId === selection.businessId) : []
  const taken = new Set(ofBusiness.map((p) => p.id))
  const sweets = available.filter((p) => !taken.has(p.id) && p.categoryId !== null && selection.categoryIds.has(p.categoryId))

  const sorter = byWeeklyUnits(stats)
  const first = [...ofBusiness].sort(sorter)
  const second = [...sweets].sort(sorter)

  const mixed: CatalogProduct[] = []
  for (let i = 0; mixed.length < limit && (i < first.length || i < second.length); i++) {
    if (i < first.length) mixed.push(first[i]!)
    if (mixed.length < limit && i < second.length) mixed.push(second[i]!)
  }
  return mixed
}
