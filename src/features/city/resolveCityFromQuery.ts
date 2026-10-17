import { isKnownCityCode, KNOWN_CITIES, type CityOption } from './cities'

/**
 * Lee `?ciudad=<code>` de la URL — para enlaces promocionales que deben aterrizar en la ciudad
 * correcta (ver §E.3/E.5 del informe). Nunca confía en un código arbitrario: solo devuelve uno de las
 * ciudades conocidas, o null si no viene o no se reconoce. Que el enlace diga una ciudad no prueba que
 * el negocio sea de ella: eso lo decide el catálogo de esa ciudad (filtrado por el servidor).
 */
export function resolveCityFromQuery(params: URLSearchParams, cities: readonly CityOption[] = KNOWN_CITIES): string | null {
  const code = params.get('ciudad')?.trim().toLowerCase()
  if (!code) return null
  return isKnownCityCode(code, cities) ? code : null
}
