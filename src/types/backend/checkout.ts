/**
 * Request DTOs para crear un pedido — ver docs/BACKEND_API.md §3.
 * Nunca agregar unitPrice/deliveryFee/total/platformFee aquí: el backend
 * es la única fuente de verdad para dinero (checklist §24).
 */

import type { DeliveryLocation } from './location';
import type { RedemptionRequest } from './rewards';

export type CartItemInput = {
  productId: string;
  quantity: number;
  /** Precio que la app tiene cacheado — solo para que el backend detecte carritos desactualizados. */
  expectedPrice?: number;
  /** Nombre de la opción de empaque elegida. El costo lo resuelve siempre el backend. */
  packagingName?: string;
  /** Tipo/sabor elegido y agrego elegido (solo el nombre; el precio lo resuelve el backend). */
  optionName?: string;
  addonName?: string;
};

export type CartBusinessInput = {
  businessId: string;
  items: CartItemInput[];
};

/**
 * Body de POST /checkout. NO lleva customerId: la identidad sale SIEMPRE del token (Bearer) que
 * el cliente HTTP adjunta si hay sesión. Sin sesión (invitado) hacen falta nombre, teléfono y dirección.
 */
export type CheckoutOrderInput = {
  /** "Lo antes posible" u "Hoy 7:30 pm": informativo para el equipo; no cambia la tarifa ni la validación. */
  scheduledFor?: string;
  /** Solo web: canal del pedido (el backend lo guarda como source WEB). Ausente = APP. */
  channel?: 'APP' | 'WEB';
  customerName?: string;
  customerPhone?: string;
  addressId?: string;
  address?: string;
  addressReference?: string;
  /**
   * Pin OPCIONAL de la entrega. Ausente: con addressId el backend usa el de esa dirección (si lo
   * tiene); null: sin ubicación en este pedido. Nunca es requisito para pedir.
   */
  location?: DeliveryLocation | null;
  clientRequestId?: string;
  businesses: CartBusinessInput[];
  /** Canje de una recompensa (solo con cuenta): solo el id; el servidor resuelve costo, precio y saldo. */
  redemption?: RedemptionRequest;
};

export type CreateAppOrderInput = {
  addressId?: string;
  address?: string;
  addressReference?: string;
  location?: DeliveryLocation | null;
  clientRequestId?: string;
  businesses: CartBusinessInput[];
};
