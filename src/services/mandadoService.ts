import { createMandado as apiCreateMandado, quoteMandado as apiQuoteMandado } from '../api/mandado';
import { ApiError } from '../api/ApiError';
import { useGuestOrdersStore } from '../store/guestStore';
import { notifyOrderToTelegram } from './orderNotifyService';
import type { CheckoutOrder, Order } from '../types/backend/order';
import type { CreateMandadoInput, MandadoQuote, MandadoQuoteInput } from '../types/backend/mandado';

/*
 * Mandado (encargo personalizado) — mismo patrón que checkoutService: el servidor es la
 * autoridad del precio, aquí solo se arma la solicitud y se traducen los errores.
 */

export type MandadoQuoteResult = { ok: true; quote: MandadoQuote } | { ok: false; message: string };

export async function requestMandadoQuote(input: MandadoQuoteInput): Promise<MandadoQuoteResult> {
  try {
    return { ok: true, quote: await apiQuoteMandado(input) };
  } catch {
    return { ok: false, message: 'No pudimos calcular el precio. Revisa tu conexión.' };
  }
}

export type MandadoResult =
  | { ok: true; order: Order; isGuest: boolean }
  | { ok: false; code: string; message: string };

export async function submitMandado(input: CreateMandadoInput): Promise<MandadoResult> {
  try {
    const { guestAccessToken, ...order } = (await apiCreateMandado(input)) as CheckoutOrder;
    const isGuest = guestAccessToken !== undefined;
    if (guestAccessToken) {
      useGuestOrdersStore.getState().add({
        orderId: order.id,
        orderNumber: order.orderNumber,
        token: guestAccessToken,
        createdAt: order.createdAt,
      });
      void notifyOrderToTelegram(order.id, guestAccessToken);
    }
    return { ok: true, order, isGuest };
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, code: err.code, message: err.message };
    return { ok: false, code: 'UNKNOWN_ERROR', message: 'Ocurrió un error inesperado.' };
  }
}
