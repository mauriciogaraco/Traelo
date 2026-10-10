import {
  DEDUPE_WINDOW_MS,
  MAX_EVENT_AGE_MS,
  FLUSH_DELAY_MS,
  MAX_BATCH,
  MAX_QUEUE,
  QUEUE_KEY,
  RETRY_MAX_MS,
  RETRY_START_MS,
  createTracker,
  isPermanentFailure,
  type TrackBatch,
} from '../tracker'

const NOW = new Date('2026-10-09T12:00:00.000Z')

function setup(overrides: { enabled?: boolean; send?: (batch: TrackBatch, o: { keepalive: boolean }) => Promise<void> } = {}) {
  const store = new Map<string, string>()
  const timers: { id: number; ms: number; run: () => void }[] = []
  let nextId = 1
  const send = vi.fn(overrides.send ?? (async () => undefined))
  let enabled = overrides.enabled ?? true
  let clock = NOW.getTime()
  let idCounter = 0

  const tracker = createTracker({
    send,
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, value),
    now: () => new Date(clock),
    newId: () => `event-${++idCounter}`,
    visitorId: () => 'visitor-1',
    sessionId: () => 'session-1',
    isEnabled: () => enabled,
    setTimer: (run, ms) => {
      const id = nextId++
      timers.push({ id, ms, run })
      return id
    },
    clearTimer: (handle) => {
      const index = timers.findIndex((t) => t.id === handle)
      if (index >= 0) timers.splice(index, 1)
    },
  })

  return {
    tracker,
    send,
    store,
    timers,
    setEnabled: (value: boolean) => (enabled = value),
    advance: (ms: number) => (clock += ms),
    saved: () => JSON.parse(store.get(QUEUE_KEY) ?? '[]') as unknown[],
    /** Dispara el temporizador pendiente (como si pasara el tiempo) y espera a que termine el envío. */
    async fire() {
      const timer = timers.shift()
      timer?.run()
      await Promise.resolve()
      await new Promise((r) => setTimeout(r, 0))
    },
  }
}

describe('track', () => {
  it('encola el evento con su hora y datos, lo guarda y programa un envío en lote', () => {
    const t = setup()
    t.tracker.track('business_view', { businessId: 'b1', properties: { source: 'home' } })
    expect(t.tracker.pending()).toBe(1)
    expect(t.saved()).toEqual([
      { eventId: 'event-1', type: 'business_view', occurredAt: NOW.toISOString(), businessId: 'b1', properties: { source: 'home' } },
    ])
    expect(t.timers).toHaveLength(1)
    expect(t.timers[0]!.ms).toBe(FLUSH_DELAY_MS)
    expect(t.send).not.toHaveBeenCalled()
  })

  it('con la analítica apagada no encola nada', () => {
    const t = setup({ enabled: false })
    t.tracker.track('cart_view')
    expect(t.tracker.pending()).toBe(0)
    expect(t.timers).toHaveLength(0)
  })

  it('limpia las propiedades: sin undefined y con los textos largos recortados', () => {
    const t = setup()
    t.tracker.track('search', { properties: { query: 'x'.repeat(500), tab: undefined, resultCount: 0 } })
    const [event] = t.saved() as { properties: Record<string, unknown> }[]
    expect(event!.properties).toEqual({ query: 'x'.repeat(300), resultCount: 0 })
  })

  it('un solo temporizador aunque lleguen muchos eventos', () => {
    const t = setup()
    for (let i = 0; i < 5; i++) t.tracker.track('cart_view')
    expect(t.timers).toHaveLength(1)
  })

  it('la cola tiene tope: se quedan los más recientes', () => {
    const t = setup()
    for (let i = 0; i < MAX_QUEUE + 25; i++) t.tracker.track('search', { properties: { n: i } })
    expect(t.tracker.pending()).toBe(MAX_QUEUE);
    const saved = t.saved() as { properties: { n: number } }[]
    expect(saved[0]!.properties.n).toBe(25)
  })
})

describe('deduplicación de vistas', () => {
  it('la misma vista repetida en 2 s cuenta una sola vez (StrictMode / re-montaje)', () => {
    const t = setup()
    t.tracker.track('business_view', { businessId: 'b1' })
    t.tracker.track('business_view', { businessId: 'b1' })
    expect(t.tracker.pending()).toBe(1)
  })

  it('pasada la ventana, o con otro negocio/producto, sí cuenta', () => {
    const t = setup()
    t.tracker.track('business_view', { businessId: 'b1' })
    t.tracker.track('business_view', { businessId: 'b2' })
    t.advance(DEDUPE_WINDOW_MS + 1)
    t.tracker.track('business_view', { businessId: 'b1' })
    expect(t.tracker.pending()).toBe(3)
  })

  it('los eventos de carrito no se deduplican: dos clics son dos añadidos', () => {
    const t = setup()
    t.tracker.track('add_to_cart', { productId: 'p1', properties: { quantity: 1 } })
    t.tracker.track('add_to_cart', { productId: 'p1', properties: { quantity: 1 } })
    expect(t.tracker.pending()).toBe(2)
  })
})

