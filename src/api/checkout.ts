import { apiPost } from './client';
import type { CheckoutOrderInput } from '../types/backend/checkout';
import type { CheckoutOrder } from '../types/backend/order';

/**
 * Comprar NO exige cuenta. Con sesión (auth: true adjunta el Bearer si existe) el pedido se
 * vincula a la cuenta; sin sesión es de invitado y la respuesta trae `guestAccessToken` para
 * seguirlo. Puede lanzar ApiError con code CART_CHANGED — ver docs/BACKEND_API.md §3.
 */
export function createCheckoutOrder(input: CheckoutOrderInput) {
  return apiPost<CheckoutOrder>('/checkout', input, { auth: true });
}
