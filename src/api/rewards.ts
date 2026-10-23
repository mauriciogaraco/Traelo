import { apiGet, apiPost } from './client';
import type { CartBusinessInput } from '../types/backend/checkout';
import type { DeliveryLocation } from '../types/backend/location';
import type { OrderQuote, RedemptionRequest, RewardsSnapshot } from '../types/backend/rewards';

/** Recompensas visibles. Con sesión trae además el saldo y si alcanza/cuánto falta (lo decide el servidor). */
export function getRewards() {
  return apiGet<RewardsSnapshot>('/rewards', undefined, { auth: true });
}

/**
 * Cotización de solo lectura: el servidor calcula productos, mensajería, Servicio Tráelo, canje y
 * total con las mismas reglas que el pedido. No crea ni descuenta nada.
 */
export function quoteCheckout(input: {
  businesses: CartBusinessInput[];
  redemption?: RedemptionRequest;
  pointsExpectedBalance?: number;
  promoCode?: string;
  /** Localidad donde se entrega (City.id): con otra que la de los negocios, la mensajería es la fija entre localidades. */
  deliveryCityId?: string;
  /** "Otra ubicación": mensajería por km hasta `location` (el punto del cliente). */
  deliveryElsewhere?: true;
  location?: DeliveryLocation;
}) {
  return apiPost<OrderQuote>('/checkout/quote', input, { auth: true });
}
