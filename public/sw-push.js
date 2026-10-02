// Se importa desde el service worker (workbox.importScripts en vite.config.ts).
//
// Web Push: recibe el aviso, lo muestra con el sistema (`showNotification`) y se lo pasa también
// a cualquier pestaña abierta (buzón local — ver src/store/notificationsStore.ts) para que se vea
// sin tener que reabrir la app, igual que en mobile con los pushes de Expo.

self.addEventListener('push', (event) => {
  let payload = { title: 'Tráelo', body: '' }
  try {
    if (event.data) payload = event.data.json()
  } catch {
    // Payload no-JSON: se muestra el aviso genérico en vez de fallar en silencio.
  }
  const { title, body, data } = payload

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(title || 'Tráelo', {
        body: body || '',
        icon: '/traelo_192x192.png',
        badge: '/traelo_192x192.png',
        data: data || {},
        tag: (data && data.orderId) || undefined,
      })
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      clients.forEach((client) =>
        client.postMessage({ type: 'traelo-push-received', id, title, body, data: data || {}, receivedAt: Date.now() })
      )
    })()
  )
})

// A qué pedido lleva un push: todo tipo de aviso de pedido ('order' = cambió de etapa,
// 'order_vale_updated' = se editó) trae orderId y lleva al mismo sitio — validado, `data` viaja
// desde fuera de la app.
const ORDER_NOTIFICATION_TYPES = ['order', 'order_vale_updated']
function orderIdFromData(data) {
  if (!data || typeof data !== 'object' || !ORDER_NOTIFICATION_TYPES.includes(data.type) || typeof data.orderId !== 'string') {
    return null
  }
  const id = data.orderId.trim()
  return /^[A-Za-z0-9_-]{1,64}$/.test(id) ? id : null
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const orderId = orderIdFromData(event.notification.data)
  const url = orderId ? `/pedido/${orderId}` : '/'

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of clients) {
        if ('focus' in client) {
          await client.focus()
          if ('navigate' in client) await client.navigate(url).catch(() => {})
          return
        }
      }
      await self.clients.openWindow(url)
    })()
  )
})
