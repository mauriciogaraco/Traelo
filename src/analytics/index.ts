import { apiPost } from '../api/client'
import { env } from '../config/env'
import { useCartStore } from '../store/cartStore'
import { diffCartItems } from './cartDiff'
import { getSessionId, getVisitorId } from './ids'
import { createTracker, type EventType, type TrackData } from './tracker'

export { recordRoute, sourceOfCurrentRoute } from './routeKind'
export type { EventType } from './tracker'

/** Respeta la señal "No rastrear" del navegador además del interruptor de entorno. */
function isEnabled(): boolean {
  if (!env.analyticsEnabled) return false
  if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') return false
  return true
}

const tracker = createTracker({
  send: async (batch, { keepalive }) => {
    await apiPost('/behavior/events', batch, { auth: true, keepalive })
  },
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  now: () => new Date(),
  visitorId: getVisitorId,
  sessionId: getSessionId,
  isEnabled,
  setTimer: (callback, ms) => window.setTimeout(callback, ms),
  clearTimer: (handle) => window.clearTimeout(handle as number),
})

/**
 * Registra un evento de uso (visita, búsqueda, carrito…). Nunca lanza ni espera: la analítica no
 * puede afectar a la pantalla. `flush: true` lo envía ya (p.ej. al iniciar sesión, para unir el
 * historial anónimo a la cuenta sin esperar).
 */
export function track(type: EventType, data?: TrackData, options?: { flush?: boolean }): void {
  try {
    tracker.track(type, data, options)
  } catch {
    // Telemetría: un fallo aquí jamás debe verse.
  }
}

/**
 * Cabeceras que unen un pedido con las visitas del mismo visitante (para saber qué carritos
 * terminaron en compra). Vacías si la analítica está apagada.
 */
export function analyticsHeaders(): Record<string, string> {
  if (!isEnabled()) return {}
  return { 'X-Visitor-Id': getVisitorId(), 'X-Session-Id': getSessionId() }
}

let suppressCartEvents = false

/** Ejecuta un cambio del carrito que NO debe contarse (p.ej. vaciarlo porque el pedido se envió). */
export function withoutCartEvents<T>(change: () => T): T {
  suppressCartEvents = true
  try {
    return change()
  } finally {
    suppressCartEvents = false
  }
}

/** Registra agregar/quitar del carrito comparando el estado antes y después, sin tocar los sitios que lo cambian. */
function startCartTracking(): () => void {
  return useCartStore.subscribe((state, previous) => {
    if (suppressCartEvents || !state.hasHydrated || !previous.hasHydrated) return
    if (state.items === previous.items) return
    for (const change of diffCartItems(previous.items, state.items)) {
      track(change.type, {
        businessId: change.businessId,
        productId: change.productId,
        properties: { quantity: change.quantity, price: change.price },
      })
    }
  })
}

/** Arranque (una vez, en la raíz): recupera lo pendiente, sigue el carrito y envía al cerrar/ocultar la pestaña. */
export function startAnalytics(): () => void {
  tracker.restore()
  const stopCart = startCartTracking()

  const flushNow = () => void tracker.flush({ keepalive: true })
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') flushNow()
  }
  const onOnline = () => void tracker.flush()

  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('pagehide', flushNow)
  window.addEventListener('online', onOnline)

  return () => {
    stopCart()
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('pagehide', flushNow)
    window.removeEventListener('online', onOnline)
  }
}
