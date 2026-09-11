/** Pequeñas utilidades tipadas para leer/escribir en localStorage de forma segura. */

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* almacenamiento lleno o no disponible: ignoramos en silencio */
  }
}

export const STORAGE_KEYS = {
  cart: 'traelo_cart',
  orders: 'traelo_orders',
  address: 'traelo_address',
  lastSendAt: 'traelo_last_send_at',
} as const
