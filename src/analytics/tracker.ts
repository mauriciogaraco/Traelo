/**
 * Núcleo de la analítica de comportamiento: cola de eventos, envío por lotes y reintentos.
 *
 * Reglas (ver el backend, módulo `behavior`):
 *  - Nunca bloquea ni rompe la pantalla: `track` es síncrono y barato; el envío es en segundo plano y
 *    cualquier fallo se traga.
 *  - Los eventos esperan unos segundos para ir juntos en un lote (máx. 50), y se guardan en
 *    localStorage para no perderse si se cierra la pestaña o no hay conexión.
 *  - Un error "del cliente" (4xx: ruta inexistente, clave, validación) descarta el lote: reintentarlo
 *    no lo arregla y la cola no debe crecer sin fin. Red caída, 5xx y 429 se reintentan con espera.
 *
 * Es una fábrica con dependencias inyectadas para poder probarla sin DOM ni red.
 */

export type EventType =
  | 'business_view'
  | 'product_view'
  | 'search'
  | 'search_result_click'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'cart_view'
  | 'checkout_started'
  | 'favorite_added'
  | 'favorite_removed'
  | 'signup_completed'
  | 'login_completed'

export type EventProperties = Record<string, string | number | boolean | null | undefined>

export type TrackData = {
  businessId?: string | null
  productId?: string | null
  properties?: EventProperties
}

export type QueuedEvent = {
  type: EventType
  occurredAt: string
  businessId?: string
  productId?: string
  properties?: Record<string, string | number | boolean | null>
}

export type TrackBatch = {
  visitorId: string
  sessionId: string
  channel: 'WEB'
  events: QueuedEvent[]
}

export type TrackerDeps = {
  send: (batch: TrackBatch, options: { keepalive: boolean }) => Promise<void>
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  now: () => Date
  visitorId: () => string
  sessionId: () => string
  isEnabled: () => boolean
  setTimer: (callback: () => void, ms: number) => unknown
  clearTimer: (handle: unknown) => void
}

export const QUEUE_KEY = 'traelo_analytics_queue'
export const MAX_QUEUE = 200
export const MAX_BATCH = 50
export const FLUSH_DELAY_MS = 8_000
export const RETRY_START_MS = 15_000
export const RETRY_MAX_MS = 5 * 60_000
const MAX_STRING = 300

/**
 * Eventos de "vista": el mismo evento repetido en este intervalo cuenta una sola vez. Un efecto de
 * React que se ejecuta dos veces (StrictMode) o una pantalla que se vuelve a montar no deben inflar
 * las visitas. Los de carrito NO se deduplican: dos clics en "+" son dos añadidos reales.
 */
export const DEDUPE_WINDOW_MS = 2_000
const DEDUPED_TYPES = new Set<EventType>(['business_view', 'product_view', 'cart_view', 'checkout_started'])

/** ¿Reintentar no lo arregla? (4xx salvo timeout y límite de envíos.) */
export function isPermanentFailure(error: unknown): boolean {
  const status = (error as { status?: unknown } | null)?.status
  return typeof status === 'number' && status >= 400 && status < 500 && status !== 408 && status !== 429
}

function cleanProperties(properties: EventProperties | undefined): QueuedEvent['properties'] {
  if (!properties) return undefined
  const result: Record<string, string | number | boolean | null> = {}
  for (const [key, value] of Object.entries(properties)) {
    if (value === undefined) continue
    result[key] = typeof value === 'string' ? value.slice(0, MAX_STRING) : value
  }
  return Object.keys(result).length > 0 ? result : undefined
}

export function createTracker(deps: TrackerDeps) {
  let queue: QueuedEvent[] = []
  let flushing = false
  let timer: unknown = null
  let retryDelay = RETRY_START_MS
  let restored = false
  const lastSeen = new Map<string, number>()

  function persist() {
    try {
      deps.setItem(QUEUE_KEY, JSON.stringify(queue))
    } catch {
      // Sin almacenamiento: la cola queda solo en memoria.
    }
  }

  function schedule(ms: number) {
    if (timer !== null) return
    timer = deps.setTimer(() => {
      timer = null
      void flush()
    }, ms)
  }

  /** Recupera los eventos que no llegaron a enviarse en una visita anterior y los envía. */
  function restore() {
    if (restored) return
    restored = true
    try {
      const raw = deps.getItem(QUEUE_KEY)
      const saved = raw ? (JSON.parse(raw) as unknown) : []
      if (Array.isArray(saved)) queue = [...(saved as QueuedEvent[]), ...queue].slice(-MAX_QUEUE)
    } catch {
      // Cola dañada: se empieza de cero.
    }
    if (queue.length > 0) schedule(1_000)
  }

  function track(type: EventType, data: TrackData = {}, options: { flush?: boolean } = {}) {
    if (!deps.isEnabled()) return
    if (DEDUPED_TYPES.has(type)) {
      const key = `${type}|${data.businessId ?? ''}|${data.productId ?? ''}`
      const at = deps.now().getTime()
      const previous = lastSeen.get(key)
      if (previous !== undefined && at - previous < DEDUPE_WINDOW_MS) return
      lastSeen.set(key, at)
    }
    const event: QueuedEvent = { type, occurredAt: deps.now().toISOString() }
    if (data.businessId) event.businessId = data.businessId
    if (data.productId) event.productId = data.productId
    const properties = cleanProperties(data.properties)
    if (properties) event.properties = properties

    queue.push(event)
    if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE)
    persist()

    if (options.flush) void flush()
    else schedule(FLUSH_DELAY_MS)
  }

  async function flush(options: { keepalive?: boolean } = {}): Promise<void> {
    if (!deps.isEnabled()) {
      if (queue.length > 0) {
        queue = []
        persist()
      }
      return
    }
    if (flushing || queue.length === 0) return
    flushing = true
    if (timer !== null) {
      deps.clearTimer(timer)
      timer = null
    }

    const batch = queue.slice(0, MAX_BATCH)
    let failed = false
    try {
      await deps.send(
        { visitorId: deps.visitorId(), sessionId: deps.sessionId(), channel: 'WEB', events: batch },
        { keepalive: options.keepalive === true },
      )
      queue = queue.slice(batch.length)
      retryDelay = RETRY_START_MS
    } catch (error) {
      if (isPermanentFailure(error)) {
        queue = queue.slice(batch.length)
      } else {
        failed = true
      }
    } finally {
      flushing = false
      persist()
      if (queue.length > 0) {
        if (failed) {
          schedule(retryDelay)
          retryDelay = Math.min(retryDelay * 2, RETRY_MAX_MS)
        } else {
          schedule(1_000)
        }
      }
    }
  }

  return { track, flush, restore, pending: () => queue.length }
}

export type Tracker = ReturnType<typeof createTracker>
