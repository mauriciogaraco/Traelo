import type { CourierLocation } from '../../types/backend/tracking';
import { LOCATION_FRESH_MAX_MS, LOCATION_STALE_MAX_MS } from './config';

export type LocationFreshness = 'fresh' | 'stale' | 'unavailable';

/**
 * Antigüedad de la ubicación ahora mismo. Se mide contra la hora del SERVIDOR (serverTime, sellada
 * en la misma respuesta que la ubicación) y solo se le suma lo que pasó desde que llegó la
 * respuesta, con el reloj del teléfono. Así un teléfono con la hora mal puesta no falsea la
 * frescura. null si no hay ubicación o las fechas no son válidas.
 */
export function locationAgeMs(
  location: CourierLocation | null,
  serverTime: string,
  receivedAtMs: number,
  nowMs: number,
): number | null {
  if (!location) return null;
  const atServer = Date.parse(serverTime) - Date.parse(location.updatedAt);
  if (Number.isNaN(atServer)) return null;
  return Math.max(0, atServer) + Math.max(0, nowMs - receivedAtMs);
}

export function classifyFreshness(ageMs: number | null): LocationFreshness {
  if (ageMs === null) return 'unavailable';
  if (ageMs <= LOCATION_FRESH_MAX_MS) return 'fresh';
  if (ageMs <= LOCATION_STALE_MAX_MS) return 'stale';
  return 'unavailable';
}

/** "hace 5 segundos", "hace 2 min", "hace 1 h 5 min". */
export function formatAgo(ageMs: number): string {
  const seconds = Math.max(0, Math.floor(ageMs / 1000));
  if (seconds < 60) return `hace ${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `hace ${hours} h` : `hace ${hours} h ${rest} min`;
}
