import {
  getCatalogBootstrap,
  getCatalogBusinesses,
  getCatalogBusinessProducts,
  getCatalogCategories,
  getCatalogChanges,
  getCatalogVersion,
  type CatalogCityParams,
} from '../api/catalog'
import { ApiError } from '../api/ApiError'
import { cityQueryParams, findCity, getCities } from '../features/city/cities'
import { loadStoredCatalog, saveStoredCatalog } from '../storage/catalogStorage'
import { useCatalogStore } from '../store/catalogStore'
import type { CatalogBusiness, CatalogChange, CatalogChangesResult, CatalogProduct } from '../types/backend/catalog'

/**
 * Orquesta bootstrap + sincronización incremental del catálogo — misma lógica que
 * `services/catalogSync.ts` de la app móvil (checklist §17/§18). Server-authoritative: nunca calcula
 * precios ni disponibilidad, solo refleja /catalog. Solo este módulo escribe en el store y la caché.
 *
 * El catálogo es siempre de UNA ciudad (`useCatalogStore.cityCode`): cada ciudad tiene su caché y su
 * sincronización, y una respuesta que llega cuando el cliente ya cambió de ciudad se descarta (ver
 * `Scope`). Con una sola ciudad conocida todo funciona exactamente como antes.
 */

/** Cambios que se piden por página (el servidor puede devolver menos). */
const CHANGES_PAGE_LIMIT = 200
/** Tope de páginas por sincronización: evita un bucle sin fin si algo falla; el resto sigue en la próxima. */
const MAX_CHANGE_PAGES = 25

/**
 * La ciudad para la que corre UNA sincronización, y el filtro de servidor que le corresponde. Se fija
 * al empezar: todo lo que llegue después se aplica solo si el catálogo activo sigue siendo de esa
 * ciudad (el cliente pudo cambiar de ciudad mientras la respuesta viajaba).
 */
type Scope = { cityCode: string; params: CatalogCityParams }

function currentScope(): Scope {
  const { cityCode } = useCatalogStore.getState()
  return { cityCode, params: cityQueryParams(findCity(cityCode, getCities())) }
}

function isCurrent(scope: Scope): boolean {
  return useCatalogStore.getState().cityCode === scope.cityCode
}

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

/** Carga la caché local de la ciudad activa al store — debe llamarse primero, antes de intentar sincronizar. */
export function hydrateCatalogFromStorage(): void {
  const store = useCatalogStore.getState()
  const stored = loadStoredCatalog(store.cityCode)
  if (stored) store.setCatalog(stored)
  store.setHydrated()
}

function persist(
  scope: Scope,
  catalog: {
    version: number
    categories: ReturnType<typeof useCatalogStore.getState>['categories']
    businesses: ReturnType<typeof useCatalogStore.getState>['businesses']
    products: CatalogProduct[]
  },
): boolean {
  // El cliente cambió de ciudad mientras esto viajaba: ese catálogo ya no es el activo, no se pinta.
  if (!isCurrent(scope)) return false
  const lastSyncedAt = new Date().toISOString()
  useCatalogStore.getState().setCatalog({ ...catalog, lastSyncedAt })
  saveStoredCatalog({ ...catalog, lastSyncedAt }, scope.cityCode)
  return true
}

