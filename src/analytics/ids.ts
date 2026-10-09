/**
 * Identificadores anónimos de la analítica. No contienen datos personales: son UUID aleatorios.
 *  - visitorId: uno por navegador (localStorage), para reconocer a un visitante que vuelve y, al
 *    iniciar sesión, unir su historial anónimo a su cuenta.
 *  - sessionId: uno por pestaña/visita (sessionStorage).
 */

const VISITOR_KEY = 'traelo_visitor_id'
const SESSION_KEY = 'traelo_session_id'

export function randomUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  // Navegadores viejos sin randomUUID: v4 con getRandomValues.
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function readOrCreate(storage: Storage | undefined, key: string): string {
  try {
    const existing = storage?.getItem(key)
    if (existing) return existing
    const id = randomUuid()
    storage?.setItem(key, id)
    return id
  } catch {
    // Almacenamiento bloqueado: un id solo para esta carga de la página.
    return randomUuid()
  }
}

// Se leen del almacenamiento una sola vez por carga y se guardan en memoria: así, aunque el
// almacenamiento esté bloqueado, el id es estable durante toda la visita.
let visitorId: string | null = null
let sessionId: string | null = null

export function getVisitorId(): string {
  visitorId ??= readOrCreate(typeof localStorage === 'undefined' ? undefined : localStorage, VISITOR_KEY)
  return visitorId
}

export function getSessionId(): string {
  sessionId ??= readOrCreate(typeof sessionStorage === 'undefined' ? undefined : sessionStorage, SESSION_KEY)
  return sessionId
}
