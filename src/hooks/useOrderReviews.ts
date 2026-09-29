import { useCallback, useEffect, useState } from 'react';
import { getOrderReviews, type OrderAccess } from '../api/orderAccess';
import { ApiError } from '../api/ApiError';
import { submitOrderReviews, type ReviewSubmission, type SubmitReviewsOutcome } from '../services/reviewsService';
import type { OrderReviewState } from '../types/backend/review';

/**
 * Estado de las valoraciones de un pedido. El pending/submitted lo decide SIEMPRE el backend:
 * la app no lo infiere. Solo se consulta cuando el pedido ya está entregado (`enabled`); antes
 * no hay nada que valorar y se evita una petición inútil.
 */
export function useOrderReviews(orderId: string, access: OrderAccess | null, enabled: boolean) {
  const [state, setState] = useState<OrderReviewState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<'offline' | 'error' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const accessKey = access === null ? 'none' : access.kind === 'guest' ? `guest:${access.token}` : 'customer';

  const load = useCallback(async () => {
    if (!access || !enabled) return;
    setLoading(true);
    try {
      setState(await getOrderReviews(orderId, access));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError && (err.isNetworkError() || err.isTimeout()) ? 'offline' : 'error');
    } finally {
      setLoading(false);
    }
    // accessKey resume a `access` por contenido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, accessKey, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = useCallback(
    async (submission: ReviewSubmission): Promise<SubmitReviewsOutcome> => {
      if (!access) {
        return { ok: false, code: 'NO_ACCESS', message: 'No pudimos verificar tu pedido.', retryable: false };
      }
      setSubmitting(true);
      const outcome = await submitOrderReviews(orderId, access, submission);
      setSubmitting(false);
      if (outcome.ok) setState(outcome.state);
      return outcome;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orderId, accessKey],
  );

  return { state, loading, error, submitting, reload: load, submit };
}
