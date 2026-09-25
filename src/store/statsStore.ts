import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CatalogStats } from '../types/backend/catalog'

type StatsState = {
  /** null = nunca se han podido bajar: ordenar por popularidad/reseñas queda sin datos (no se inventan). */
  stats: CatalogStats | null
  /** Epoch ms de la última descarga correcta (para no volver a pedirlas a cada rato). */
  loadedAt: number | null
  setStats: (stats: CatalogStats) => void
}

/** Popularidad y calificaciones para ordenar Home y Buscar — igual que mobile, guardadas en el navegador. */
export const useStatsStore = create<StatsState>()(
  persist(
    (set) => ({
      stats: null,
      loadedAt: null,
      setStats: (stats) => set({ stats, loadedAt: Date.now() }),
    }),
    {
      name: 'traelo.catalogStats.v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ stats: state.stats, loadedAt: state.loadedAt }),
    },
  ),
)
