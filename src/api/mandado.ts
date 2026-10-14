import { apiPost } from './client';
import type { CreateMandadoInput, MandadoQuote, MandadoQuoteInput } from '../types/backend/mandado';
import type { CheckoutOrder } from '../types/backend/order';

/**
 * Pedir un mandado NO exige cuenta (igual que /checkout): con sesión (auth: true adjunta el
 * Bearer si existe) el pedido se vincula a la cuenta; sin sesión es de invitado y la respuesta
 * trae `guestAccessToken` para seguirlo.
 */
export function createMandado(input: CreateMandadoInput) {
  return apiPost<CheckoutOrder>('/mandados', input, { auth: true });
}

/** Cotización de solo lectura: no crea nada. */
export function quoteMandado(input: MandadoQuoteInput) {
  return apiPost<MandadoQuote>('/mandados/quote', input, { auth: true });
}
