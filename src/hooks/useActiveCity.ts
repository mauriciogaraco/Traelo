import { useCallback } from 'react'
import { track } from '../analytics'
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
  const confirmCity = useCityStore((state) => state.confirmCity)
  useCitiesStore((state) => state.cities) // re-renderiza cuando llega la lista del servidor
  const cities = getCities()
  const cityCode = resolveActiveCityCode(selected, cities)
  const city = findCity(cityCode, cities)
  /** La persona elige: se guarda y se registra city_selected (con la anterior si cambia). */
  const chooseCity = useCallback(
    (code: string) => {
      const previous = useCityStore.getState().selectedCityCode
      confirmCity(code)
      track('city_selected', { properties: { cityCode: code, source: 'user', ...(previous && previous !== code ? { previous } : {}) } })
    },
    [confirmCity],
  )
  return {
    cities,
    cityCode,
    city,
    /** El hero del Home usa las fotos de Güira solo donde corresponden; en otra localidad, los logos de sus negocios. */
    hasHeroPhotos: !shouldShowCitySelector(cities) || Boolean(city?.heroPhotos),
    /** Hay algo que elegir: se muestra el selector del header y el nombre de la ciudad en carrito/checkout. */
    showSelector: shouldShowCitySelector(cities),
    /** Con 2+ ciudades se pregunta solo si no hay una elección válida guardada. */
    needsChoice: hasHydrated && needsCityChoice(selected, cities),
    /** La persona elige: se guarda y no se vuelve a preguntar. */
    chooseCity,
  }
}
