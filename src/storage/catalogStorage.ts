import { env } from '../config/env'
import { DEFAULT_CITY_CODE } from '../features/city/cities'
import type { CatalogBusiness, CatalogCategory, CatalogProduct } from '../types/backend/catalog'

/**
 * Caché local del catálogo — equivalente web de `storage/catalogStorage.ts` de mobile (AsyncStorage
 * → localStorage). Permite abrir la web sin red con lo último que se vio. Si el almacenamiento está
 * bloqueado o lleno, simplemente no se guarda: la web sigue funcionando con la red.
 *
 * Una caché POR CIUDAD: el catálogo de una ciudad nunca se mezcla con el de otra. La de Güira conserva
 * la clave de siempre (nadie pierde su caché al desplegar); las demás llevan el código de la ciudad.
 */
const CATALOG_KEY = 'traelo.catalog.v1'

export function catalogStorageKey(cityCode: string = DEFAULT_CITY_CODE): string {
  return cityCode === DEFAULT_CITY_CODE ? CATALOG_KEY : `${CATALOG_KEY}.${cityCode}`
}

export type StoredCatalog = {
  /** Backend del que salió: si la web pasa a otro (pruebas → producción), la caché no sirve. */
  apiBaseUrl?: string
  /** Ciudad del catálogo. Ausente = caché anterior a la expansión, que es de Güira. */
  cityCode?: string
  /** Se bajó con el filtro de ciudad del servidor. Ausente = catálogo global (anterior al filtro). */
  scoped?: boolean
  version: number
  categories: CatalogCategory[]
  businesses: CatalogBusiness[]
  products: CatalogProduct[]
  lastSyncedAt: string
}

/**
 * `scoped`: ¿esta ciudad se pide hoy con filtro de servidor? Una caché global (de antes del filtro) trae
 * negocios de otras localidades: si ahora se filtra, no sirve y se baja de nuevo.
 */
export function loadStoredCatalog(cityCode: string = DEFAULT_CITY_CODE, scoped = false): StoredCatalog | null {
  try {
    const raw = localStorage.getItem(catalogStorageKey(cityCode))
    if (!raw) return null
    const stored = JSON.parse(raw) as StoredCatalog
    if (stored.apiBaseUrl !== env.apiBaseUrl) return null
    // Defensa: una caché de otra ciudad bajo esta clave no se usa.
    if ((stored.cityCode ?? DEFAULT_CITY_CODE) !== cityCode) return null
    return scoped && !stored.scoped ? null : stored
  } catch {
    return null
  }
}

export function saveStoredCatalog(catalog: StoredCatalog, cityCode: string = DEFAULT_CITY_CODE): void {
  try {
    localStorage.setItem(catalogStorageKey(cityCode), JSON.stringify({ ...catalog, apiBaseUrl: env.apiBaseUrl, cityCode }))
  } catch {
    // Cuota llena o almacenamiento bloqueado: queda solo en memoria.
  }
}
