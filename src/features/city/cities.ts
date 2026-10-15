export type CityOption = { code: string; name: string }

/**
 * Ciudades conocidas por el cliente — hoy una sola, Güira de Melena, que es la única que el
 * backend tiene sembrada y aceptando pedidos (ver audit/expansion-multiciudad/INFORME.md §B.9).
 * El `code` usa el mismo slug que `City.code` en el backend, para que cuando exista un endpoint
 * público de ciudades (Escalón 2, §E.6) no haga falta traducir nada.
 *
 * Lista estática a propósito: todavía no hay de dónde pedirla al servidor. Cuando el backend la
 * exponga, esto deja de ser una constante y pasa a venir del catálogo (ver F.3 del informe).
 */
export const KNOWN_CITIES: CityOption[] = [{ code: 'guira-de-melena', name: 'Güira de Melena' }]

export function isKnownCityCode(code: string): boolean {
  return KNOWN_CITIES.some((city) => city.code === code)
}

/**
 * Ciudad a usar cuando no hay ninguna señal (ni `?ciudad=` ni una elección guardada): la única
 * activa hoy. Si en algún momento hay más de una, no hay "la" default — se espera una señal
 * explícita en vez de adivinar (ver §E.3 del informe).
 */
export function defaultCityCode(): string | null {
  return KNOWN_CITIES.length === 1 ? KNOWN_CITIES[0].code : null
}
