/**
 * Identificadores anónimos de la analítica. No contienen datos personales: son UUID aleatorios.
 *  - visitorId: uno por navegador (localStorage), para reconocer a un visitante que vuelve y, al
 *    iniciar sesión, unir su historial anónimo a su cuenta. CADUCA a los 180 días y se vuelve a
 *    generar: no es una identidad permanente.
 *  - sessionId: uno por pestaña/visita (sessionStorage).
 *  - reset(): genera identidades nuevas. Se usa al cerrar sesión (la siguiente persona que use este
 *    dispositivo no hereda el historial anónimo de la anterior) y al desactivar el registro.
 *
 * Es una fábrica con dependencias inyectadas para poder probarla sin navegador.
 */

export const VISITOR_KEY = 'traelo_visitor_id'
export const SESSION_KEY = 'traelo_session_id'
export const VISITOR_TTL_MS = 180 * 24 * 60 * 60 * 1000

export type KeyValueStore = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

export type IdentityDeps = {
  local: KeyValueStore | null
  session: KeyValueStore | null
  now: () => number
  uuid: () => string
}

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

export function createIdentity(deps: IdentityDeps) {
  // Se leen del almacenamiento una sola vez y se guardan en memoria: así, aunque el almacenamiento
  // esté bloqueado, el id es estable durante toda la visita.
  let visitor: string | null = null
  let session: string | null = null

  function readVisitor(): string {
    try {
      const raw = deps.local?.getItem(VISITOR_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as { id?: unknown; createdAt?: unknown }
        if (typeof saved.id === 'string' && typeof saved.createdAt === 'number' && deps.now() - saved.createdAt < VISITOR_TTL_MS) {
          return saved.id
        }
      }
    } catch {
      // Valor ilegible o de otra versión: se genera uno nuevo.
    }
    const id = deps.uuid()
    try {
      deps.local?.setItem(VISITOR_KEY, JSON.stringify({ id, createdAt: deps.now() }))
    } catch {
      // Almacenamiento bloqueado: queda solo en memoria para esta visita.
    }
    return id
  }

  function readSession(): string {
    try {
      const existing = deps.session?.getItem(SESSION_KEY)
      if (existing) return existing
    } catch {
      // Se genera uno nuevo abajo.
    }
    const id = deps.uuid()
    try {
      deps.session?.setItem(SESSION_KEY, id)
    } catch {
      // Solo en memoria.
    }
    return id
  }

  return {
    visitorId: () => (visitor ??= readVisitor()),
    sessionId: () => (session ??= readSession()),
    /** Olvida las identidades actuales; las siguientes llamadas generan otras nuevas. */
    reset() {
      visitor = null
      session = null
      try {
        deps.local?.removeItem(VISITOR_KEY)
        deps.session?.removeItem(SESSION_KEY)
      } catch {
        // Sin almacenamiento no hay nada que borrar.
      }
    },
  }
}

function safeStore(read: () => Storage): KeyValueStore | null {
  try {
    return read()
  } catch {
    return null
  }
}

export const identity = createIdentity({
  local: typeof localStorage === 'undefined' ? null : safeStore(() => localStorage),
  session: typeof sessionStorage === 'undefined' ? null : safeStore(() => sessionStorage),
  now: () => Date.now(),
  uuid: randomUuid,
})

export const getVisitorId = identity.visitorId
export const getSessionId = identity.sessionId
export const resetIdentity = identity.reset
