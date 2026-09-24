import { apiGet, apiPost } from './client';
import type { CartBusinessInput } from '../types/backend/checkout';
import type { OrderQuote, RedemptionRequest, RewardsSnapshot } from '../types/backend/rewards';

/** Recompensas visibles. Con sesión trae además el saldo y si alcanza/cuánto falta (lo decide el servidor). */
export function getRewards() {
  return apiGet<RewardsSnapshot>('/rewards', undefined, { auth: true });
}

/**
 * Cotización de solo lectura: el servidor calcula productos, mensajería, Servicio Tráelo, canje y
 * total con las mismas reglas que el pedido. No crea ni descuenta nada.
 */
export function quoteCheckout(input: { businesses: CartBusinessInput[]; redemption?: RedemptionRequest }) {
  return apiPost<OrderQuote>('/checkout/quote', input, { auth: true });
}
