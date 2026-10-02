import { useCallback, useEffect, useRef, useState } from 'react';
import { getOrderDetail, getOrderStatus, type OrderAccess } from '../api/orderAccess';
import { ApiError } from '../api/ApiError';
import { isTrackingActive, orderToStatusPoll } from '../features/orders/tracking';
import type { Order, OrderStatusPoll } from '../types/backend/order';

/** Cada cuánto se consulta el estado mientras el pedido siga activo. */
export const TRACKING_POLL_INTERVAL_MS = 15000;

export type TrackingError = 'offline' | 'error' | null;

type Options = {
  /** Pedido ya en memoria (recién creado o abierto desde una lista): evita un round-trip inicial. */
  initialOrder?: Order | null;
  intervalMs?: number;
};

/**
 * Seguimiento de UN pedido: estado (con polling ligero mientras esté activo) y detalle.
 *  - Un único timer: se programa la siguiente consulta solo cuando termina la anterior (nunca
 *    se solapan) y se cancela al desmontar y al llegar a un estado final (entregado/cancelado).
 *  - `access` null = no hay forma de consultarlo (ni cuenta ni token de invitado).
 *  - Un fallo de red/servidor NO borra lo último que se sabía: queda `error` para avisar y el
 *    polling reintenta solo; `refresh()` (pull-to-refresh) fuerza una consulta ya.
 */
export function useOrderTracking(orderId: string, access: OrderAccess | null, options: Options = {}) {
  const { initialOrder = null, intervalMs = TRACKING_POLL_INTERVAL_MS } = options;

  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [status, setStatus] = useState<OrderStatusPoll | null>(initialOrder ? orderToStatusPoll(initialOrder) : null);
  const [loading, setLoading] = useState(initialOrder === null && access !== null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<TrackingError>(null);
  // Cambia tras CADA intento (éxito o fallo) para que el efecto reprograme el siguiente aunque
  // el estado no haya cambiado.
  const [tick, setTick] = useState(0);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Se compara por contenido (no por identidad) para no recrear callbacks en cada render.
  const accessKey = access === null ? 'none' : access.kind === 'guest' ? `guest:${access.token}` : 'customer';
  const accessRef = useRef(access);
  accessRef.current = access;
  const orderRef = useRef(order);
  orderRef.current = order;

  const fetchOnce = useCallback(async () => {
    const currentAccess = accessRef.current;
    if (!currentAccess) return;
    try {
      const fresh = await getOrderStatus(orderId, currentAccess);
      if (!mountedRef.current) return;
      setStatus(fresh);
      setError(null);
      // El pedido se editó (staff o mensajero) desde la última vez que se supo: el estado
      // liviano solo trae la marca de tiempo a propósito, así que se vuelve a pedir el detalle
      // completo para tener las líneas nuevas y qué cambió (lastEditSummary).
      if (fresh.lastEditedAt && fresh.lastEditedAt !== orderRef.current?.lastEditedAt) {
        try {
          const detail = await getOrderDetail(orderId, currentAccess);
          if (mountedRef.current) setOrder(detail);
        } catch {
          // No bloquea el polling del estado: se reintenta en el próximo tick.
        }
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof ApiError && (err.isNetworkError() || err.isTimeout()) ? 'offline' : 'error');
    } finally {
      if (mountedRef.current) setTick((value) => value + 1);
    }
  }, [orderId]);

  // Primera carga: el detalle (productos, total, dirección) y el estado.
  useEffect(() => {
    const currentAccess = accessRef.current;
    if (!currentAccess) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [detail, fresh] = await Promise.all([
          initialOrder ? Promise.resolve(initialOrder) : getOrderDetail(orderId, currentAccess),
          getOrderStatus(orderId, currentAccess),
        ]);
        if (cancelled) return;
        setOrder(detail);
        setStatus(fresh);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError && (err.isNetworkError() || err.isTimeout()) ? 'offline' : 'error');
      } finally {
        if (!cancelled) {
          setLoading(false);
          setTick((value) => value + 1);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // initialOrder solo importa en el primer montaje.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, accessKey]);

  // Polling: UN timer vivo a la vez, solo mientras el pedido siga activo.
  const currentStatus = status?.status;
  useEffect(() => {
    if (!access || !isTrackingActive(currentStatus)) return;
    const timer = setTimeout(fetchOnce, intervalMs);
    return () => clearTimeout(timer);
  }, [access, currentStatus, tick, fetchOnce, intervalMs]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchOnce();
    } finally {
      if (mountedRef.current) setRefreshing(false);
    }
  }, [fetchOnce]);

  return { order, status, loading, refreshing, error, refresh };
}
