// Se importa desde el service worker (workbox.importScripts en vite.config.ts).
//
// Problema que resuelve: una pestaña abierta con una versión vieja de la app
// sigue ejecutando el JS viejo aunque el service worker nuevo ya esté activo
// (las versiones anteriores al 16 de agosto ni siquiera recargan solas). Si
// ese JS viejo hablaba directo con Telegram con el token anterior, el cliente
// pierde el pedido.
//
// Al activarse una actualización, el service worker avisa a todas las
// pestañas. Las versiones nuevas responden con un "ack" (ver src/pwa.ts) y se
// recargan por su cuenta cuando el usuario no está en el checkout. Las que no
// responden son versiones viejas: se les fuerza la recarga.

let isUpdate = false
const acked = new Set()

self.addEventListener('install', () => {
  // Primera instalación (visita nueva) => no hay nada viejo que recargar.
  isUpdate = !!self.registration.active
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'traelo-ack' && event.source) {
    acked.add(event.source.id)
  }
})

self.addEventListener('activate', (event) => {
  if (!isUpdate) return
  event.waitUntil(
    (async () => {
      await self.clients.claim()
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      windows.forEach((client) => client.postMessage({ type: 'traelo-sw-activated' }))
      await new Promise((resolve) => setTimeout(resolve, 2500))
      for (const client of windows) {
        if (acked.has(client.id)) continue
        try {
          await client.navigate(client.url)
        } catch {
          // El navegador no dejó navegar esa pestaña: no hay nada más que hacer.
        }
      }
    })()
  )
})
