import { readStorage, writeStorage, STORAGE_KEYS } from './storage'

/** Espera entre pedidos: solo un freno visual en este dispositivo. El servidor NO limita por IP (en Cuba muchos comparten IP). */
export const ORDER_COOLDOWN_MS = 3 * 60_000

/** Milisegundos que faltan para poder enviar otro pedido (0 si ya se puede). */
export function orderCooldownRemaining(now: number = Date.now()): number {
  const last = readStorage<number>(STORAGE_KEYS.lastSendAt, 0)
  return Math.min(ORDER_COOLDOWN_MS, Math.max(0, ORDER_COOLDOWN_MS - (now - last)))
}

/** Inicia el cooldown local: llamar cuando un pedido se envió con éxito. */
export function markOrderSent(now: number = Date.now()): void {
  writeStorage(STORAGE_KEYS.lastSendAt, now)
}

/** "Espera 2:41 min antes de enviar otro pedido." */
export function cooldownMessage(ms: number): string {
  const total = Math.max(1, Math.ceil(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = String(total % 60).padStart(2, '0')
  return `Espera ${minutes}:${seconds} min antes de enviar otro pedido.`
}

/** Aviso cuando el envío falla por otra causa (red, servidor, Telegram). */
export const SEND_FAILED_MESSAGE =
  'No se pudo enviar el pedido. Inténtalo de nuevo o escríbenos por WhatsApp.'

/** Mensaje de fallo con la causa concreta (para que el cliente la pueda mandar por WhatsApp). */
export function sendFailedMessage(reason?: string): string {
  return reason ? `${SEND_FAILED_MESSAGE} Detalle: ${reason}` : SEND_FAILED_MESSAGE
}
