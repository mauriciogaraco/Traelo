/** DTOs del módulo Mandado (encargo personalizado) — espeja mandado.dto.ts del backend. */
import type { DeliveryLocation } from './location';

export type PickupClarity = 'EXACT' | 'APPROXIMATE' | 'VAGUE';

export interface MandadoQuoteInput {
  pickupClarity: PickupClarity;
  destination?: DeliveryLocation | null;
  /** Localidad desde la que se pide (City.id): hace falta para cotizar entre localidades / por km. */
  cityId?: string;
  /** Localidad donde se entrega, si no es la de `cityId` (mensajería fija entre localidades). */
  deliveryCityId?: string;
  /** "Otra ubicación": mensajería por km hasta `destination` (obligatoria con esta opción). */
  deliveryElsewhere?: true;
}

export interface MandadoQuote {
  deliveryFee: number;
  platformFee: number;
  total: number;
  /** true = la mensajería es la tarifa FIJA entre localidades. */
  crossCityDelivery?: boolean;
  /** "Otra ubicación": km medidos desde el centro del pueblo de origen y CUP por km. */
  elsewhereDelivery?: { distanceKm: number; ratePerKm: number } | null;
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
  /** Localidad desde la que se pide (obligatoria con 2+ localidades). */
  cityId?: string;
  deliveryCityId?: string;
  deliveryElsewhere?: true;

  collectAmount?: number;
  collectAt?: 'DELIVERY' | 'OTHER';
  collectPlace?: string;

  clientRequestId?: string;
}
