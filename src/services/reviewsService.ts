import {
  getOrderReviews,
  submitBusinessReviews,
  submitDelivererReview,
  submitOrderComment,
  type OrderAccess,
} from '../api/orderAccess';
import { ApiError } from '../api/ApiError';
import type { BusinessRatingInput, OrderReviewState } from '../types/backend/review';

export type ReviewSubmission = {
  /** Valoración del mensajero (1.0–5.0), si la persona quiso valorarlo. */
  deliverer?: number;
  /** Valoraciones de negocios, solo de los que la persona quiso valorar. */
  businesses: BusinessRatingInput[];
  /** Opinión libre y opcional: se reenvía a Telegram, nunca se guarda junto a las estrellas. */
  comment?: string;
};

export type SubmitReviewsOutcome =
  | { ok: true; state: OrderReviewState }
  | {
      ok: false;
      code: string;
      message: string;
      /** true = fallo de red/servidor: se puede reintentar tal cual, sin perder lo elegido. */
      retryable: boolean;
    };

function isRetryable(error: ApiError): boolean {
  return error.code === 'NETWORK_ERROR' || error.code === 'REQUEST_TIMEOUT' || error.code === 'SERVER_ERROR';
}

/**
 * Un duplicado (409 REVIEW_ALREADY_SUBMITTED) NO es un error para la persona: significa que esa
 * valoración ya quedó guardada (p.ej. un reintento tras perder la respuesta). Se relee el
 * estado real y se sigue.
 */
async function tolerateDuplicate(
  orderId: string,
  access: OrderAccess,
  send: () => Promise<OrderReviewState>,
): Promise<OrderReviewState> {
  try {
    return await send();
  } catch (error) {
    if (error instanceof ApiError && error.code === 'REVIEW_ALREADY_SUBMITTED') {
      return getOrderReviews(orderId, access);
    }
    throw error;
  }
}

/**
 * Envía las valoraciones elegidas. Siempre parte del estado REAL del servidor y manda solo lo
 * que sigue pendiente: si un envío anterior falló a medias (el mensajero se guardó pero los
 * negocios no), el reintento no repite lo ya guardado. El backend deduce el mensajero del
 * pedido: nunca se le manda un id.
 */
export async function submitOrderReviews(
  orderId: string,
  access: OrderAccess,
  submission: ReviewSubmission,
): Promise<SubmitReviewsOutcome> {
  try {
    let state = await getOrderReviews(orderId, access);

    if (!state.canReview) {
      return {
        ok: false,
        code: 'ORDER_NOT_COMPLETED',
        message: 'Podrás valorar cuando tu pedido esté entregado.',
        retryable: false,
      };
    }

    if (submission.deliverer !== undefined && state.deliverer?.status === 'pending') {
      const rating = submission.deliverer;
      state = await tolerateDuplicate(orderId, access, () => submitDelivererReview(orderId, rating, access));
    }

    const pendingBusinessIds = new Set(
      state.businesses.filter((business) => business.status === 'pending').map((business) => business.businessId),
    );
    const toSend = submission.businesses.filter((review) => pendingBusinessIds.has(review.businessId));
    if (toSend.length > 0) {
      state = await tolerateDuplicate(orderId, access, () => submitBusinessReviews(orderId, toSend, access));
    }

    const comment = submission.comment?.trim();
    if (comment) {
      // Mejor esfuerzo: es un canal aparte (va a Telegram, no se guarda) y nunca debe hacer
      // fallar el envío de las valoraciones si algo sale mal.
      await submitOrderComment(orderId, comment, access).catch(() => undefined);
    }

    return { ok: true, state };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, code: error.code, message: error.message, retryable: isRetryable(error) };
    }
    return { ok: false, code: 'UNKNOWN_ERROR', message: 'No pudimos enviar tu valoración.', retryable: true };
  }
}
