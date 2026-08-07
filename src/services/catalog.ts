import type { Business, Product } from '../types'

// ── URLs ──────────────────────────────────────────────────────────────────────
const BUSINESSES_URL   = '/data/businesses.json'
const SEARCH_INDEX_URL = '/data/search-index.json'
const productUrl = (id: string) => `/data/products/${id}.json`

// ── localStorage keys ─────────────────────────────────────────────────────────
const BIZ_CACHE = 'traelo_biz_v3'
const IDX_CACHE = 'traelo_idx_v3'
const BIZ_ETAG  = 'traelo_biz_etag_v3'
const IDX_ETAG  = 'traelo_idx_etag_v3'

// ── In-memory cache for per-business full products (session only) ──────────────
const _productCache  = new Map<string, Product[]>()
const _pendingLoads  = new Map<string, Promise<Product[]>>()

// ── Helpers ───────────────────────────────────────────────────────────────────
function readLS<T>(key: string): T | null {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') } catch { return null }
}
function writeLS(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

async function fetchEtag<T>(url: string, etagKey: string): Promise<{ data: T | null; changed: boolean }> {
  const etag = localStorage.getItem(etagKey) ?? ''
  const headers: HeadersInit = etag ? { 'If-None-Match': etag } : {}
  try {
    const res = await fetch(url, { headers })
    if (res.status === 304) return { data: null, changed: false }
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as T
    const newEtag = res.headers.get('ETag') ?? res.headers.get('Last-Modified') ?? ''
    if (newEtag) localStorage.setItem(etagKey, newEtag)
    return { data, changed: true }
  } catch {
    return { data: null, changed: false }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface InitialData {
  businesses: Business[]
  /** Todos los productos sin longDescription. Listo para búsqueda y listados. */
  searchIndex: Product[]
}

export interface InitResult extends InitialData {
  /** Resuelve con datos frescos si cambiaron, null si el caché sigue vigente. */
  synced: Promise<InitialData | null>
}

/** Carga businesses + search-index. Devuelve caché inmediatamente y sincroniza en fondo. */
export function initCatalog(): InitResult {
  const businesses  = readLS<Business[]>(BIZ_CACHE) ?? []
  const searchIndex = readLS<Product[]>(IDX_CACHE) ?? []

  const synced = Promise.all([
    fetchEtag<Business[]>(BUSINESSES_URL, BIZ_ETAG),
    fetchEtag<Product[]>(SEARCH_INDEX_URL, IDX_ETAG),
  ]).then(([bizRes, idxRes]) => {
    if (!bizRes.changed && !idxRes.changed) return null
    const freshBiz = bizRes.data ?? businesses
    const freshIdx = idxRes.data ?? searchIndex
    if (bizRes.changed) writeLS(BIZ_CACHE, freshBiz)
    if (idxRes.changed) writeLS(IDX_CACHE, freshIdx)
    return { businesses: freshBiz, searchIndex: freshIdx }
  }).catch(() => null)

  return { businesses, searchIndex, synced }
}

/** Carga los productos completos de un negocio (con longDescription). Deduplica llamadas concurrentes. */
export async function ensureBusinessProducts(businessId: string): Promise<Product[]> {
  if (_productCache.has(businessId)) return _productCache.get(businessId)!
  if (_pendingLoads.has(businessId))  return _pendingLoads.get(businessId)!

  const load = fetch(productUrl(businessId))
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json() as Promise<Product[]>
    })
    .then(products => {
      _productCache.set(businessId, products)
      _pendingLoads.delete(businessId)
      return products
    })
    .catch(() => {
      _pendingLoads.delete(businessId)
      return [] as Product[]
    })

  _pendingLoads.set(businessId, load)
  return load
}

/** Devuelve productos cargados de un negocio sin disparar fetch. */
export function getBusinessProductsSync(businessId: string): Product[] | null {
  return _productCache.get(businessId) ?? null
}

/** Indica si los productos completos de un negocio ya están en memoria. */
export function isBusinessLoaded(businessId: string): boolean {
  return _productCache.has(businessId)
}
