import { create } from 'zustand'
import { DEFAULT_CITY_CODE } from '../features/city/cities'
import type { CatalogBusiness, CatalogCategory, CatalogProduct } from '../types/backend/catalog'

type CatalogState = {
  /** Ciudad a la que pertenece lo que hay aquí: el catálogo siempre es de UNA ciudad (ver setCityScope). */
  cityCode: string
  version: number
  categories: CatalogCategory[]
  businesses: CatalogBusiness[]
  products: CatalogProduct[]
  lastSyncedAt: string | null
  /** true una vez que se intentó leer la caché local, haya o no datos. */
  hydrated: boolean
  isSyncing: boolean
  isOffline: boolean
  syncError: string | null
  setCatalog: (catalog: {
    version: number
    categories: CatalogCategory[]
    businesses: CatalogBusiness[]
    products: CatalogProduct[]
    lastSyncedAt: string
  }) => void
  /**
   * Cambia de ciudad: vacía todo AL INSTANTE (nada de la ciudad anterior puede quedar a la vista ni
   * contestarse como actual mientras llega el de la nueva). Quien llama hidrata la caché de esa ciudad.
   */
  setCityScope: (cityCode: string) => void
  setHydrated: () => void
  setSyncing: (syncing: boolean) => void
  setOffline: (offline: boolean) => void
  setSyncError: (error: string | null) => void
}

/**
 * Estado global del catálogo — mismo store que la app móvil. Solo `services/catalogSync.ts`
 * escribe aquí; las pantallas solo leen con selectores.
 */
export const useCatalogStore = create<CatalogState>((set) => ({
  cityCode: DEFAULT_CITY_CODE,
  version: 0,
  categories: [],
  businesses: [],
  products: [],
  lastSyncedAt: null,
  hydrated: false,
  isSyncing: false,
  isOffline: false,
  syncError: null,
  setCatalog: (catalog) =>
    set({
      version: catalog.version,
      categories: catalog.categories,
      businesses: catalog.businesses,
      products: catalog.products,
      lastSyncedAt: catalog.lastSyncedAt,
      syncError: null,
    }),
  setCityScope: (cityCode) =>
    set({
      cityCode,
      version: 0,
      categories: [],
      businesses: [],
      products: [],
      lastSyncedAt: null,
      hydrated: false,
      syncError: null,
    }),
  setHydrated: () => set({ hydrated: true }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setOffline: (isOffline) => set({ isOffline }),
  setSyncError: (syncError) => set({ syncError }),
}))
