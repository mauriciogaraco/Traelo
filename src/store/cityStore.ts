import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * "Ya me dijeron desde dónde pido EN ESTA VISITA": vive en sessionStorage (se borra al cerrar la
 * pestaña), no en localStorage — una visita nueva siempre vuelve a preguntar (ver `needsCityChoice`),
 * pero navegar o recargar dentro de la misma visita no repite la pregunta.
 */
const VISIT_KEY = 'traelo.city.confirmed.v1'

function readConfirmedThisVisit(): boolean {
  try {
    return sessionStorage.getItem(VISIT_KEY) === '1'
  } catch {
    return false
  }
}

function markConfirmedThisVisit(): void {
  try {
    sessionStorage.setItem(VISIT_KEY, '1')
  } catch {
    // Sin sessionStorage (modo privado estricto): se pregunta una vez por carga, no pasa nada.
  }
}

type CityState = {
  /** El mercado desde el que el cliente quiere comprar — nunca su ubicación física (ver
   * audit/expansion-multiciudad/INFORME.md §E.1). null = todavía sin resolver (antes de hidratar,
   * o sin ninguna señal y sin default posible). Lo guardado de una visita anterior queda como
   * preselección: no evita la pregunta de esta visita. */
  selectedCityCode: string | null
  hasHydrated: boolean
  /** La persona ya eligió (o llegó con `?ciudad=`) en ESTA visita. No se persiste entre visitas. */
  confirmedThisVisit: boolean
  /** Cambia la ciudad SIN darla por confirmada (p. ej. corregir una elección guardada que ya no vale). */
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
      confirmedThisVisit: readConfirmedThisVisit(),
      setCity: (code) => set({ selectedCityCode: code }),
      confirmCity: (code) => {
        markConfirmedThisVisit()
        set({ selectedCityCode: code, confirmedThisVisit: true })
      },
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
