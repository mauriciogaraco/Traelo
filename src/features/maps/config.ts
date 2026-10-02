/**
 * Configuración del proveedor de mapas — el ÚNICO lugar que conoce qué proveedor se usa. Cambiar de
 * OpenFreeMap a MapTiler, Stadia o infraestructura propia es cambiar esta URL (`VITE_MAP_STYLE_URL`)
 * sin tocar pantallas ni el seguimiento del pedido.
 *
 * OpenFreeMap "liberty": estilo compatible con MapLibre, sin API key. La instancia pública no tiene
 * SLA: por eso la URL es configurable. Mantener visible la atribución del mapa (MapLibre muestra el
 * botón "i"; no se oculta).
 */
export const MAP_STYLE_URL =
  (import.meta.env.VITE_MAP_STYLE_URL as string | undefined)?.trim() || 'https://tiles.openfreemap.org/styles/liberty'

/** Niveles de zoom de MapLibre (más alto = más cerca). */
export const MAP_ZOOM = {
  /** Se ve el barrio. */
  area: 14,
  /** Se ve la cuadra: alrededor de un pin ya colocado. */
  pin: 16,
} as const

/** Centro por defecto del mapa (Güira de Melena), si todavía no hay ningún punto que encuadrar. */
export const DEFAULT_MAP_CENTER = { latitude: 22.7958, longitude: -82.5065 } as const
