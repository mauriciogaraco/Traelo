import type { Business, Product } from '../types'

export interface CatalogData {
  businesses: Business[]
  products: Product[]
}

const CACHE_KEY = 'traelo_familia_catalog_v1'
const CATALOG_URL = '/data/catalog-familia.json'

function readCache(): CatalogData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CatalogData
  } catch {
    return null
  }
}

function writeCache(data: CatalogData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    // quota exceeded o localStorage no disponible
  }
}

export interface LoadCatalogResult {
  /** Catálogo desde localStorage; null en la primera visita ever. */
  cached: CatalogData | null
  /** Resuelve con datos frescos si cambiaron, null si no hubo cambios o falló la red. */
  synced: Promise<CatalogData | null>
}

export function loadCatalog(): LoadCatalogResult {
  const cached = readCache()
  const cachedStr = cached ? JSON.stringify(cached) : null

  const synced = fetch(CATALOG_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json() as Promise<CatalogData>
    })
    .then((fresh) => {
      const freshStr = JSON.stringify(fresh)
      if (freshStr === cachedStr) return null // sin cambios
      writeCache(fresh)
      return fresh
    })
    .catch(() => null)

  return { cached, synced }
}
