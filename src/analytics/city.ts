import type { TrackData } from './tracker'

/**
 * Añade la localidad activa (`cityCode`) a las propiedades de un evento, para poder separar por ciudad lo que
 * el servidor no puede deducir (las búsquedas no traen negocio). Si el evento ya trae su propio `cityCode`
 * (la pantalla de la promo es de San Antonio aunque se compre en otra localidad), ese manda.
 */
export function withCity(data: TrackData | undefined, activeCityCode: string | null | undefined): TrackData | undefined {
  if (!activeCityCode) return data
  const properties = data?.properties
  if (properties && 'cityCode' in properties && properties.cityCode) return data
  return { ...data, properties: { ...properties, cityCode: activeCityCode } }
}
