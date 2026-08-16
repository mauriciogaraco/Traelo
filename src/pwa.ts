import { registerSW } from 'virtual:pwa-register'

/**
 * Registro manual del service worker. Con registerType: 'autoUpdate', esto
 * detecta cuando hay una versión nueva desplegada y recarga la página sola
 * en cuanto el nuevo SW toma control — así las pestañas que quedan abiertas
 * mucho tiempo (ej. tomando pedidos) no se quedan con código viejo.
 */
export function initPWA() {
  const updateSW = registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      // Revisa si hay una versión nueva cada hora, por si la pestaña queda
      // abierta mucho tiempo sin recargar por sí misma.
      if (!registration) return
      setInterval(() => {
        registration.update().catch(() => {})
      }, 60 * 60 * 1000)
    },
  })
  return updateSW
}
