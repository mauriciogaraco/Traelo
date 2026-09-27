import { useCallback, useEffect, useRef, useState } from 'react';
import { getOrderTracking, type OrderAccess } from '../api/orderAccess';
import { ApiError } from '../api/ApiError';
import { COURIER_POLL_INTERVAL_MS, COURIER_POLL_MAX_BACKOFF_MS, type TrackingError } from '../features/tracking';
import type { OrderTracking } from '../types/backend/tracking';
import { useScreenActivity } from './useScreenActivity';

type Options = {
  /** Solo se consulta mientras sea true (el pedido está ASSIGNED). */
  enabled: boolean;
  intervalMs?: number;
};

/** Espera antes del próximo intento: el intervalo normal, duplicado por cada fallo seguido hasta un tope. */
export function nextPollDelay(failures: number, intervalMs: number): number {
  return Math.min(intervalMs * 2 ** failures, COURIER_POLL_MAX_BACKOFF_MS);
}

/**
 * Ubicación del mensajero de UN pedido, por polling controlado (sin WebSockets).
 *  - Un solo timer vivo: el siguiente intento se programa cuando termina el anterior, así nunca hay
 *    dos peticiones a la vez ni timers duplicados.
 *  - Solo consulta si `enabled` y la pantalla está visible (enfocada, app en primer plano) y hay
 *    conexión. Al dejar de cumplirse se cancela el timer Y la petición en vuelo; al volver a
 *    cumplirse se reanuda enseguida (respetando el intervalo desde el último intento).
 *  - Se detiene solo cuando el backend informa que el seguimiento terminó (pedido entregado/cancelado).
 *  - Un fallo NO borra la última respuesta buena: queda `error` y se reintenta con backoff.
 */
export function useCourierTracking(orderId: string, access: OrderAccess | null, { enabled, intervalMs = COURIER_POLL_INTERVAL_MS }: Options) {
  const { visible, online } = useScreenActivity();

  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  /** Hora local de la última respuesta buena: la frescura se calcula desde ahí (ver freshness.ts). */
  const [receivedAt, setReceivedAt] = useState<number | null>(null);
  const [error, setError] = useState<TrackingError>(null);
  const [loading, setLoading] = useState(enabled && access !== null);
  // Cambia tras CADA intento (éxito o fallo) para que el efecto programe el siguiente.
  const [tick, setTick] = useState(0);

  const mountedRef = useRef(true);
  const inFlightRef = useRef<AbortController | null>(null);
  const failuresRef = useRef(0);
  const lastAttemptRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      inFlightRef.current?.abort();
    };
  }, []);

  const accessKey = access === null ? 'none' : access.kind === 'guest' ? `guest:${access.token}` : 'customer';
  const accessRef = useRef(access);
  accessRef.current = access;

  const ended = tracking !== null && !tracking.trackingActive;
  const active = enabled && visible && online && access !== null && !ended;

  const fetchOnce = useCallback(async () => {
    const currentAccess = accessRef.current;
    if (!currentAccess || inFlightRef.current) return; // nunca dos peticiones a la vez
    const controller = new AbortController();
    inFlightRef.current = controller;
    lastAttemptRef.current = Date.now();
    try {
      const fresh = await getOrderTracking(orderId, currentAccess, controller.signal);
      if (controller.signal.aborted || !mountedRef.current) return;
      failuresRef.current = 0;
      setTracking(fresh);
      setReceivedAt(Date.now());
      setError(null);
    } catch (err) {
      if (controller.signal.aborted || !mountedRef.current) return;
      failuresRef.current += 1;
      setError(err instanceof ApiError && (err.isNetworkError() || err.isTimeout()) ? 'offline' : 'error');
    } finally {
      if (inFlightRef.current === controller) inFlightRef.current = null;
      if (!controller.signal.aborted && mountedRef.current) {
        setLoading(false);
        setTick((value) => value + 1);
      }
    }
  }, [orderId]);

  // Otro pedido u otra credencial: se empieza de cero.
  useEffect(() => {
    inFlightRef.current?.abort();
    inFlightRef.current = null;
    failuresRef.current = 0;
    lastAttemptRef.current = 0;
    setTracking(null);
    setReceivedAt(null);
    setError(null);
    setLoading(enabled && accessRef.current !== null);
    // enabled se excluye a propósito: reiniciar por eso borraría la última ubicación al pausar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, accessKey]);

  // Polling: UN timer a la vez, solo mientras esté activo.
  useEffect(() => {
    if (!active) {
      // Salir de la pantalla, pasar a segundo plano, perder red o terminar el pedido: la petición
      // pendiente ya no sirve. Una cancelada no cuenta como intento: al volver se consulta enseguida.
      if (inFlightRef.current) {
        inFlightRef.current.abort();
        inFlightRef.current = null;
        lastAttemptRef.current = 0;
      }
      return;
    }
    const wait = failuresRef.current === 0 ? intervalMs : nextPollDelay(failuresRef.current, intervalMs);
    const elapsed = Date.now() - lastAttemptRef.current;
    const timer = setTimeout(fetchOnce, Math.max(0, wait - elapsed));
    return () => clearTimeout(timer);
  }, [active, tick, fetchOnce, intervalMs]);

  // Sin señal el aviso sale ya, sin esperar a que falle la siguiente petición.
  useEffect(() => {
    if (enabled && !online) setError('offline');
  }, [enabled, online]);

  return { tracking, receivedAt, error, loading };
}