describe('flush', () => {
  it('envía el lote con visitante, sesión y canal, y lo quita de la cola', async () => {
    const t = setup()
    t.tracker.track('product_view', { productId: 'p1' })
    await t.tracker.flush()
    expect(t.send).toHaveBeenCalledTimes(1)
    const [batch, options] = t.send.mock.calls[0]!
    expect(batch).toMatchObject({ visitorId: 'visitor-1', sessionId: 'session-1', channel: 'WEB' })
    expect(batch.events).toHaveLength(1)
    expect(options).toEqual({ keepalive: false })
    expect(t.tracker.pending()).toBe(0)
    expect(t.saved()).toEqual([])
  })

  it('al cerrar la pestaña se envía con keepalive', async () => {
    const t = setup()
    t.tracker.track('cart_view')
    await t.tracker.flush({ keepalive: true })
    expect(t.send.mock.calls[0]![1]).toEqual({ keepalive: true })
  })

  it('track con flush:true lo manda ya, sin esperar el lote', async () => {
    const t = setup()
    t.tracker.track('login_completed', undefined, { flush: true })
    await new Promise((r) => setTimeout(r, 0))
    expect(t.send).toHaveBeenCalledTimes(1)
  })

  it('manda como mucho 50 por lote y programa el resto', async () => {
    const t = setup()
    for (let i = 0; i < MAX_BATCH + 10; i++) t.tracker.track('search', { properties: { n: i } })
    await t.tracker.flush()
    expect(t.send.mock.calls[0]![0].events).toHaveLength(MAX_BATCH)
    expect(t.tracker.pending()).toBe(10)
    expect(t.timers.length).toBeGreaterThan(0)
    await t.fire()
    expect(t.send).toHaveBeenCalledTimes(2)
    expect(t.tracker.pending()).toBe(0)
  })

  it('sin red conserva los eventos y reintenta con espera creciente', async () => {
    const t = setup({ send: async () => Promise.reject(Object.assign(new Error('red'), { code: 'NETWORK_ERROR' })) })
    t.tracker.track('cart_view')
    await t.tracker.flush()
    expect(t.tracker.pending()).toBe(1)
    expect(t.timers.map((x) => x.ms)).toContain(RETRY_START_MS)

    await t.fire()
    expect(t.send).toHaveBeenCalledTimes(2)
    expect(t.timers.map((x) => x.ms)).toContain(RETRY_START_MS * 2)
    expect(RETRY_MAX_MS).toBeGreaterThan(RETRY_START_MS * 2)
  })

  it.each([500, 503, 429, 408])('un %i se reintenta (no se pierde el lote)', async (status) => {
    const t = setup({ send: async () => Promise.reject(Object.assign(new Error('x'), { status })) })
    t.tracker.track('cart_view')
    await t.tracker.flush()
    expect(t.tracker.pending()).toBe(1)
  })

  it.each([400, 403, 404])('un %i descarta el lote: reintentar no lo arregla y la cola no crece sin fin', async (status) => {
    const t = setup({ send: async () => Promise.reject(Object.assign(new Error('x'), { status })) })
    t.tracker.track('cart_view')
    await t.tracker.flush()
    expect(t.tracker.pending()).toBe(0)
    expect(t.timers).toHaveLength(0)
  })

  it('un evento que llega mientras se envía no se pierde', async () => {
    let release: () => void = () => undefined
    const t = setup({ send: () => new Promise<void>((resolve) => (release = resolve)) })
    t.tracker.track('cart_view')
    const sending = t.tracker.flush()
    t.tracker.track('business_view', { businessId: 'b2' })
    release()
    await sending
    expect(t.tracker.pending()).toBe(1)
    expect((t.saved() as { type: string }[])[0]!.type).toBe('business_view')
  })

  it('apagada la analítica, vacía lo pendiente en vez de enviarlo', async () => {
    const t = setup()
    t.tracker.track('cart_view')
    t.setEnabled(false)
    await t.tracker.flush()
    expect(t.send).not.toHaveBeenCalled()
    expect(t.tracker.pending()).toBe(0)
  })
})

