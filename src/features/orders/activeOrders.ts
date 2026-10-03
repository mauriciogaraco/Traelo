import type { GuestOrderRef } from '../../store/guestStore';

/** Un pedido de invitado más viejo que esto ya no se consulta para el aviso flotante. */
export const ACTIVE_ORDER_WINDOW_MS = 24 * 60 * 60 * 1000;
/** Máximo de pedidos de invitado que se consultan a la vez (una petición de estado por cada uno). */
export const MAX_GUEST_ORDER_CHECKS = 3;

/** Pedidos de invitado que vale la pena consultar: recientes y que no se sabe que ya terminaron. */
export function guestOrdersToCheck(refs: GuestOrderRef[], now: number, finished: ReadonlySet<string>): GuestOrderRef[] {
  return refs
    .filter((ref) => !finished.has(ref.orderId) && now - Date.parse(ref.createdAt) <= ACTIVE_ORDER_WINDOW_MS)
    .slice(0, MAX_GUEST_ORDER_CHECKS);
}
