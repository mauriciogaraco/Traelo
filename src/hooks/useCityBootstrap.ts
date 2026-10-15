import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { defaultCityCode, resolveCityFromQuery } from '../features/city'
import { useCityStore } from '../store/cityStore'

/**
 * Resuelve la ciudad activa al cargar — orden de prioridad (ver §E.3 del informe):
 * 1. `?ciudad=<code>` de la URL (enlace promocional): gana siempre, incluso sobre lo persistido —
 *    es la forma en que un enlace a un negocio de otra ciudad puede "aterrizar correcto" (§E.5).
 * 2. Lo persistido de una visita anterior (`zustand/persist` ya lo hidrata solo).
 * 3. La única ciudad activa, si al terminar de hidratar no hay ninguna señal.
 *
 * Puramente estado: no renderiza nada, no depende de red ni cambia ninguna pantalla (F.2 del
 * informe) — sin selector visible todavía (decisión G.1), esto solo deja el dato listo.
 */
export function useCityBootstrap(): void {
  const [params] = useSearchParams()

  useEffect(() => {
    const fromQuery = resolveCityFromQuery(params)
    if (fromQuery) useCityStore.getState().setCity(fromQuery)
  }, [params])

  useEffect(() => {
    const applyDefaultIfNeeded = () => {
      const { selectedCityCode, hasHydrated, setCity } = useCityStore.getState()
      if (!hasHydrated || selectedCityCode) return
      const fallback = defaultCityCode()
      if (fallback) setCity(fallback)
    }
    const unsubscribe = useCityStore.subscribe(applyDefaultIfNeeded)
    applyDefaultIfNeeded()
    return unsubscribe
  }, [])
}
