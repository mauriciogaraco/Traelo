/**
 * Reglas de tiempo del seguimiento en vivo, todas en un solo lugar (nada de números mágicos
 * repartidos por hooks y componentes).
 */

/** Cada cuánto se consulta la ubicación mientras la pantalla está visible (5–10 s). */
export const COURIER_POLL_INTERVAL_MS = 8_000;

/** Tras fallos seguidos el intervalo se duplica hasta este tope, para no martillar una red mala. */
export const COURIER_POLL_MAX_BACKOFF_MS = 30_000;

/** Hasta esta antigüedad la ubicación se presenta como "en tiempo real" (Actualizado hace…). */
export const LOCATION_FRESH_MAX_MS = 45_000;

/**
 * Entre FRESH y este tope se muestra como "Última ubicación hace…" (marcador atenuado). Más
 * vieja que esto ya no se dibuja: se considera no disponible.
 */
export const LOCATION_STALE_MAX_MS = 15 * 60_000;
