/** Seguimiento en vivo del pedido — ver docs/BACKEND_API.md §4d. */

import type { OrderStatus } from './order';

/** Última posición conocida del mensajero (la fija el servidor; nunca viene del teléfono del cliente). */
export type CourierLocation = {
  latitude: number;
  longitude: number;
  /** Precisión del GPS en metros, si el dispositivo del mensajero la reportó. */
  accuracy: number | null;
  /** Cuándo la registró el servidor (ISO). */
  updatedAt: string;
};

export type OrderRoute = {
  coordinates: { latitude: number; longitude: number }[];
  /** Distancia por calles, en metros. */
  distanceMeters: number;
  /** Cuándo la calculó el servidor (ISO): cambia solo cuando la ruta se recalcula. */
  computedAt: string;
};

/** Respuesta de GET .../orders/:orderId/tracking. */
export type OrderTracking = {
  orderId: string;
  orderNumber: number;
  status: OrderStatus;
  /** true solo mientras el pedido está en curso con mensajero; en COMPLETED/CANCELLED es false. */
  trackingActive: boolean;
  /** Etapas reportadas por el backend (null = todavía no; ausente = backend anterior). */
  pickingUpAt?: string | null;
  onTheWayAt?: string | null;
  /** Hora del servidor: la antigüedad de la ubicación se calcula contra ella, no contra el reloj del teléfono. */
  serverTime: string;
  /** Solo el nombre: no hay id ni teléfono del mensajero. */
  deliverer: { name: string; photoUrl?: string | null } | null;
  /** null hasta que el mensajero envía su primera posición (o si ya está desactualizada en el servidor). */
  location: CourierLocation | null;
  /**
   * Recorrido por calles del mensajero al destino, calculado por el backend (la app solo lo dibuja).
   * null si no hay: sin pin de destino, sin ubicación del mensajero, o el motor de rutas aún no
   * respondió o falló. Sin duración/ETA a propósito.
   */
  route: OrderRoute | null;
  /** Snapshot del pedido. Las coordenadas son null si la dirección no se pudo ubicar en el mapa. */
  destination: {
    address: string;
    reference: string | null;
    latitude: number | null;
    longitude: number | null;
  };
};
