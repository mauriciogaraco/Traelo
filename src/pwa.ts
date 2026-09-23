import { registerSW } from 'virtual:pwa-register'

const CHECK_EVERY_MS = 60 * 60 * 1000
const DEFER_POLL_MS = 2000

/** true mientras se está enviando un pedido (checkout o reenvío). */
let orderInFlight = false
export function setOrderInFlight(value: boolean): void {
  orderInFlight = value
}

/** No se recarga si el usuario está armando o enviando un pedido. */
function isBusy(): boolean {
  return orderInFlight || window.location.pathname.startsWith('/checkout')
}

let reloadScheduled = false

/**
 * Se llama cuando el service worker nuevo ya tomó el control (con
 * registerType: 'autoUpdate' el plugin llama a onNeedReload en vez de recargar
 * él mismo; en ese modo onNeedRefresh nunca se dispara). Recarga UNA sola vez,
 * y si el usuario está en el checkout espera a que termine.
 */
function reloadWhenIdle(): void {
  if (reloadScheduled) return
  reloadScheduled = true
  const tryReload = () => {
    if (isBusy()) return false
    window.location.reload()
    return true
  }
  if (tryReload()) return
  const id = window.setInterval(() => {
    if (tryReload()) window.clearInterval(id)
  }, DEFER_POLL_MS)
}

export function initPWA(): void {
  // Confirma al service worker que esta versión sabe recargarse sola; las
  // pestañas que no confirman se consideran viejas y el SW las recarga (ver public/sw-force-reload.js).
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'traelo-sw-activated') {
        ;(event.source as ServiceWorker | null)?.postMessage({ type: 'traelo-ack' })
      }
    })
  }
  registerSW({
    immediate: true,
    onNeedReload: reloadWhenIdle,
    onRegisteredSW(_url, registration) {
      if (!registration) return
      const check = () => {
        registration.update().catch(() => {})
      }
      // Al abrir, cada 60 minutos y cada vez que la pestaña vuelve a estar visible.
      check()
      window.setInterval(check, CHECK_EVERY_MS)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
    },
  })
}
