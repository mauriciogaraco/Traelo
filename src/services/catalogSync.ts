import {
  getCatalogBootstrap,
  getCatalogBusinesses,
  getCatalogBusinessProducts,
  getCatalogCategories,
  getCatalogChanges,
  getCatalogVersion,
} from '../api/catalog'
import { ApiError } from '../api/ApiError'
import { loadStoredCatalog, saveStoredCatalog } from '../storage/catalogStorage'
import { useCatalogStore } from '../store/catalogStore'
import type { CatalogBusiness, CatalogChange, CatalogChangesResult, CatalogProduct } from '../types/backend/catalog'

/**
 * Orquesta bootstrap + sincronización incremental del catálogo — misma lógica que
 * `services/catalogSync.ts` de la app móvil (checklist §17/§18). Server-authoritative: nunca calcula
 * precios ni disponibilidad, solo refleja /catalog. Solo este módulo escribe en el store y la caché.
 */

/** Cambios que se piden por página (el servidor puede devolver menos). */
const CHANGES_PAGE_LIMIT = 200
/** Tope de páginas por sincronización: evita un bucle sin fin si algo falla; el resto sigue en la próxima. */
const MAX_CHANGE_PAGES = 25

/**
 * Hasta qué versión se llegó con una página de cambios, y si quedan más. Si la página se cortó en el
 * tope, la versión alcanzada es la del último cambio recibido y NO la global: dar por aplicados los
 * cambios que no llegaron los pierde para siempre (un negocio nuevo aparece sin sus productos).
 * También detecta el corte en un backend anterior, que no manda `hasMore` y devuelve la versión
 * global aunque haya cortado: página llena y versión global por delante del último cambio.
 */
export function changesPageProgress(
  result: CatalogChangesResult,
  limit: number,
): { reachedVersion: number; hasMore: boolean } {
  const last = result.changes[result.changes.length - 1]?.version
  if (last === undefined) return { reachedVersion: result.latestVersion, hasMore: false }
  const truncated = result.hasMore === true || (result.changes.length >= limit && result.latestVersion > last)
  return { reachedVersion: truncated ? last : result.latestVersion, hasMore: truncated }
}

/** Negocios del catálogo sin ningún producto en la caché. */
export function businessIdsWithoutProducts(businesses: CatalogBusiness[], products: CatalogProduct[]): string[] {
  const withProducts = new Set(products.map((p) => p.businessId))
  return businesses.filter((b) => !withProducts.has(b.id)).map((b) => b.id)
}

/** Carga la caché local al store — debe llamarse primero, antes de intentar sincronizar. */
export function hydrateCatalogFromStorage(): void {
  const stored = loadStoredCatalog()
  const store = useCatalogStore.getState()
  if (stored) store.setCatalog(stored)
  store.setHydrated()
}

function persist(catalog: {
  version: number
  categories: ReturnType<typeof useCatalogStore.getState>['categories']
  businesses: ReturnType<typeof useCatalogStore.getState>['businesses']
  products: CatalogProduct[]
}) {
  const lastSyncedAt = new Date().toISOString()
  useCatalogStore.getState().setCatalog({ ...catalog, lastSyncedAt })
  saveStoredCatalog({ ...catalog, lastSyncedAt })
}

async function refreshCategoriesAndBusinesses() {
  const [categories, businesses] = await Promise.all([getCatalogCategories(), getCatalogBusinesses()])
  return { categories, businesses }
}

/**
 * Para cada producto cambiado, su negocio según la caché. Si alguno es nuevo (no está en caché) no
 * hay endpoint para saber de qué negocio es: el caller hace un bootstrap completo.
 */
function resolveAffectedBusinessIds(
  changedProductIds: string[],
  currentProducts: CatalogProduct[],
): { resolved: true; businessIds: string[] } | { resolved: false } {
  const byId = new Map(currentProducts.map((p) => [p.id, p]))
  const businessIds = new Set<string>()
  for (const productId of changedProductIds) {
    const product = byId.get(productId)
    if (!product) return { resolved: false }
    businessIds.add(product.businessId)
  }
  return { resolved: true, businessIds: Array.from(businessIds) }
}

async function refreshProductsForBusinesses(
  businessIds: string[],
  currentProducts: CatalogProduct[],
): Promise<CatalogProduct[]> {
  const refreshedLists = await Promise.all(businessIds.map((businessId) => getCatalogBusinessProducts(businessId)))
  const untouched = currentProducts.filter((p) => !businessIds.includes(p.businessId))
  return [...untouched, ...refreshedLists.flat()]
}

/**
 * `isOpenNow` depende de la hora, no de la versión del catálogo: aunque no haya cambios hay que
 * volver a pedir los negocios, o la caché queda con el estado de cuando se bajó (p. ej. "CERRADO"
 * de la madrugada mostrándose todo el día).
 */
async function refreshBusinessesOnly() {
  const businesses = await getCatalogBusinesses()
  const current = useCatalogStore.getState()
  persist({ version: current.version, categories: current.categories, businesses, products: current.products })
}

async function runFullBootstrap() {
  const bootstrap = await getCatalogBootstrap()
  persist({
    version: bootstrap.version,
    categories: bootstrap.categories,
    businesses: bootstrap.businesses,
    products: bootstrap.products,
  })
}

