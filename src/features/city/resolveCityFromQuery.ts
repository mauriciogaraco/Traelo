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

/**
 * Qué ciudad aplicar desde `?ciudad=` en ESTE momento, o null si no hay nada nuevo que aplicar.
 *
 * Importa cuándo se llama: la lista de ciudades llega del servidor unos instantes DESPUÉS de abrir la web, así
 * que un cliente nuevo que entra por `/?ciudad=san-antonio-de-los-banos` todavía no la tiene y ese código aún
 * no se reconoce. Por eso se vuelve a evaluar cuando llega la lista; `lastApplied` evita volver a imponer la
 * ciudad del enlace si la persona ya la cambió a mano con el selector (la URL conserva el parámetro).
 */
export function cityFromQueryToApply(
  params: URLSearchParams,
  cities: readonly CityOption[],
  lastApplied: string | null,
): { code: string; key: string } | null {
  const code = resolveCityFromQuery(params, cities)
  if (!code) return null
  const key = `${params.toString()}|${code}`
  return key === lastApplied ? null : { code, key }
}

/** Enlace que abre la web ya en una localidad (para compartir): solo muestra los negocios de esa localidad. */
export function cityShareUrl(siteUrl: string, cityCode: string): string {
  return `${siteUrl}/?ciudad=${encodeURIComponent(cityCode)}`
}
