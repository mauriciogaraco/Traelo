import { ACTIVE_ORDER_WINDOW_MS, MAX_GUEST_ORDER_CHECKS, guestOrdersToCheck } from '../activeOrders'

const NOW = Date.parse('2026-10-03T12:00:00.000Z')
const ref = (orderId: string, hoursAgo: number) => ({
  orderId,
  orderNumber: 1,
  token: `t-${orderId}`,
  createdAt: new Date(NOW - hoursAgo * 3600_000).toISOString(),
})

describe('guestOrdersToCheck', () => {
  it('descarta pedidos de hace más de 24 h', () => {
    const result = guestOrdersToCheck([ref('a', 1), ref('b', 25)], NOW, new Set())
    expect(result.map((r) => r.orderId)).toEqual(['a'])
    expect(ACTIVE_ORDER_WINDOW_MS).toBe(24 * 3600_000)
  })

  it('descarta los que ya se sabe que terminaron', () => {
    const result = guestOrdersToCheck([ref('a', 1), ref('b', 2)], NOW, new Set(['a']))
    expect(result.map((r) => r.orderId)).toEqual(['b'])
  })

  it('consulta como mucho los más recientes (la lista ya viene del más nuevo al más viejo)', () => {
    const refs = ['a', 'b', 'c', 'd', 'e'].map((id, i) => ref(id, i + 1))
    expect(guestOrdersToCheck(refs, NOW, new Set())).toHaveLength(MAX_GUEST_ORDER_CHECKS)
  })
})
