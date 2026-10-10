import { SESSION_KEY, VISITOR_KEY, VISITOR_TTL_MS, createIdentity, type KeyValueStore } from '../ids'

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  }
}

function setup(now = 1_000_000) {
  const local = memoryStore()
  const session = memoryStore()
  let clock = now
  let n = 0
  const identity = createIdentity({ local, session, now: () => clock, uuid: () => `uuid-${++n}` })
  return { identity, local, session, advance: (ms: number) => (clock += ms) }
}

describe('createIdentity', () => {
  it('genera un visitante y una sesión y los mantiene estables', () => {
    const { identity } = setup()
    expect(identity.visitorId()).toBe(identity.visitorId())
    expect(identity.sessionId()).toBe(identity.sessionId())
    expect(identity.visitorId()).not.toBe(identity.sessionId())
  })

  it('el visitante persiste entre cargas de la página (mismo almacenamiento)', () => {
    const first = setup()
    const id = first.identity.visitorId()
    const second = createIdentity({ local: first.local, session: first.session, now: () => 1_000_000, uuid: () => 'otro' })
    expect(second.visitorId()).toBe(id)
  })

  it('el visitante CADUCA a los 180 días y se genera uno nuevo (no es una identidad permanente)', () => {
    const t = setup()
    const old = t.identity.visitorId()
    const later = 1_000_000 + VISITOR_TTL_MS + 1
    const reloaded = createIdentity({ local: t.local, session: t.session, now: () => later, uuid: () => 'nuevo' })
    expect(reloaded.visitorId()).toBe('nuevo')
    expect(reloaded.visitorId()).not.toBe(old)
  })

  it('reset() rota ambos: quien use el dispositivo después no hereda la identidad anterior', () => {
    const t = setup()
    const visitor = t.identity.visitorId()
    const session = t.identity.sessionId()
    t.identity.reset()
    expect(t.local.data.has(VISITOR_KEY)).toBe(false)
    expect(t.session.data.has(SESSION_KEY)).toBe(false)
    expect(t.identity.visitorId()).not.toBe(visitor)
    expect(t.identity.sessionId()).not.toBe(session)
  })

  it('un valor guardado ilegible (de otra versión) no rompe: se genera uno nuevo', () => {
    const t = setup()
    t.local.setItem(VISITOR_KEY, 'no-es-json')
    expect(() => t.identity.visitorId()).not.toThrow()
  })

  it('con el almacenamiento bloqueado el id sigue siendo estable durante la visita', () => {
    const blocked = () => {
      throw new Error('bloqueado')
    }
    const broken: KeyValueStore = { getItem: blocked, setItem: blocked, removeItem: blocked }
    let n = 0
    const identity = createIdentity({ local: broken, session: broken, now: () => 1, uuid: () => `id-${++n}` })
    expect(identity.visitorId()).toBe(identity.visitorId())
    expect(identity.sessionId()).toBe(identity.sessionId())
    expect(() => identity.reset()).not.toThrow()
  })

  it('sin almacenamiento (null) también funciona', () => {
    const identity = createIdentity({ local: null, session: null, now: () => 1, uuid: () => 'x' })
    expect(identity.visitorId()).toBe('x')
  })
})