async function refreshCategoriesAndBusinesses(scope: Scope) {
  const [categories, businesses] = await Promise.all([getCatalogCategories(), getCatalogBusinesses(undefined, scope.params)])
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
async function refreshBusinessesOnly(scope: Scope) {
  const businesses = await getCatalogBusinesses(undefined, scope.params)
  const current = useCatalogStore.getState()
  persist(scope, { version: current.version, categories: current.categories, businesses, products: current.products })
}

async function runFullBootstrap(scope: Scope) {
  const bootstrap = await getCatalogBootstrap(scope.params)
  persist(scope, {
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

async function repairBusinessesWithoutProducts(scope: Scope): Promise<void> {
  const { businesses, products } = useCatalogStore.getState()
  const missing = businessIdsWithoutProducts(businesses, products).filter((id) => !repairChecked.has(id))
  if (missing.length === 0) return

  const results = await Promise.allSettled(
    missing.map(async (businessId) => ({ businessId, list: await getCatalogBusinessProducts(businessId) })),
  )
  // Si cambió la ciudad mientras tanto, esto no se aplica ni se da por revisado: volverá a intentarse.
  if (!isCurrent(scope)) return
  const fetched = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []))
  fetched.forEach(({ businessId }) => repairChecked.add(businessId))

  const found = fetched.filter(({ list }) => list.length > 0)
  if (found.length === 0) return
  // Estado fresco: durante la consulta pudo cambiar el catálogo.
  const current = useCatalogStore.getState()
  const foundIds = new Set(found.map((f) => f.businessId))
  persist(scope, {
    version: current.version,
    categories: current.categories,
    businesses: current.businesses,
    products: [...current.products.filter((p) => !foundIds.has(p.businessId)), ...found.flatMap((f) => f.list)],
  })
}

async function applyChanges(
  scope: Scope,
  changes: CatalogChange[],
  latestVersion: number,
): Promise<'applied' | 'bootstrapped'> {
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
    ;({ categories, businesses } = await refreshCategoriesAndBusinesses(scope))
  } else {
    businesses = await getCatalogBusinesses(undefined, scope.params)
  }

  let products = store.products
  if (productChangeIds.length > 0) {
    const resolution = resolveAffectedBusinessIds(productChangeIds, store.products)
    if (!resolution.resolved) {
      // Con varias ciudades, un cambio de OTRA ciudad también llega aquí (el registro de cambios es
      // global): un producto que no está en esta caché obliga a un bootstrap de la ciudad activa.
      await runFullBootstrap(scope)
      return 'bootstrapped'
    }
    products = await refreshProductsForBusinesses(resolution.businessIds, store.products)
  }

  persist(scope, { version: latestVersion, categories, businesses, products })
  return 'applied'
}

/** Pone la caché al día: bootstrap si no hay nada, o cambios incrementales página por página. */
async function syncToLatest(scope: Scope, localVersion: number): Promise<void> {
  if (localVersion === 0) {
    await runFullBootstrap(scope)
    return
  }

  const { version: remoteVersion } = await getCatalogVersion()
  if (remoteVersion === localVersion) {
    await refreshBusinessesOnly(scope)
    return
  }
  // Versión remota MENOR que la guardada: la base se reinició (p.ej. el backend de pruebas).
  // Los cambios "desde" una versión que ya no existe no sirven: se baja todo de nuevo.
  if (remoteVersion < localVersion) {
    await runFullBootstrap(scope)
    return
  }

  // Si hay más cambios de los que caben en una página, se sigue pidiendo desde donde se quedó.
  let since = localVersion
  for (let page = 0; page < MAX_CHANGE_PAGES; page++) {
    if (!isCurrent(scope)) return
    const result = await getCatalogChanges(since, CHANGES_PAGE_LIMIT)
    if (result.changes.length === 0) {
      await refreshBusinessesOnly(scope)
      return
    }
    const { reachedVersion, hasMore } = changesPageProgress(result, CHANGES_PAGE_LIMIT)
    const outcome = await applyChanges(scope, result.changes, reachedVersion)
    if (outcome === 'bootstrapped' || !hasMore) return
    since = reachedVersion
  }
}

let inFlight: { promise: Promise<void>; cityCode: string } | null = null

/** Sincroniza contra el backend. Silencioso si no hay conexión: la caché local sigue sirviendo. */
export function syncCatalog(): Promise<void> {
  const { cityCode } = useCatalogStore.getState()
  // Un solo sync a la vez por ciudad (arranque + volver a la pestaña + "reintentar" no se pisan).
  if (inFlight && inFlight.cityCode === cityCode) return inFlight.promise
  // Uno en vuelo de OTRA ciudad (el cliente cambió) NO se espera: la nueva arranca ya y lo que llegue de
  // la anterior se descarta (ver Scope), así cambiar de ciudad nunca queda detrás de una red lenta.
  const promise: Promise<void> = runSync().finally(() => {
    if (inFlight?.promise === promise) inFlight = null
  })
  inFlight = { promise, cityCode }
  return promise
}

/**
 * El cliente cambió de ciudad: lo de la anterior desaparece YA (nunca se muestra como si fuera de la
 * nueva), se pinta la caché de la nueva si la hay y se sincroniza. No hace nada si ya es la activa.
 */
export function switchCatalogCity(cityCode: string): void {
  if (useCatalogStore.getState().cityCode === cityCode) return
  useCatalogStore.getState().setCityScope(cityCode)
  hydrateCatalogFromStorage()
  void syncCatalog()
}

async function runSync(): Promise<void> {
  const scope = currentScope()
  const store = useCatalogStore.getState()
  if (!navigator.onLine) {
    store.setOffline(true)
    return
  }
  store.setOffline(false)
  store.setSyncing(true)
  store.setSyncError(null)
  try {
    await syncToLatest(scope, store.version)
    // También con la caché "al día": la versión no delata los huecos que deja una caché dañada.
    if (isCurrent(scope)) await repairBusinessesWithoutProducts(scope)
  } catch (err) {
    // Un fallo de la ciudad anterior no se le atribuye a la actual.
    if (!isCurrent(scope)) return
    if (err instanceof ApiError && (err.isNetworkError() || err.isTimeout())) {
      store.setOffline(true)
      return
    }
    store.setSyncError(err instanceof ApiError ? err.message : 'No pudimos actualizar el catálogo.')
  } finally {
    if (isCurrent(scope)) store.setSyncing(false)
  }
}
