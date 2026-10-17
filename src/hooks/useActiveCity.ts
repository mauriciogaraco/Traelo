import { findCity, getCities, needsCityChoice, resolveActiveCityCode, shouldShowCitySelector } from '../features/city'
import { useCitiesStore } from '../store/citiesStore'
import { useCityStore } from '../store/cityStore'

/**
 * La ciudad desde la que el cliente quiere comprar (nunca dónde está físicamente) y lo que la UI
 * necesita saber de ella. Con una sola ciudad conocida no hay selector ni pregunta.
 */
export function useActiveCity() {
  const selected = useCityStore((state) => state.selectedCityCode)
  const hasHydrated = useCityStore((state) => state.hasHydrated)
  const confirmedThisVisit = useCityStore((state) => state.confirmedThisVisit)
  const chooseCity = useCityStore((state) => state.confirmCity)
  useCitiesStore((state) => state.cities) // re-renderiza cuando llega la lista del servidor
  const cities = getCities()
  const cityCode = resolveActiveCityCode(selected, cities)
  return {
    cities,
    cityCode,
    city: findCity(cityCode, cities),
    /** Hay algo que elegir: se muestra el selector del header y el nombre de la ciudad en carrito/checkout. */
    showSelector: shouldShowCitySelector(cities),
    /** Con 2+ ciudades se pregunta en CADA visita nueva (y siempre que no haya una elección válida). */
    needsChoice: hasHydrated && needsCityChoice(selected, cities, confirmedThisVisit),
    /** La persona elige: se guarda y se da por confirmada para esta visita. */
    chooseCity,
  }
}
