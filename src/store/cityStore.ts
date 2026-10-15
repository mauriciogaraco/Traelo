import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type CityState = {
  /** El mercado desde el que el cliente quiere comprar — nunca su ubicación física (ver
   * audit/expansion-multiciudad/INFORME.md §E.1). null = todavía sin resolver (antes de hidratar,
   * o sin ninguna señal y sin default posible). */
  selectedCityCode: string | null
  hasHydrated: boolean
  setCity: (code: string) => void
  setHasHydrated: () => void
}

/**
 * Ciudad activa del cliente — mismo patrón que cartStore/addressStore (persist en localStorage,
 * sobrevive a cerrar la pestaña). Quien decide QUÉ código guardar es `useCityBootstrap`
 * (prioridad: `?ciudad=` > lo persistido > default); este store solo lo guarda.
 *
 * Sin ningún selector visible todavía (decisión G.1 del informe): hoy nada lee
 * `selectedCityCode` para filtrar ni mostrar nada — es solo el estado, listo para cuando exista
 * el Escalón 2 (cityId en el servidor, ver F.3).
 */
export const useCityStore = create<CityState>()(
  persist(
    (set) => ({
      selectedCityCode: null,
      hasHydrated: false,
      setCity: (code) => set({ selectedCityCode: code }),
      setHasHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: 'traelo.city.v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selectedCityCode: state.selectedCityCode }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(),
    },
  ),
)
