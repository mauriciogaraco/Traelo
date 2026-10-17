/** DTOs del módulo Mandado (encargo personalizado) — espeja mandado.dto.ts del backend. */
import type { DeliveryLocation } from './location';

export type PickupClarity = 'EXACT' | 'APPROXIMATE' | 'VAGUE';

export interface MandadoQuoteInput {
  pickupClarity: PickupClarity;
  destination?: DeliveryLocation | null;
}

export interface MandadoQuote {
  deliveryFee: number;
  platformFee: number;
  total: number;
}

export interface CreateMandadoInput {
  customerName?: string;
  customerPhone?: string;

  pickupDescription: string;
  pickupPlace: string;
  pickupClarity: PickupClarity;

  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  deliveryAddressReference?: string;
  destination?: DeliveryLocation | null;

  collectAmount?: number;
  collectAt?: 'DELIVERY' | 'OTHER';
  collectPlace?: string;

  clientRequestId?: string;
}
