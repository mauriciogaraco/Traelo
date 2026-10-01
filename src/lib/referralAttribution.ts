/**
 * Atribución de referidos (checklist §2/§10): un invitado que entra por /r/:codigo todavía no
 * tiene cuenta, así que el código se guarda acá hasta que se registre (o para siempre, si nunca
 * lo hace). localStorage y no memoria de React: sobrevive a un refresh y a navegar por la web
 * (mismo criterio que guestStore/notificationsStore). Si localStorage no está disponible (modo
 * privado estricto) cae a memoria, igual que storage/authStorage.ts, para que al menos dure
 * mientras la pestaña esté abierta. "Primer código gana": si ya hay uno guardado, uno nuevo no lo
 * reemplaza — la validación y la regla final las tiene el backend (Referral.referredId es
 * único), esto es solo para no perder el primero por las dudas.
 */
const STORAGE_KEY = 'traelo.referral.pending'
const CODE_FORMAT = /^[A-Za-z0-9]{1,32}$/

let memory: string | null = null

function backing(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function capturePendingReferralCode(rawCode: string): void {
  const code = rawCode.trim().toUpperCase()
  if (!CODE_FORMAT.test(code)) return
  if (getPendingReferralCode()) return // ya hay uno: no se reemplaza
  memory = code
  try {
    backing()?.setItem(STORAGE_KEY, code)
  } catch {
    /* solo memoria */
  }
}

export function getPendingReferralCode(): string | null {
  try {
    const stored = backing()?.getItem(STORAGE_KEY);
    if (stored) return stored
  } catch {
    /* cae a memoria */
  }
  return memory
}

/** Tras usarlo (registro con o sin éxito de atribución, o atribución directa ya autenticado). */
export function clearPendingReferralCode(): void {
  memory = null
  try {
    backing()?.removeItem(STORAGE_KEY)
  } catch {
    /* nada que borrar */
  }
}
