import { deleteDevice, registerDevice } from '../api/devices'
import { ApiError } from '../api/ApiError'
import { env } from '../config/env'
import { readStorage, writeStorage } from '../lib/storage'

const DEVICE_ID_KEY = 'traelo.pushDeviceId'

export type PushSupport = 'unsupported' | 'default' | 'denied' | 'granted'

/** Soporte del navegador + permiso actual, SIN pedir nada (para decidir qué botón mostrar). */
export function getPushSupport(): PushSupport {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission as PushSupport
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64Safe)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

/** true si ya hay una suscripción activa en este navegador (no implica que el backend la conozca). */
export async function isSubscribed(): Promise<boolean> {
  if (getPushSupport() === 'unsupported') return false
  const registration = await navigator.serviceWorker.ready
  return (await registration.pushManager.getSubscription()) !== null
}

/**
 * Pide permiso (si hace falta), crea la suscripción del navegador y la registra en el backend.
 * Nunca lanza: un fallo (permiso denegado, sin VAPID configurada, red) se resuelve como `false` —
 * activar notificaciones es siempre opcional, igual que crear cuenta.
 */
export async function subscribeToPush(): Promise<boolean> {
  if (getPushSupport() === 'unsupported' || !env.vapidPublicKey) return false

  try {
    const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
    if (permission !== 'granted') return false

    const registration = await navigator.serviceWorker.ready
    const existing = await registration.pushManager.getSubscription()
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(env.vapidPublicKey),
      }))

    const json = subscription.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false

    const device = await registerDevice({
      platform: 'WEB',
      pushSubscription: { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } },
    })
    writeStorage(DEVICE_ID_KEY, device.id)
    return true
  } catch {
    return false
  }
}

/** Cancela la suscripción en el navegador y avisa al backend (si falla, no importa: el dispositivo queda inactivo cuando el backend note que ya no responde). */
export async function unsubscribeFromPush(): Promise<void> {
  try {
    if (getPushSupport() !== 'unsupported') {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      await subscription?.unsubscribe()
    }
    const deviceId = readStorage<string | null>(DEVICE_ID_KEY, null)
    if (deviceId) {
      await deleteDevice(deviceId).catch((err) => {
        if (!(err instanceof ApiError)) throw err
      })
      writeStorage(DEVICE_ID_KEY, null)
    }
  } catch {
    // Desactivar notificaciones nunca debe romper la pantalla que lo pidió.
  }
}
