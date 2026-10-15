import { isKnownCityCode } from './cities'

/**
 * Lee `?ciudad=<code>` de la URL — para enlaces promocionales que deben aterrizar en la ciudad
 * correcta (ver §E.3/E.5 del informe). Nunca confía en un código arbitrario: solo devuelve uno de
 * `KNOWN_CITIES`, o null si no viene o no se reconoce.
 */
export function resolveCityFromQuery(params: URLSearchParams): string | null {
  const code = params.get('ciudad')?.trim().toLowerCase()
  if (!code) return null
  return isKnownCityCode(code) ? code : null
}
