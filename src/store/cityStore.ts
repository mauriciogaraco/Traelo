import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type CityState = {
  /** El mercado desde el que el cliente quiere comprar — nunca su ubicación física (ver
   * audit/expansion-multiciudad/INFORME.md §E.1). null = todavía sin resolver (antes de hidratar,
   * o sin ninguna señal y sin default posible). Si hay una elección válida guardada no se vuelve a
   * preguntar al refrescar o volver. */
  selectedCityCode: string | null
  hasHydrated: boolean
  /** Cambia la ciudad (p. ej. corregir una elección guardada que ya no vale). */
  setCity: (code: string) => void
  /** La persona eligió esta ciudad (pregunta de entrada, selector del header o enlace con `?ciudad=`). */
  confirmCity: (code: string) => void
  setHasHydrated: () => void
}

/**
 * Ciudad activa del cliente — mismo patrón que cartStore/addressStore (persist en localStorage,
 * sobrevive a cerrar la pestaña). Quien decide QUÉ código guardar es `useCityBootstrap`
 * (prioridad: `?ciudad=` > lo persistido > default); este store solo lo guarda.
 *
 * Lo guardado NO es una autorización ni prueba de nada: solo cuenta si sigue siendo una ciudad
 * conocida (ver `resolveActiveCityCode`). El selector y la pregunta de entrada solo aparecen con 2+
 * ciudades; con una sola todo funciona como siempre.
 */
export const useCityStore = create<CityState>()(
  persist(
    (set) => ({
      selectedCityCode: null,
      hasHydrated: false,
      setCity: (code) => set({ selectedCityCode: code }),
      confirmCity: (code) => set({ selectedCityCode: code }),
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
