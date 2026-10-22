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

describe('entrega entre localidades (mensajería fija del servidor)', () => {
  it('la cotización lleva la localidad de entrega y devuelve lo que cobra el servidor', async () => {
    cities = TWO
    vi.mocked(quoteCheckout).mockResolvedValue({ deliveryFee: 1500, crossCityDelivery: true } as never)
    const { requestCheckoutQuote } = await import('../checkoutService')
    const result = await requestCheckoutQuote([item('b-guira')] as never, undefined, { cityId: 'cmsa01' })
    expect(quoteCheckout).toHaveBeenCalledWith(expect.objectContaining({ deliveryCityId: 'cmsa01' }))
    expect(result.ok && result.quote.deliveryFee).toBe(1500)
  })

  it('sin tarifa para ese sentido, la cotización falla con DELIVERY_ROUTE_UNAVAILABLE y mensaje claro', async () => {
    cities = TWO
    vi.mocked(quoteCheckout).mockRejectedValue(new ApiError('DELIVERY_ROUTE_UNAVAILABLE', 'Por ahora no hacemos entregas desde esa localidad', undefined, 400))
    const { requestCheckoutQuote } = await import('../checkoutService')
    const result = await requestCheckoutQuote([item('b-guira')] as never, undefined, { cityId: 'cmsa01' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('DELIVERY_ROUTE_UNAVAILABLE')
      expect(result.message).toContain('entregas')
    }
  })

  it('crear el pedido manda deliveryCityId', async () => {
    cities = TWO
    vi.mocked(createCheckoutOrder).mockResolvedValue({ id: 'o1', orderNumber: 7, createdAt: '', customerName: 'Ana', customerPhone: '+5355551234', customerAddress: 'Calle 1', addressReference: null, guestAccessToken: 't' } as never)
    await submitCheckout({ items: [item('b-guira')], clientRequestId: 'req-12345678', address: 'Calle 1', customerName: 'Ana', customerPhone: '+5355551234', deliveryCityId: 'cmsa01' } as never)
    expect(createCheckoutOrder).toHaveBeenCalledWith(expect.objectContaining({ deliveryCityId: 'cmsa01' }))
  })
})

describe('otra ubicación (mensajería por km)', () => {
  const gps = { latitude: 22.84, longitude: -82.5, accuracy: 10, source: 'DEVICE_LOCATION' as const }

  it('la cotización manda la ubicación y deliveryElsewhere, y devuelve los km que midió el servidor', async () => {
    cities = TWO
    vi.mocked(quoteCheckout).mockResolvedValue({ deliveryFee: 620, elsewhereDelivery: { distanceKm: 4.9, ratePerKm: 125 } } as never)
    const { requestCheckoutQuote } = await import('../checkoutService')
    const result = await requestCheckoutQuote([item('b-guira')] as never, undefined, { elsewhere: gps })
    expect(quoteCheckout).toHaveBeenCalledWith(expect.objectContaining({ deliveryElsewhere: true, location: gps }))
    expect(quoteCheckout).toHaveBeenCalledWith(expect.not.objectContaining({ deliveryCityId: expect.anything() }))
    expect(result.ok && result.quote.elsewhereDelivery).toEqual({ distanceKm: 4.9, ratePerKm: 125 })
  })

  it('si el pueblo no tiene coordenadas, el error es claro (CITY_COORDINATES_MISSING)', async () => {
    cities = TWO
    vi.mocked(quoteCheckout).mockRejectedValue(new ApiError('CITY_COORDINATES_MISSING', 'Esa localidad todavía no admite entregas en otra ubicación', undefined, 400))
    const { requestCheckoutQuote } = await import('../checkoutService')
    const result = await requestCheckoutQuote([item('b-guira')] as never, undefined, { elsewhere: gps })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('CITY_COORDINATES_MISSING')
  })

  it('crear el pedido manda deliveryElsewhere y la ubicación', async () => {
    cities = TWO
    vi.mocked(createCheckoutOrder).mockResolvedValue({ id: 'o2', orderNumber: 8, createdAt: '', customerName: 'Ana', customerPhone: '+5355551234', customerAddress: 'Finca', addressReference: null, guestAccessToken: 't' } as never)
    await submitCheckout({ items: [item('b-guira')], clientRequestId: 'req-12345678', address: 'Finca', customerName: 'Ana', customerPhone: '+5355551234', location: gps, deliveryElsewhere: true } as never)
    expect(createCheckoutOrder).toHaveBeenCalledWith(expect.objectContaining({ deliveryElsewhere: true, location: gps }))
  })
})
