import type { OrderStatus } from '../../types/backend/order';

/**
 * Traduce los estados reales del backend a las etapas simples del checklist §29.
 * Nunca inventar estados que la API no soporte (p.ej. "en camino" con GPS).
 */
/**
 * El backend también reporta las sub-fases que avanza el mensajero desde su app (CONFIRMED,
 * HEADING_OUT, PICKING_UP, ON_THE_WAY). Para el cliente todas son "el mensajero ya lo tiene"
 * (ASSIGNED): el detalle fino (Recogiendo / En camino) lo dan `pickingUpAt` / `onTheWayAt`, que el
 * backend marca con esas fases, y "Marchando" (HEADING_OUT) lo da `substatus`. Se traduce AQUÍ, una sola vez, al recibir el pedido, para que el resto
 * de la app siga trabajando con sus 4 estados. Un estado que no conocemos se deja tal cual (la UI ya
 * lo trata como "desconocido" sin romperse).
 */
const COURIER_SUBSTATUSES = new Set(['CONFIRMED', 'HEADING_OUT', 'PICKING_UP', 'ON_THE_WAY']);

export function normalizeOrderStatus<T extends { status: string }>(order: T): T {
  // Se conserva la sub-fase real: "Marchando" (HEADING_OUT) sale de ahí, no tiene marca de tiempo propia.
  return COURIER_SUBSTATUSES.has(order.status) ? { ...order, status: 'ASSIGNED', substatus: order.status } : order;
}

export function getOrderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pedido recibido';
    case 'ASSIGNED':
      // Sin "en camino": el backend no reporta ese estado (ver features/orders/tracking.ts).
      return 'Mensajero asignado';
    case 'COMPLETED':
      return 'Completado';
    case 'CANCELLED':
      return 'Cancelado';
    default:
      // Un estado nuevo del backend que esta versión no conoce: nunca undefined (rompía la pantalla).
      return 'Pedido en curso';
  }
}

export function isOrderActive(status: OrderStatus): boolean {
  return status === 'PENDING' || status === 'ASSIGNED';
}
