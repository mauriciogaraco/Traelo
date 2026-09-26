import { apiGet, apiPost } from './client';
import { normalizeOrderStatus } from '../features/orders/orderStatus';
import type { Order, OrderStatusPoll } from '../types/backend/order';
import type { BusinessRatingInput, OrderReviewState, PendingReview } from '../types/backend/review';
import type { OrderTracking } from '../types/backend/tracking';

/**
 * Quién consulta un pedido: una cuenta (Bearer) o un invitado (token del pedido, en X-Guest-Token).
 * Las dos vías devuelven exactamente las mismas formas; solo cambian la ruta y la credencial.
 */
export type OrderAccess = { kind: 'customer' } | { kind: 'guest'; token: string };

function route(orderId: string, access: OrderAccess): { base: string; options: { auth?: boolean; headers?: Record<string, string> } } {
  return access.kind === 'customer'
    ? { base: `/customers/me/orders/${orderId}`, options: { auth: true } }
    : { base: `/guest/orders/${orderId}`, options: { headers: { 'X-Guest-Token': access.token } } };
}

export function getOrderDetail(orderId: string, access: OrderAccess) {
  const { base, options } = route(orderId, access);
  return apiGet<Order>(base, undefined, options).then(normalizeOrderStatus);
}

/** Polling ligero mientras el pedido esté activo — detener en COMPLETED/CANCELLED (checklist §30). */
export function getOrderStatus(orderId: string, access: OrderAccess) {
  const { base, options } = route(orderId, access);
  return apiGet<OrderStatusPoll>(`${base}/status`, undefined, options).then(normalizeOrderStatus);
}

/**
 * Ubicación del mensajero y destino de un pedido en curso. El backend decide si hay algo que
 * mostrar (solo con mensajero asignado y pedido activo); `signal` cancela la consulta en vuelo.
 */
export function getOrderTracking(orderId: string, access: OrderAccess, signal?: AbortSignal) {
  const { base, options } = route(orderId, access);
  return apiGet<OrderTracking>(`${base}/tracking`, undefined, { ...options, signal }).then(normalizeOrderStatus);
}

export function getOrderReviews(orderId: string, access: OrderAccess) {
  const { base, options } = route(orderId, access);
  return apiGet<OrderReviewState>(`${base}/reviews`, undefined, options);
}

/** El mensajero NUNCA se envía: el backend lo deduce del pedido. */
export function submitDelivererReview(orderId: string, rating: number, access: OrderAccess) {
  const { base, options } = route(orderId, access);
  return apiPost<OrderReviewState>(`${base}/reviews/deliverer`, { rating }, options);
}

export function submitBusinessReviews(orderId: string, reviews: BusinessRatingInput[], access: OrderAccess) {
  const { base, options } = route(orderId, access);
  return apiPost<OrderReviewState>(`${base}/reviews/businesses`, { reviews }, options);
}

/**
 * Opinión libre y opcional sobre el pedido — no se guarda junto a las valoraciones por estrellas,
 * el backend solo la reenvía a Telegram identificada por el pedido (nunca datos del cliente).
 */
export function submitOrderComment(orderId: string, comment: string, access: OrderAccess) {
  const { base, options } = route(orderId, access);
  return apiPost<{ ok: boolean }>(`${base}/reviews/comment`, { comment }, options);
}

/** Pedidos completados recientes a los que todavía les falta alguna valoración (solo con cuenta). */
export function listPendingReviews() {
  return apiGet<PendingReview[]>('/customers/me/reviews/pending', undefined, { auth: true });
}
