import { env } from '../config/env'
import type { CatalogBusiness, CatalogCategory, CatalogProduct } from '../types/backend/catalog'

/**
 * Caché local del catálogo — equivalente web de `storage/catalogStorage.ts` de mobile (AsyncStorage
 * → localStorage). Permite abrir la web sin red con lo último que se vio. Si el almacenamiento está
 * bloqueado o lleno, simplemente no se guarda: la web sigue funcionando con la red.
 */
const CATALOG_KEY = 'traelo.catalog.v1'

export type StoredCatalog = {
  /** Backend del que salió: si la web pasa a otro (pruebas → producción), la caché no sirve. */
  apiBaseUrl?: string
  version: number
  categories: CatalogCategory[]
  businesses: CatalogBusiness[]
  products: CatalogProduct[]
  lastSyncedAt: string
}

export function loadStoredCatalog(): StoredCatalog | null {
  try {
    const raw = localStorage.getItem(CATALOG_KEY)
    if (!raw) return null
    const stored = JSON.parse(raw) as StoredCatalog
    return stored.apiBaseUrl === env.apiBaseUrl ? stored : null
  } catch {
    return null
  }
}

export function saveStoredCatalog(catalog: StoredCatalog): void {
  try {
    localStorage.setItem(CATALOG_KEY, JSON.stringify({ ...catalog, apiBaseUrl: env.apiBaseUrl }))
  } catch {
    // Cuota llena o almacenamiento bloqueado: queda solo en memoria.
  }
}
