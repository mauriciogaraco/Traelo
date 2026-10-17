import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getCities, resolveActiveCityCode, resolveCityFromQuery } from '../features/city'
import { switchCatalogCity } from '../services/catalogSync'
import { useCartStore } from '../store/cartStore'
import { useCityStore } from '../store/cityStore'

/**
 * Resuelve la ciudad activa y se la aplica al catálogo y al carrito — orden de prioridad (§E.3):
 * 1. `?ciudad=<code>` de la URL (enlace promocional): gana siempre, incluso sobre lo persistido.
 *    Solo ciudades conocidas; que el enlace la diga no prueba que el negocio sea de ella (eso lo
 *    decide el catálogo de esa ciudad).
 * 2. Lo persistido de una visita anterior, solo si sigue siendo una ciudad conocida.
 * 3. La única ciudad que exista (con 2+ y sin señal, no se adivina: se pregunta, ver `CityChooser`).
 *
 * Cada cambio de ciudad vacía el catálogo anterior al instante, pinta la caché de la nueva y guarda
 * (sin perder nada) el carrito de la que se deja. Con una sola ciudad nada de esto llega a ocurrir.
 */
export function useCityBootstrap(): void {
  const [params] = useSearchParams()
  const selected = useCityStore((state) => state.selectedCityCode)
  const hasHydrated = useCityStore((state) => state.hasHydrated)

  useEffect(() => {
    const fromQuery = resolveCityFromQuery(params, getCities())
    // Un enlace que ya dice la localidad cuenta como elección de esta visita (no se interrumpe con la pregunta).
    if (fromQuery) useCityStore.getState().confirmCity(fromQuery)
  }, [params])

  const activeCode = hasHydrated ? resolveActiveCityCode(selected, getCities()) : null

  // Una elección guardada que ya no vale (ciudad dada de baja, valor manipulado) se corrige solo
  // cuando hay una única salida posible; con 2+ queda sin resolver y se pregunta.
  useEffect(() => {
    if (activeCode && activeCode !== selected) useCityStore.getState().setCity(activeCode)
  }, [activeCode, selected])

  useEffect(() => {
    if (!activeCode) return
    useCartStore.getState().switchCity(activeCode)
    switchCatalogCity(activeCode)
  }, [activeCode])
}