describe('restore', () => {
  it('recupera lo que no llegó a enviarse en una visita anterior y lo envía', async () => {
    const t = setup()
    t.store.set(QUEUE_KEY, JSON.stringify([{ eventId: 'guardado-1', type: 'cart_view', occurredAt: '2026-10-09T10:00:00.000Z' }]))
    t.tracker.restore()
    expect(t.tracker.pending()).toBe(1)
    await t.fire()
    expect(t.send).toHaveBeenCalledTimes(1)
    expect(t.send.mock.calls[0]![0].events[0]!.occurredAt).toBe('2026-10-09T10:00:00.000Z')
    expect(t.send.mock.calls[0]![0].events[0]!.eventId).toBe('guardado-1')
  })

  it('restaurar dos veces (React StrictMode) no duplica eventos', () => {
    const t = setup()
    t.store.set(QUEUE_KEY, JSON.stringify([{ type: 'cart_view', occurredAt: NOW.toISOString() }]))
    t.tracker.restore()
    t.tracker.restore()
    expect(t.tracker.pending()).toBe(1)
  })

  it('una cola guardada dañada no rompe nada', () => {
    const t = setup()
    t.store.set(QUEUE_KEY, '{no es json')
    expect(() => t.tracker.restore()).not.toThrow()
    expect(t.tracker.pending()).toBe(0)
  })
})

describe('isPermanentFailure', () => {
  it('solo los 4xx del cliente son permanentes (no timeout ni límite de envíos ni errores sin estado)', () => {
    expect(isPermanentFailure({ status: 404 })).toBe(true)
    expect(isPermanentFailure({ status: 400 })).toBe(true)
    expect(isPermanentFailure({ status: 429 })).toBe(false)
    expect(isPermanentFailure({ status: 408 })).toBe(false)
    expect(isPermanentFailure({ status: 500 })).toBe(false)
    expect(isPermanentFailure(new Error('red'))).toBe(false)
    expect(isPermanentFailure(null)).toBe(false)
  })
})

describe('eventId: reintentos sin duplicados', () => {
  it('cada evento lleva un eventId distinto', () => {
    const t = setup()
    t.tracker.track('search', { properties: { n: 1 } })
    t.tracker.track('search', { properties: { n: 2 } })
    const ids = (t.saved() as { eventId: string }[]).map((e) => e.eventId)
    expect(new Set(ids).size).toBe(2)
  })

  it('al reintentar se reenvía el MISMO eventId (el backend ignora el repetido)', async () => {
    let attempt = 0
    const t = setup({
      send: async () => {
        attempt++
        if (attempt === 1) throw Object.assign(new Error('red'), { code: 'NETWORK_ERROR' })
      },
    })
    t.tracker.track('add_to_cart', { productId: 'p1', properties: { quantity: 1 } })
    await t.tracker.flush()
    await t.fire()
    expect(t.send).toHaveBeenCalledTimes(2)
    const first = t.send.mock.calls[0]![0].events[0]!.eventId
    const second = t.send.mock.calls[1]![0].events[0]!.eventId
    expect(second).toBe(first)
  })

  it('un evento nuevo tras un fallo NO reutiliza el eventId del anterior', async () => {
    const t = setup({ send: async () => Promise.reject(Object.assign(new Error('x'), { status: 500 })) })
    t.tracker.track('search', { properties: { n: 1 } })
    await t.tracker.flush()
    t.tracker.track('search', { properties: { n: 2 } })
    const ids = (t.saved() as { eventId: string }[]).map((e) => e.eventId)
    expect(new Set(ids).size).toBe(2)
  })
})

describe('caducidad de la cola', () => {
  it('al recuperar la cola guardada descarta lo que pasó de las 24 h y lo que no tiene forma válida', () => {
    const t = setup()
    const fresh = new Date(NOW.getTime() - 60_000).toISOString()
    const stale = new Date(NOW.getTime() - MAX_EVENT_AGE_MS - 60_000).toISOString()
    t.store.set(
      QUEUE_KEY,
      JSON.stringify([
        { eventId: 'a', type: 'cart_view', occurredAt: stale },
        { eventId: 'b', type: 'cart_view', occurredAt: fresh },
        { eventId: 'c', type: 'cart_view' },
        null,
      ]),
    )
    t.tracker.restore()
    expect(t.tracker.pending()).toBe(1)
  })

  it('un evento que caduca mientras espera (red caída mucho rato) se descarta en vez de enviarse', async () => {
    const t = setup()
    t.tracker.track('cart_view')
    t.advance(MAX_EVENT_AGE_MS + 1_000)
    await t.tracker.flush()
    expect(t.send).not.toHaveBeenCalled()
    expect(t.tracker.pending()).toBe(0)
  })
})

describe('clear', () => {
  it('descarta lo pendiente, lo borra del almacenamiento y cancela el envío programado', async () => {
    const t = setup()
    t.tracker.track('cart_view')
    t.tracker.clear()
    expect(t.tracker.pending()).toBe(0)
    expect(t.saved()).toEqual([])
    expect(t.timers).toHaveLength(0)
    await t.tracker.flush()
    expect(t.send).not.toHaveBeenCalled()
  })
})

