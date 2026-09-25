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
import type { CatalogChange, CatalogProduct } from '../types/backend/catalog'

/**
 * Orquesta bootstrap + sincronización incremental del catálogo — misma lógica que
 * `services/catalogSync.ts` de la app móvil (checklist §17/§18). Server-authoritative: nunca calcula
 * precios ni disponibilidad, solo refleja /catalog. Solo este módulo escribe en el store y la caché.
 */

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

async function runFullBootstrap() {
  const bootstrap = await getCatalogBootstrap()
  persist({
    version: bootstrap.version,
    categories: bootstrap.categories,
    businesses: bootstrap.businesses,
    products: bootstrap.products,
  })
}

async function applyChanges(changes: CatalogChange[], latestVersion: number) {
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
  }

  let products = store.products
  if (productChangeIds.length > 0) {
    const resolution = resolveAffectedBusinessIds(productChangeIds, store.products)
    if (!resolution.resolved) {
      await runFullBootstrap()
      return
    }
    products = await refreshProductsForBusinesses(resolution.businessIds, store.products)
  }

  persist({ version: latestVersion, categories, businesses, products })
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
    if (store.version === 0) {
      await runFullBootstrap()
      return
    }

    const { version: remoteVersion } = await getCatalogVersion()
    if (remoteVersion === store.version) return
    // Versión remota MENOR que la guardada: la base se reinició (p.ej. el backend de pruebas).
    // Los cambios "desde" una versión que ya no existe no sirven: se baja todo de nuevo.
    if (remoteVersion < store.version) {
      await runFullBootstrap()
      return
    }

    const { changes, latestVersion } = await getCatalogChanges(store.version)
    if (changes.length === 0) return
    await applyChanges(changes, latestVersion)
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
