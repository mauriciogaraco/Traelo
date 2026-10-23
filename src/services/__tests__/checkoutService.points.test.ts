import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/ApiError'

const memory = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
})
vi.mock('../../config/env', () => ({ env: { apiBaseUrl: 'https://api.test/api/v1', apiKey: 'k' } }))

let cities = [{ code: 'guira-de-melena', name: 'Güira de Melena' }]
vi.mock('../../features/city/cities', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../features/city/cities')>()
  return { ...original, getCities: () => cities }
})
vi.mock('../../api/rewards', () => ({ quoteCheckout: vi.fn() }))
vi.mock('../../api/checkout', () => ({ createCheckoutOrder: vi.fn() }))
vi.mock('../orderNotifyService', () => ({ notifyOrderToTelegram: vi.fn() }))
vi.mock('../pointsService', () => ({ refreshPoints: vi.fn() }))
vi.mock('../rewardsService', () => ({ clearRedemption: vi.fn(), refreshRewards: vi.fn() }))

const { quoteCheckout } = await import('../../api/rewards')
const { createCheckoutOrder } = await import('../../api/checkout')
const { requestCheckoutQuote, submitCheckout } = await import('../checkoutService')
const { useCartStore } = await import('../../store/cartStore')
const { useCatalogStore } = await import('../../store/catalogStore')

const item = (businessId: string) => ({ productId: `p-${businessId}`, businessId, quantity: 1, nameSnapshot: 'x', priceSnapshot: 1, imageUrlSnapshot: null })

beforeEach(() => {
  vi.clearAllMocks()
  cities = [{ code: 'guira-de-melena', name: 'Güira de Melena' }]
  useCartStore.setState({ items: [], carts: {}, activeCityCode: 'guira-de-melena', checkoutIssues: [] })
  useCatalogStore.setState({ cityCode: 'guira-de-melena', businesses: [{ id: 'b-guira' }] as never, lastSyncedAt: '2026-10-16T00:00:00Z' })
})

const { refreshPoints } = await import('../pointsService')

const quote = (over: Record<string, unknown> = {}) => ({ productsTotal: 720, total: 330, redemption: { rewardId: null, pointsCost: 720 }, ...over }) as never

describe('requestCheckoutQuote — pagar con puntos', () => {
  it('manda las unidades por línea y el saldo visto en la cotización', async () => {
    vi.mocked(quoteCheckout).mockResolvedValue(quote())
    const items = [{ ...item('b-guira'), quantity: 2, productId: 'p1' }] as never
    const result = await requestCheckoutQuote(items, undefined, undefined, { units: { p1: 2 }, expectedBalance: 800 })
    expect(result.ok).toBe(true)
    const body = vi.mocked(quoteCheckout).mock.calls[0]![0]
    expect(body.pointsExpectedBalance).toBe(800)
    expect(body.businesses[0]!.items[0]).toMatchObject({ productId: 'p1', pointsUnits: 2 })
  })

  it('sin unidades elegidas no manda nada de puntos', async () => {
    vi.mocked(quoteCheckout).mockResolvedValue(quote({ redemption: null }))
    await requestCheckoutQuote([item('b-guira')] as never, undefined, undefined, { units: {}, expectedBalance: 800 })
    const body = vi.mocked(quoteCheckout).mock.calls[0]![0]
    expect(body.pointsExpectedBalance).toBeUndefined()
    expect(body.businesses[0]!.items[0]).not.toHaveProperty('pointsUnits')
  })

  it('un error de puntos del servidor (saldo cambió) llega con su código para quitar los puntos', async () => {
    vi.mocked(quoteCheckout).mockRejectedValue(new ApiError('POINTS_BALANCE_CHANGED', 'Tus puntos cambiaron', undefined, 409))
    const result = await requestCheckoutQuote([item('b-guira')] as never, undefined, undefined, { units: { 'p-b-guira': 1 }, expectedBalance: 800 })
    expect(result).toMatchObject({ ok: false, code: 'POINTS_BALANCE_CHANGED' })
  })
})

describe('submitCheckout — pagar con puntos', () => {
  it('al crear el pedido pagado con puntos se actualiza el saldo', async () => {
    vi.mocked(createCheckoutOrder).mockResolvedValue({ id: 'o1', orderNumber: 1, customerName: 'A', customerPhone: '+5355501234', customerAddress: 'x', createdAt: '2026-10-23' } as never)
    const result = await submitCheckout({
      items: [item('b-guira')] as never,
      clientRequestId: 'req-12345678',
      address: 'Calle 1',
      pointsUnits: { 'p-b-guira': 1 },
      pointsExpectedBalance: 800,
    })
    expect(result.ok).toBe(true)
    const body = vi.mocked(createCheckoutOrder).mock.calls[0]![0]
    expect(body.pointsExpectedBalance).toBe(800)
    expect(body.businesses[0]!.items[0]).toMatchObject({ pointsUnits: 1 })
    expect(refreshPoints).toHaveBeenCalled()
  })

  it('un pedido sin puntos no vuelve a pedir el saldo', async () => {
    vi.mocked(createCheckoutOrder).mockResolvedValue({ id: 'o2', orderNumber: 2, customerName: 'A', customerPhone: '+5355501234', customerAddress: 'x', createdAt: '2026-10-23' } as never)
    await submitCheckout({ items: [item('b-guira')] as never, clientRequestId: 'req-87654321', address: 'Calle 1' })
    expect(refreshPoints).not.toHaveBeenCalled()
  })
})
