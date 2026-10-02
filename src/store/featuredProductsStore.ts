import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CatalogProduct } from '../types/backend/catalog'

type FeaturedProductsState = {
  products: CatalogProduct[]
  /** Epoch ms de la última descarga correcta (para no volver a pedirlos a cada rato). */
  loadedAt: number | null
  setProducts: (products: CatalogProduct[]) => void
}

/** "Ofertas destacadas" del Home (marcadas a mano en el dashboard) — igual que mobile. */
export const useFeaturedProductsStore = create<FeaturedProductsState>()(
  persist(
    (set) => ({
      products: [],
      loadedAt: null,
      setProducts: (products) => set({ products, loadedAt: Date.now() }),
    }),
    {
      name: 'traelo.featuredProducts.v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ products: state.products, loadedAt: state.loadedAt }),
    },
  ),
)
