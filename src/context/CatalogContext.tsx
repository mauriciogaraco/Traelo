import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { Business, Product } from '../types'
import { initCatalog, ensureBusinessProducts, getBusinessProductsSync, isBusinessLoaded } from '../services/catalog'
import { _setBusinessCache } from '../data/catalog'

interface CatalogState {
  businesses: Business[]
  /** Search-index: todos los productos sin longDescription. Usar para búsqueda, listados y destacados. */
  products: Product[]
  loading: boolean
  syncing: boolean
  /** Carga los productos completos de un negocio en segundo plano. */
  loadBusinessProducts: (businessId: string) => Promise<void>
  /** Devuelve el producto completo (con longDescription) si su negocio ya cargó; si no, devuelve el stub del índice. */
  getFullProduct: (productId: string) => Product | undefined
  /** Indica si los productos completos de un negocio ya están listos. */
  isBusinessLoaded: (businessId: string) => boolean
}

const CatalogContext = createContext<CatalogState>({
  businesses: [],
  products: [],
  loading: true,
  syncing: false,
  loadBusinessProducts: async () => {},
  getFullProduct: () => undefined,
  isBusinessLoaded: () => false,
})

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [products, setProducts]     = useState<Product[]>([])
  const [loading, setLoading]       = useState(true)
  const [syncing, setSyncing]       = useState(false)
  // Se incrementa cada vez que un archivo de negocio termina de cargar,
  // forzando un re-render para que getFullProduct devuelva datos frescos.
  const [loadTick, setLoadTick] = useState(0)

  useEffect(() => {
    const { businesses: cachedBiz, searchIndex: cachedIdx, synced } = initCatalog()

    if (cachedBiz.length > 0) {
      setBusinesses(cachedBiz)
      setProducts(cachedIdx)
      _setBusinessCache(cachedBiz)
      setLoading(false)
      setSyncing(true)
    }

    synced.then((fresh) => {
      if (fresh) {
        setBusinesses(fresh.businesses)
        setProducts(fresh.searchIndex)
        _setBusinessCache(fresh.businesses)
      }
      setLoading(false)
      setSyncing(false)
    })
  }, [])

  const loadBusinessProducts = useCallback(async (businessId: string) => {
    if (isBusinessLoaded(businessId)) return
    await ensureBusinessProducts(businessId)
    setLoadTick((t) => t + 1)
  }, [])

  // getFullProduct y isBusinessLoaded se recalculan en cada render (incluyendo
  // cuando loadTick sube), así que no necesitan useCallback con loadTick en deps.
  const getFullProduct = (productId: string): Product | undefined => {
    const stub = products.find((p) => p.id === productId)
    if (!stub) return undefined
    const loaded = getBusinessProductsSync(stub.businessId)
    return loaded?.find((p) => p.id === productId) ?? stub
  }

  const checkIsBusinessLoaded = (businessId: string): boolean => {
    void loadTick // Hace que la función sea reactiva al tick
    return isBusinessLoaded(businessId)
  }

  return (
    <CatalogContext.Provider value={{
      businesses,
      products,
      loading,
      syncing,
      loadBusinessProducts,
      getFullProduct,
      isBusinessLoaded: checkIsBusinessLoaded,
    }}>
      {children}
    </CatalogContext.Provider>
  )
}

export function useCatalog() {
  return useContext(CatalogContext)
}