/**
 * Un negocio sin productos en la caché casi siempre es un hueco, no un negocio vacío: p. ej. estuvo
 * oculto (sin recibir pedidos) y el catálogo no incluía sus productos, o llegó antes que ellos. La
 * versión no lo delata (la caché está "al día"), así que se revisa aquí: se bajan sus productos.
 * Un negocio realmente vacío se consulta una sola vez por sesión. Nunca lanza ni marca error: es
 * una reparación en segundo plano.
 */
const repairChecked = new Set<string>()

async function repairBusinessesWithoutProducts(): Promise<void> {
  const { businesses, products } = useCatalogStore.getState()
  const missing = businessIdsWithoutProducts(businesses, products).filter((id) => !repairChecked.has(id))
  if (missing.length === 0) return

  const results = await Promise.allSettled(
    missing.map(async (businessId) => ({ businessId, list: await getCatalogBusinessProducts(businessId) })),
  )
  const fetched = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []))
  fetched.forEach(({ businessId }) => repairChecked.add(businessId))

  const found = fetched.filter(({ list }) => list.length > 0)
  if (found.length === 0) return
  // Estado fresco: durante la consulta pudo cambiar el catálogo.
  const current = useCatalogStore.getState()
  const foundIds = new Set(found.map((f) => f.businessId))
  persist({
    version: current.version,
    categories: current.categories,
    businesses: current.businesses,
    products: [...current.products.filter((p) => !foundIds.has(p.businessId)), ...found.flatMap((f) => f.list)],
  })
}

async function applyChanges(changes: CatalogChange[], latestVersion: number): Promise<'applied' | 'bootstrapped'> {
  const store = useCatalogStore.getState()
  const entityTypes = new Set(changes.map((c) => c.entityType))

  const needsCategoriesOrBusinesses =
    entityTypes.has('CATEGORY') ||
    entityTypes.has('BUSINESS') ||
    entityTypes.has('BUSINESS_HOURS') ||
    entityTypes.has('BUSINESS_CLOSURE')

  const productChangeIds = changes
    .filter((c) => c.entityType === 'PRODUCT' || c.entityType === 'PRODUCT_OFFER')
    .map((c) => c.entityId)

  let { categories, businesses } = store
  if (needsCategoriesOrBusinesses) {
    ;({ categories, businesses } = await refreshCategoriesAndBusinesses())
  } else {
    businesses = await getCatalogBusinesses()
  }

  let products = store.products
  if (productChangeIds.length > 0) {
    const resolution = resolveAffectedBusinessIds(productChangeIds, store.products)
    if (!resolution.resolved) {
      await runFullBootstrap()
      return 'bootstrapped'
    }
    products = await refreshProductsForBusinesses(resolution.businessIds, store.products)
  }

  persist({ version: latestVersion, categories, businesses, products })
  return 'applied'
}

/** Pone la caché al día: bootstrap si no hay nada, o cambios incrementales página por página. */
async function syncToLatest(localVersion: number): Promise<void> {
  if (localVersion === 0) {
    await runFullBootstrap()
    return
  }

  const { version: remoteVersion } = await getCatalogVersion()
  if (remoteVersion === localVersion) {
    await refreshBusinessesOnly()
    return
  }
  // Versión remota MENOR que la guardada: la base se reinició (p.ej. el backend de pruebas).
  // Los cambios "desde" una versión que ya no existe no sirven: se baja todo de nuevo.
  if (remoteVersion < localVersion) {
    await runFullBootstrap()
    return
  }

  // Si hay más cambios de los que caben en una página, se sigue pidiendo desde donde se quedó.
  let since = localVersion
  for (let page = 0; page < MAX_CHANGE_PAGES; page++) {
    const result = await getCatalogChanges(since, CHANGES_PAGE_LIMIT)
    if (result.changes.length === 0) {
      await refreshBusinessesOnly()
      return
    }
    const { reachedVersion, hasMore } = changesPageProgress(result, CHANGES_PAGE_LIMIT)
    const outcome = await applyChanges(result.changes, reachedVersion)
    if (outcome === 'bootstrapped' || !hasMore) return
    since = reachedVersion
  }
}

let inFlight: Promise<void> | null = null

/** Sincroniza contra el backend. Silencioso si no hay conexión: la caché local sigue sirviendo. */
export function syncCatalog(): Promise<void> {
  // Un solo sync a la vez (arranque + volver a la pestaña + "reintentar" no se pisan).
  if (inFlight) return inFlight
  inFlight = runSync().finally(() => {
    inFlight = null
  })
  return inFlight
}

async function runSync(): Promise<void> {
  const store = useCatalogStore.getState()
  if (!navigator.onLine) {
    store.setOffline(true)
    return
  }
  store.setOffline(false)
  store.setSyncing(true)
  store.setSyncError(null)
  try {
    await syncToLatest(store.version)
    // También con la caché "al día": la versión no delata los huecos que deja una caché dañada.
    await repairBusinessesWithoutProducts()
  } catch (err) {
    if (err instanceof ApiError && (err.isNetworkError() || err.isTimeout())) {
      store.setOffline(true)
      return
    }
    store.setSyncError(err instanceof ApiError ? err.message : 'No pudimos actualizar el catálogo.')
  } finally {
    store.setSyncing(false)
  }
}
