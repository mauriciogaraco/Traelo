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
const { precheckCart, submitCheckout } = await import('../checkoutService')
const { useCartStore } = await import('../../store/cartStore')
const { useCatalogStore } = await import('../../store/catalogStore')

const item = (businessId: string) => ({ productId: `p-${businessId}`, businessId, quantity: 1, nameSnapshot: 'x', priceSnapshot: 1, imageUrlSnapshot: null })

const TWO = [
  { code: 'guira-de-melena', name: 'Güira de Melena' },
  { code: 'san-antonio-de-los-banos', name: 'San Antonio de los Baños' },
]

beforeEach(() => {
  vi.clearAllMocks()
  cities = [{ code: 'guira-de-melena', name: 'Güira de Melena' }]
  useCartStore.setState({ items: [], carts: {}, activeCityCode: 'guira-de-melena', checkoutIssues: [] })
  useCatalogStore.setState({ cityCode: 'guira-de-melena', businesses: [{ id: 'b-guira' }] as never, lastSyncedAt: '2026-10-16T00:00:00Z' })
})

describe('precheckCart con varias localidades', () => {
  it('un negocio que no es de la localidad activa se marca y NO se sigue al formulario (sin ir a la red)', async () => {
    cities = TWO
    const items = [item('b-guira'), item('b-otra-ciudad')] as never
    const result = await precheckCart(items)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('MIXED_CITY_BUSINESSES')
      expect(result.issues.map((i) => i.businessId)).toEqual(['b-otra-ciudad'])
    }
    expect(quoteCheckout).not.toHaveBeenCalled()
    expect(useCartStore.getState().checkoutIssues).toHaveLength(1)
  })

  it('con el catálogo sin cargar no bloquea por no saber: lo valida el servidor', async () => {
    cities = TWO
    useCatalogStore.setState({ businesses: [], lastSyncedAt: null })
    vi.mocked(quoteCheckout).mockResolvedValue({} as never)
    const result = await precheckCart([item('b-guira')] as never)
    expect(result.ok).toBe(true)
    expect(quoteCheckout).toHaveBeenCalled()
  })

  it('el servidor manda: MIXED_CITY_BUSINESSES detiene el paso con un mensaje claro', async () => {
    cities = TWO
    vi.mocked(quoteCheckout).mockRejectedValue(new ApiError('MIXED_CITY_BUSINESSES', 'Todos los negocios…', undefined, 400))
    const result = await precheckCart([item('b-guira')] as never)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('MIXED_CITY_BUSINESSES')
      expect(result.message).toContain('Güira de Melena')
    }
  })
})

describe('con una sola localidad nada cambia', () => {
  it('no se aplica la guarda del cliente aunque el negocio no esté en el catálogo', async () => {
    vi.mocked(quoteCheckout).mockResolvedValue({} as never)
    const result = await precheckCart([item('b-no-esta')] as never)
    expect(result.ok).toBe(true)
    expect(quoteCheckout).toHaveBeenCalled()
  })
})

describe('crear el pedido', () => {
  it('si el servidor rechaza por mezcla de localidades, el mensaje es comprensible y el carrito no se vacía', async () => {
    cities = TWO
    useCartStore.setState({ items: [item('b-guira')] as never })
    vi.mocked(createCheckoutOrder).mockRejectedValue(new ApiError('MIXED_CITY_BUSINESSES', 'Todos los negocios…', undefined, 400))
    const result = await submitCheckout({ items: [item('b-guira')], clientRequestId: 'req-12345678', name: 'Ana', phone: '+5355551234', address: 'Calle 1' } as never)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('MIXED_CITY_BUSINESSES')
      expect(result.message).toContain('distintas localidades')
    }
    expect(useCartStore.getState().items).toHaveLength(1)
  })
})
