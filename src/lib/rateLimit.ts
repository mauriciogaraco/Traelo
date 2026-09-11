import { readStorage, writeStorage, STORAGE_KEYS } from './storage'

/** Tiempo mínimo entre envíos al bot de Telegram (pedido nuevo o reenvío), para no saturarlo. */
export const SEND_COOLDOWN_MS = 60_000

/** Milisegundos que faltan para poder volver a enviar (0 si ya se puede enviar ahora). */
export function msUntilNextSend(now: number = Date.now()): number {
  const last = readStorage<number>(STORAGE_KEYS.lastSendAt, 0)
  return Math.max(0, SEND_COOLDOWN_MS - (now - last))
}

/** Marca el inicio del cooldown: llamar justo antes de intentar el envío. */
export function markSendAttempt(now: number = Date.now()): void {
  writeStorage(STORAGE_KEYS.lastSendAt, now)
}
