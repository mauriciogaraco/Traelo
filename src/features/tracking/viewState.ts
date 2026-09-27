import type { OrderStatus } from '../../types/backend/order';
import type { OrderTracking } from '../../types/backend/tracking';
import { classifyFreshness, formatAgo, type LocationFreshness } from './freshness';
import type { LatLng } from '../maps';
import { formatDistance } from './distance';

export type TrackingError = 'offline' | 'error' | null;

export type TrackingPanelInput = {
  /** Estado que reporta el polling liviano del pedido (fuente principal). */
  orderStatus: OrderStatus | string | null | undefined;
  /** Última respuesta buena del tracking (se conserva aunque falle una consulta posterior). */
  tracking: OrderTracking | null;
  error: TrackingError;
  /** Primera consulta del tracking todavía en curso. */
  loading: boolean;
  /** Antigüedad de la ubicación ahora mismo (ver freshness.locationAgeMs). */
  ageMs: number | null;
  mapAvailable: boolean;
};

export type TrackingPanelView =
  /** Nada que mostrar: el pedido aún no tiene mensajero (o el estado no se conoce). */
  | { kind: 'hidden' }
  /** El pedido terminó: no hay seguimiento activo ni última ubicación. */
  | { kind: 'ended'; reason: 'completed' | 'cancelled'; message: string }
  | { kind: 'loading' }
  | {
      kind: 'active';
      freshness: LocationFreshness;
      /** Posición a dibujar; null si no hay o ya es demasiado vieja. */
      courier: LatLng | null;
      destination: LatLng | null;
      showMap: boolean;
      /** Frescura ("Actualizado hace 5 segundos", "Última ubicación hace 2 min") o por qué no hay ubicación. */
      caption: string;
      /** Aviso de conexión/servidor, aparte de la frescura. */
      notice: string | null;
      /** Solo es "tiempo real" con ubicación fresca y sin errores de conexión. */
      live: boolean;
      /**
       * Qué línea dibujar entre el mensajero y el destino: "street" = ruta por calles del backend;
       * "straight" = línea recta punteada de respaldo (sin ruta todavía o el motor falló); null = ninguna.
       */
      routeKind: 'street' | 'straight' | null;
      /** "a unos 1,8 km" — solo cuando hay ruta por calles (la línea recta no promete distancia). */
      distanceLabel: string | null;
    };

export const NO_LOCATION_MESSAGE = 'La ubicación del mensajero todavía no está disponible.';
export const TOO_OLD_MESSAGE = 'No tenemos una ubicación reciente del mensajero.';
const OFFLINE_NOTICE = 'Sin conexión — mostramos la última ubicación conocida.';
const OFFLINE_NO_DATA_NOTICE = 'No se pudo actualizar la ubicación. Revisa tu conexión.';
const ERROR_NOTICE = 'No se pudo actualizar la ubicación. Reintentaremos en unos segundos.';

function hasCoordinates(point: { latitude: number | null; longitude: number | null }): boolean {
  return point.latitude !== null && point.longitude !== null;
}

/**
 * Qué mostrar en el panel de seguimiento. Lógica pura sobre los estados REALES del backend
 * (solo ASSIGNED tiene seguimiento; PENDING no tiene mensajero; COMPLETED/CANCELLED terminaron).
 */
export function getTrackingPanelView(input: TrackingPanelInput): TrackingPanelView {
  const { orderStatus, tracking, error, loading, ageMs, mapAvailable } = input;

  if (orderStatus === 'COMPLETED' || tracking?.status === 'COMPLETED') {
    return { kind: 'ended', reason: 'completed', message: 'Pedido entregado — el seguimiento en vivo terminó.' };
  }
  if (orderStatus === 'CANCELLED' || tracking?.status === 'CANCELLED') {
    return { kind: 'ended', reason: 'cancelled', message: 'Pedido cancelado — no hay seguimiento.' };
  }
  if (orderStatus !== 'ASSIGNED') return { kind: 'hidden' };

  if (!tracking) {
    if (loading && !error) return { kind: 'loading' };
    // Sin ninguna respuesta todavía y con fallo: el pedido sigue visible, solo se avisa.
    return {
      kind: 'active',
      freshness: 'unavailable',
      courier: null,
      destination: null,
      showMap: false,
      caption: NO_LOCATION_MESSAGE,
      notice: error === 'offline' ? OFFLINE_NO_DATA_NOTICE : ERROR_NOTICE,
      live: false,
      routeKind: null,
      distanceLabel: null,
    };
  }

  const freshness = classifyFreshness(tracking.location ? ageMs : null);
  const courier: LatLng | null =
    tracking.location && freshness !== 'unavailable'
      ? { latitude: tracking.location.latitude, longitude: tracking.location.longitude }
      : null;
  const destination: LatLng | null = hasCoordinates(tracking.destination)
    ? { latitude: tracking.destination.latitude as number, longitude: tracking.destination.longitude as number }
    : null;

  // Con un fallo de conexión/servidor lo que se ve es lo último que se supo: nunca "tiempo real".
  const live = freshness === 'fresh' && error === null;

  // La línea solo tiene sentido con las dos puntas (mensajero visible + pin de destino).
  const routeKind: 'street' | 'straight' | null =
    courier && destination ? (tracking.route && tracking.route.coordinates.length >= 2 ? 'street' : 'straight') : null;

  let caption: string;
  if (!tracking.location) caption = NO_LOCATION_MESSAGE;
  else if (freshness === 'unavailable' || ageMs === null) caption = TOO_OLD_MESSAGE;
  else caption = `${live ? 'Actualizado' : 'Última ubicación'} ${formatAgo(ageMs)}`;

  return {
    kind: 'active',
    freshness,
    courier,
    destination,
    showMap: mapAvailable && (courier !== null || destination !== null),
    caption,
    notice: error === 'offline' ? OFFLINE_NOTICE : error === 'error' ? ERROR_NOTICE : null,
    live,
    routeKind,
    distanceLabel: routeKind === 'street' && tracking.route ? formatDistance(tracking.route.distanceMeters) || null : null,
  };
}
