import type { CatalogBusiness, CatalogProduct } from '../../types/backend/catalog'
import { normalize } from './search'
import legacyBusinesses from './legacyBusinesses.json'

/**
 * Enlaces ya compartidos de la web anterior (catálogo en JSON, ids legibles como "cr-014" o
 * "cronos"). El catálogo ahora viene del backend, con otros ids; esto traduce los viejos para que
 * esos enlaces sigan abriendo lo mismo:
 *  - producto: el backend guarda el id viejo en `externalId` (lo carga el script de importación).
 *  - negocio: no tiene externalId; se reconoce por su nombre en el catálogo viejo.
 */

const LEGACY_BUSINESS_NAMES = legacyBusinesses as Record<string, string>

/** Nombre "núcleo" para comparar: sin tildes, mayúsculas ni lo que va tras un guion ("La Pino - Tienda…"). */
function coreName(name: string): string {
  return normalize(name.split(/\s+-\s+/)[0] ?? name).replace(/[^a-z0-9ñ]+/g, '')
}

export function findProductByLegacyId(legacyId: string, products: CatalogProduct[]): CatalogProduct | undefined {
  return products.find((product) => product.externalId === legacyId)
}

export function findBusinessByLegacyId(
  legacyId: string,
  businesses: CatalogBusiness[],
): CatalogBusiness | undefined {
  const legacyName = LEGACY_BUSINESS_NAMES[legacyId]
  if (!legacyName) return undefined
  const wanted = coreName(legacyName)
  return businesses.find((business) => coreName(business.name) === wanted)
}

/** ¿Parece un id del backend (cuid) y no uno viejo de la web? */
export function isBackendId(id: string): boolean {
  return /^c[a-z0-9]{20,}$/.test(id)
}
