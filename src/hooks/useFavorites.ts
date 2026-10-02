import { useEffect } from 'react'
import { loadFavorites } from '../services/favoritesService'
import { useFavoritesStore } from '../store/favoritesStore'
import { useAuth } from './useAuth'

/** Carga los favoritos de la cuenta una sola vez por sesión. Sin cuenta no hay favoritos. */
export function useFavorites() {
  const { isAuthenticated } = useAuth()
  const loaded = useFavoritesStore((state) => state.loaded)
  const businesses = useFavoritesStore((state) => state.businesses)
  const products = useFavoritesStore((state) => state.products)

  useEffect(() => {
    if (isAuthenticated && !loaded) void loadFavorites().catch(() => undefined)
  }, [isAuthenticated, loaded])

  return { isAuthenticated, businesses, products, loaded }
}
