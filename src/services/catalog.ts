import type { Business, Product } from '../types'

export interface CatalogData {
  businesses: Business[]
  products: Product[]
}

const CACHE_KEY = 'traelo_catalog_v2'
const ETAG_KEY  = 'traelo_catalog_etag'
const CATALOG_URL = '/data/catalog.json'

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
  const storedEtag = localStorage.getItem(ETAG_KEY) ?? ''

  // Solicitud condicional: si el servidor soporta ETags devuelve 304 sin body
  // cuando el catálogo no cambió → ahorra descargar 157 KB en cada visita.
  const headers: HeadersInit = storedEtag ? { 'If-None-Match': storedEtag } : {}

  const synced = fetch(CATALOG_URL, { headers })
    .then(async (res) => {
      if (res.status === 304) return null // sin cambios, usamos caché
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const fresh = await res.json() as CatalogData
      const etag = res.headers.get('ETag') ?? res.headers.get('Last-Modified') ?? ''
      if (etag) localStorage.setItem(ETAG_KEY, etag)
      writeCache(fresh)
      return fresh
    })
    .catch(() => null)

  return { cached, synced }
}
