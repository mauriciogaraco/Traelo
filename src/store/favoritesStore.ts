import { create } from 'zustand'
import type { FavoriteBusiness, FavoriteProduct } from '../types/backend/customer'

type FavoritesState = {
  loaded: boolean
  businesses: FavoriteBusiness[]
  products: FavoriteProduct[]

  setFavorites: (data: { businesses: FavoriteBusiness[]; products: FavoriteProduct[] }) => void
  addBusiness: (fav: FavoriteBusiness) => void
  removeBusiness: (businessId: string) => void
  addProduct: (fav: FavoriteProduct) => void
  removeProduct: (productId: string) => void
  clear: () => void
}

/** Favoritos del cliente actual. Se cargan una vez al abrir "Mi cuenta"; cerrar sesión los borra. */
export const useFavoritesStore = create<FavoritesState>((set) => ({
  loaded: false,
  businesses: [],
  products: [],

  setFavorites: ({ businesses, products }) => set({ businesses, products, loaded: true }),
  addBusiness: (fav) => set((state) => ({ businesses: [...state.businesses, fav] })),
  removeBusiness: (businessId) =>
    set((state) => ({ businesses: state.businesses.filter((b) => b.businessId !== businessId) })),
  addProduct: (fav) => set((state) => ({ products: [...state.products, fav] })),
  removeProduct: (productId) =>
    set((state) => ({ products: state.products.filter((p) => p.productId !== productId) })),
  clear: () => set({ businesses: [], products: [], loaded: false }),
}))
