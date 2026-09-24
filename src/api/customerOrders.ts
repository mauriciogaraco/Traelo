import { apiGetPaginated, apiPost } from './client';
import type { ApiPaginated } from '../types/backend/api';
import type { RepeatOrderResult, Order } from '../types/backend/order';

const AUTH = { auth: true } as const;

export function listCustomerOrders(page = 1, pageSize = 20): Promise<ApiPaginated<Order>> {
  return apiGetPaginated<Order>('/customers/me/orders', { page, pageSize }, AUTH);
}

/** No crea nada: reconstruye el carrito contra el catálogo actual y devuelve el diff. */
export function repeatCustomerOrder(orderId: string) {
  return apiPost<RepeatOrderResult>(`/customers/me/orders/${orderId}/repeat`, undefined, AUTH);
}

// Detalle/estado/reseñas de un pedido: ver api/orderAccess.ts (sirve a cuentas e invitados).
