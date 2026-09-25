import { create } from 'zustand'
import type { CatalogBusiness, CatalogCategory, CatalogProduct } from '../types/backend/catalog'

type CatalogState = {
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
  setHydrated: () => set({ hydrated: true }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setOffline: (isOffline) => set({ isOffline }),
  setSyncError: (syncError) => set({ syncError }),
}))
