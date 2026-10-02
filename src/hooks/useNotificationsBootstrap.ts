import { useEffect } from 'react'
import { useNotificationsStore } from '../store/notificationsStore'

type PushReceivedMessage = {
  type: 'traelo-push-received'
  id: string
  title: string
  body: string
  data: Record<string, unknown>
  receivedAt: number
}

function isPushReceivedMessage(data: unknown): data is PushReceivedMessage {
  return typeof data === 'object' && data !== null && (data as { type?: unknown }).type === 'traelo-push-received'
}

/**
 * Alimenta el buzón local con lo que recibe este navegador (`useNotificationsBootstrap` de
 * mobile, adaptado): el service worker (`public/sw-push.js`) avisa a la pestaña abierta cada vez
 * que llega un Web Push. Llamar una sola vez, en la raíz de la app.
 */
export function useNotificationsBootstrap() {
  const add = useNotificationsStore((state) => state.add)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const onMessage = (event: MessageEvent) => {
      if (!isPushReceivedMessage(event.data)) return
      const { id, title, body, data, receivedAt } = event.data
      add({ id, title: title || 'Tráelo', body: body || '', data, receivedAt })
    }
    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [add])
}
