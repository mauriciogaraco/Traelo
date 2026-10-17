import { getCatalogCities } from '../api/catalog'
import { cityFromApi, type CityOption } from '../features/city/cities'
import { useCitiesStore } from '../store/citiesStore'
import { reconcileCatalogFilter } from './catalogSync'

let inFlight: Promise<boolean> | null = null

/**
 * Baja las localidades del servidor (con el `id` que se manda como `?cityId=`). Nunca lanza: sin red o
 * con un backend que aún no tiene el endpoint se conserva lo último guardado (o la lista mínima). Si la
 * lista cambia el filtro de la localidad activa, el catálogo en pantalla se rehace (ver
 * `reconcileCatalogFilter`). Devuelve true si llegó una lista válida.
 */
export function refreshCities(): Promise<boolean> {
  if (inFlight) return inFlight
  inFlight = getCatalogCities()
    .then((raw) => {
      const cities = (Array.isArray(raw) ? raw : []).map(cityFromApi).filter((city): city is CityOption => city !== null)
      if (cities.length === 0) return false
      useCitiesStore.getState().setCities(cities)
      reconcileCatalogFilter()
      return true
    })
    .catch(() => false)
    .finally(() => {
      inFlight = null
    })
  return inFlight
}
