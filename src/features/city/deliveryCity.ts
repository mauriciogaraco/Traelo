import { findCity, type CityOption } from './cities'

/**
 * Localidad donde se ENTREGA el pedido (distinta de la localidad desde la que se compra, que es la del
 * catálogo): si es otra, el servidor cobra la mensajería FIJA entre localidades en vez de la de dentro del
 * pueblo. Prioridad: lo que la persona eligió ahora > la localidad guardada con la dirección elegida >
 * la localidad desde la que compra.
 */
export function resolveDeliveryCityCode(params: {
  override: string | null | undefined
  savedAddressCityCode: string | null | undefined
  activeCityCode: string | null
  cities: readonly CityOption[]
}): string | null {
  const { override, savedAddressCityCode, activeCityCode, cities } = params
  for (const code of [override, savedAddressCityCode]) {
    if (code && findCity(code, cities)) return code
  }
  return activeCityCode
}

/** ¿Se entrega en una localidad distinta a la de los negocios? Solo existe con 2+ localidades. */
export function isCrossCityDelivery(deliveryCityCode: string | null, activeCityCode: string | null, cities: readonly CityOption[]): boolean {
  return cities.length > 1 && deliveryCityCode !== null && activeCityCode !== null && deliveryCityCode !== activeCityCode
}

/**
 * `City.id` que viaja como `deliveryCityId`. Solo con 2+ localidades y solo si la localidad conoce su id de
 * servidor; con una sola no se manda nada (todo funciona como siempre).
 */
export function deliveryCityIdFor(deliveryCityCode: string | null, cities: readonly CityOption[]): string | undefined {
  if (cities.length < 2 || !deliveryCityCode) return undefined
  return findCity(deliveryCityCode, cities)?.apiId
}

/**
 * Valor del selector para "Otra ubicación": entrega fuera de las localidades configuradas. La persona comparte
 * su ubicación y la mensajería se cobra por kilómetro desde el centro del pueblo de los negocios.
 */
export const ELSEWHERE_CODE = '__elsewhere__'

/** El servidor no puede medir la entrega en otra ubicación (el pueblo no tiene coordenadas configuradas). */
export const CITY_COORDINATES_MISSING_CODE = 'CITY_COORDINATES_MISSING'

/** El servidor no tiene tarifa para entregar de una localidad en otra. */
export const DELIVERY_ROUTE_UNAVAILABLE_CODE = 'DELIVERY_ROUTE_UNAVAILABLE'
