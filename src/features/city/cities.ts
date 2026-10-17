import { useCitiesStore } from '../../store/citiesStore'

export type CityOption = {
  /** Slug estable (`City.code` del backend). Es lo que viaja en `?ciudad=` y lo que se guarda. */
  code: string
  name: string
  /**
   * `City.id` del backend, para filtrar el catálogo en el servidor (`?cityId=`). Ausente = no se manda
   * ningún filtro (catálogo global, como hasta hoy). Hoy Güira NO lo lleva a propósito: su id sembrado
   * por la migración (`cty_guira_de_melena`) no pasa la validación `z.cuid()` de los endpoints
   * públicos de catálogo y respondería 400 (ver audit/expansion-multiciudad/INFORME.md §I).
   */
  apiId?: string
  /** El servidor dice si la localidad recibe pedidos ahora. Ausente = no se sabe. */
  acceptingOrders?: boolean
  /** Tiene fotos propias para el hero del Home (las de hoy son de negocios de Güira: no se muestran en otra localidad). */
  heroPhotos?: boolean
}

/** Güira de Melena: la ciudad de siempre. Los carritos y cachés anteriores a la expansión son suyos. */
export const DEFAULT_CITY_CODE = 'guira-de-melena'

/**
 * Ciudades que la web conoce. Lista estática: el backend todavía no tiene ningún endpoint PÚBLICO de
 * ciudades (`GET /cities` es solo de staff y el DTO público de negocios no trae `cityId`), así que no
 * hay de dónde leer nombres, ids ni si una ciudad acepta pedidos. NO se agrega San Antonio aquí hasta
 * que exista ese contrato: mostrarla sin datos reales sería inventar una oferta.
 * Con una sola ciudad la web se comporta exactamente como antes (sin selector ni preguntas).
 */
export const KNOWN_CITIES: readonly CityOption[] = [{ code: DEFAULT_CITY_CODE, name: 'Güira de Melena' }]

/**
 * Único punto de lectura de la lista de ciudades en la app. Hoy devuelve la lista estática; cuando el
 * backend exponga un endpoint público de ciudades, solo cambia esto (y los tests la sustituyen aquí).
 */
export function getCities(): readonly CityOption[] {
  const fromServer = useCitiesStore.getState().cities
  return fromServer.length > 0 ? fromServer : KNOWN_CITIES
}

/** Una localidad del servidor → la que usa la web. Descarta lo que no sea una localidad válida. */
export function cityFromApi(raw: unknown): CityOption | null {
  if (!raw || typeof raw !== 'object') return null
  const { id, code, name, acceptingOrders } = raw as Record<string, unknown>
  if (typeof id !== 'string' || !id || typeof code !== 'string' || !code || typeof name !== 'string' || !name) return null
  return {
    code,
    name,
    apiId: id,
    acceptingOrders: typeof acceptingOrders === 'boolean' ? acceptingOrders : undefined,
    heroPhotos: code === DEFAULT_CITY_CODE,
  }
}

export function isKnownCityCode(code: string, cities: readonly CityOption[] = KNOWN_CITIES): boolean {
  return cities.some((city) => city.code === code)
}

export function findCity(code: string | null | undefined, cities: readonly CityOption[] = KNOWN_CITIES): CityOption | null {
  if (!code) return null
  return cities.find((city) => city.code === code) ?? null
}

/**
 * Ciudad a usar sin ninguna señal: la única que existe. Con 2+ no hay "la" default — se espera una
 * elección explícita en vez de adivinar (el cliente puede comprar para alguien que no está donde él).
 */
export function defaultCityCode(cities: readonly CityOption[] = KNOWN_CITIES): string | null {
  return cities.length === 1 ? cities[0].code : null
}

/**
 * Ciudad activa a partir de lo guardado: solo cuenta si sigue siendo una ciudad conocida (una ciudad
 * dada de baja, o un valor viejo/manipulado del navegador, no es una elección válida); si no, la única
 * ciudad que exista; si no, null (hay que preguntar).
 */
export function resolveActiveCityCode(selected: string | null, cities: readonly CityOption[] = KNOWN_CITIES): string | null {
  if (selected && isKnownCityCode(selected, cities)) return selected
  return defaultCityCode(cities)
}

/** El selector (pill en el header) solo aparece cuando de verdad hay algo que elegir. */
export function shouldShowCitySelector(cities: readonly CityOption[] = KNOWN_CITIES): boolean {
  return cities.length > 1
}

/**
 * Con 2+ ciudades se pregunta "¿desde dónde quieres pedir?" solo cuando NO hay una elección válida
 * guardada (primera visita, o la guardada ya no existe). Con una elección válida no se vuelve a
 * preguntar al cerrar, refrescar o volver: se cambia desde el selector del header. Con una sola
 * ciudad no hay nada que elegir y nunca se pregunta.
 */
export function needsCityChoice(selected: string | null, cities: readonly CityOption[] = KNOWN_CITIES): boolean {
  if (!shouldShowCitySelector(cities)) return false
  return resolveActiveCityCode(selected, cities) === null
}

/** Parámetros de catálogo que dependen de la ciudad: solo si la ciudad conoce su id de servidor. */
export function cityQueryParams(city: CityOption | null): { cityId?: string } {
  return city?.apiId ? { cityId: city.apiId } : {}
}
