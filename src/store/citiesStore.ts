import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CityOption } from '../features/city/cities'

type CitiesState = {
  /** Localidades que devolvió el servidor la última vez. Vacío = nunca se pudieron bajar (se usa la lista mínima). */
  cities: CityOption[]
  setCities: (cities: CityOption[]) => void
}

/**
 * Localidades del servidor (`GET /catalog/cities`), guardadas para que la siguiente visita pinte la
 * pregunta de entrada sin esperar a la red. Lo guardado no autoriza nada: el servidor valida el
 * `cityId` de cada pedido.
 */
export const useCitiesStore = create<CitiesState>()(
  persist(
    (set) => ({ cities: [], setCities: (cities) => set({ cities }) }),
    { name: 'traelo.cities.v1', storage: createJSONStorage(() => localStorage), partialize: (state) => ({ cities: state.cities }) },
  ),
)
