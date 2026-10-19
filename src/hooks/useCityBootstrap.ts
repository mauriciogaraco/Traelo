import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { cityFromQueryToApply, getCities, resolveActiveCityCode } from '../features/city'
import { useCitiesStore } from '../store/citiesStore'
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
  // La lista llega del servidor: al cambiar, se vuelve a resolver la ciudad activa.
  const knownCities = useCitiesStore((state) => state.cities)
  const appliedFromQuery = useRef<string | null>(null)

  // `knownCities` entra en las dependencias a propósito: un cliente nuevo abre `?ciudad=` ANTES de tener la lista
  // del servidor, y el código del enlace solo se reconoce cuando esta llega.
  useEffect(() => {
    const next = cityFromQueryToApply(params, getCities(), appliedFromQuery.current)
    if (!next) return
    appliedFromQuery.current = next.key
    // Un enlace que ya dice la localidad cuenta como elección de esta visita (no se interrumpe con la pregunta).
    useCityStore.getState().confirmCity(next.code)
  }, [params, knownCities])

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
