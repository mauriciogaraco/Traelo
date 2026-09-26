import type { CartItem } from '../../store/cartStore';
import type { CartBusinessInput, CheckoutOrderInput } from '../../types/backend/checkout';
import type { DeliveryLocation } from '../../types/backend/location';
import type { RedemptionRequest } from '../../types/backend/rewards';

export type BuildCheckoutInputParams = {
  items: CartItem[];
  clientRequestId: string;
  /** Hora de entrega elegida ("Lo antes posible" u "Hoy 7:30 pm"). */
  scheduledFor?: string;
  /** addressId (dirección guardada, solo con cuenta) o address (texto libre) — nunca ambos. */
  addressId?: string;
  address?: string;
  addressReference?: string;
  /**
   * Pin OPCIONAL de la entrega. undefined = no se manda nada (con addressId el backend usa el de la
   * dirección guardada); null = sin ubicación en este pedido; objeto = el pin de este pedido.
   */
  location?: DeliveryLocation | null;
  /**
   * Solo para invitados (sin cuenta): nombre y teléfono que escribió en el checkout. Con cuenta el
   * backend usa los de la cuenta. La identidad (customerId) NUNCA se manda: sale del token.
   */
  customerName?: string;
  customerPhone?: string;
  /**
   * Canje de una recompensa (solo con cuenta). SOLO el id (+ el saldo que se vio en pantalla, para
   * detectar datos viejos): nunca costo, descuento ni totales — el servidor los resuelve.
   */
  redemption?: RedemptionRequest;
};

/** Agrupa los productos del carrito por negocio, con el formato del backend (sin precios definitivos). */
export function buildBusinessesInput(items: CartItem[]): CartBusinessInput[] {
  const byBusiness = new Map<string, CartItem[]>();
  for (const item of items) {
    const list = byBusiness.get(item.businessId) ?? [];
    list.push(item);
    byBusiness.set(item.businessId, list);
  }

  return Array.from(byBusiness.entries()).map(([businessId, items]) => ({
    businessId,
    items: items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      expectedPrice: item.priceSnapshot ?? undefined,
      packagingName: item.packagingName ?? undefined,
      optionName: item.optionName ?? undefined,
      addonName: item.addonName ?? undefined,
    })),
  }));
}

/**
 * Arma el body real de POST /checkout — checklist §24: solo lo necesario, nunca precios,
 * comisiones ni totales (el backend los calcula siempre).
 */
export function buildCheckoutInput(params: BuildCheckoutInputParams): CheckoutOrderInput {
  return {
    clientRequestId: params.clientRequestId,
    // Web: los pedidos se guardan como source WEB (en la app móvil no se manda y quedan como APP).
    channel: 'WEB',
    scheduledFor: params.scheduledFor,
    addressId: params.addressId,
    address: params.addressId ? undefined : params.address,
    addressReference: params.addressReference,
    // `undefined` no viaja en el JSON; `null` sí (es una decisión explícita: "sin ubicación").
    location: params.location,
    customerName: params.customerName,
    customerPhone: params.customerPhone,
    businesses: buildBusinessesInput(params.items),
    // Solo el id de la recompensa (y el saldo visto): el servidor resuelve costo, descuento y total.
    redemption: params.redemption,
  };
}
