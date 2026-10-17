import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/ApiError'

const memory = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
})
vi.mock('../../config/env', () => ({ env: { apiBaseUrl: 'https://api.test/api/v1', apiKey: 'k' } }))
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
const { usePromoStore } = await import('../../store/promoStore')

const item = { productId: 'p1', businessId: 'b1', quantity: 1, nameSnapshot: 'x', priceSnapshot: 1, imageUrlSnapshot: null } as never
const SA = 'san-antonio-de-los-banos'
const params = { items: [item], clientRequestId: 'req-12345678', address: 'Calle 1', customerName: 'Ana', customerPhone: '+5355551234' } as never

const quote = { productsTotal: 100, packagingTotal: 0, deliveryFee: 250, platformFee: 10, total: 360 } as never
const promoError = (code: string) => new ApiError(code, 'Esta promoción ya se agotó', undefined, 400)

beforeEach(() => {
  vi.clearAllMocks()
  memory.clear()
  usePromoStore.setState({ code: null, cityCode: null })
  useCartStore.setState({ items: [], carts: {}, activeCityCode: SA, checkoutIssues: [] })
  useCatalogStore.setState({ cityCode: SA })
})

describe('promoción: código en la cotización', () => {
  it('sin código guardado no se manda nada', async () => {
    vi.mocked(quoteCheckout).mockResolvedValue(quote)
    await requestCheckoutQuote([item])
    expect(vi.mocked(quoteCheckout).mock.calls[0]![0].promoCode).toBeUndefined()
  })

  it('con código y comprando en la localidad del enlace, se manda', async () => {
    usePromoStore.setState({ code: 'PRIMERA-GRATIS-SA', cityCode: SA })
    vi.mocked(quoteCheckout).mockResolvedValue(quote)
    await requestCheckoutQuote([item])
    expect(vi.mocked(quoteCheckout).mock.calls[0]![0].promoCode).toBe('PRIMERA-GRATIS-SA')
  })

  it('comprando en OTRA localidad (Güira) no se manda un código que no puede aplicar', async () => {
    usePromoStore.setState({ code: 'PRIMERA-GRATIS-SA', cityCode: SA })
    useCatalogStore.setState({ cityCode: 'guira-de-melena' })
    vi.mocked(quoteCheckout).mockResolvedValue(quote)
    await requestCheckoutQuote([item])
    expect(vi.mocked(quoteCheckout).mock.calls[0]![0].promoCode).toBeUndefined()
  })

  it('si el servidor rechaza la promo (agotada), se cotiza SIN ella, se explica y se olvida el código', async () => {
    usePromoStore.setState({ code: 'PRIMERA-GRATIS-SA', cityCode: SA })
    vi.mocked(quoteCheckout).mockRejectedValueOnce(promoError('PROMO_EXHAUSTED')).mockResolvedValueOnce(quote)
    const result = await requestCheckoutQuote([item])
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.promoNotice).toBe('Esta promoción ya se agotó')
    expect(vi.mocked(quoteCheckout).mock.calls[1]![0].promoCode).toBeUndefined()
    expect(usePromoStore.getState().code).toBeNull()
  })

  it('"otra localidad" rechaza pero NO borra el código (puede servir si cambia de localidad)', async () => {
    usePromoStore.setState({ code: 'PRIMERA-GRATIS-SA', cityCode: null })
    vi.mocked(quoteCheckout).mockRejectedValueOnce(promoError('PROMO_WRONG_CITY')).mockResolvedValueOnce(quote)
    await requestCheckoutQuote([item])
    expect(usePromoStore.getState().code).toBe('PRIMERA-GRATIS-SA')
  })

  it('un error que no es de la promo no se reintenta ni se confunde con ella', async () => {
    usePromoStore.setState({ code: 'PRIMERA-GRATIS-SA', cityCode: SA })
    vi.mocked(quoteCheckout).mockRejectedValue(new ApiError('INTERNAL', 'falló', undefined, 500))
    const result = await requestCheckoutQuote([item])
    expect(result.ok).toBe(false)
    expect(quoteCheckout).toHaveBeenCalledTimes(1)
    expect(usePromoStore.getState().code).toBe('PRIMERA-GRATIS-SA')
  })
})

describe('promoción: el pedido', () => {
  const order = { id: 'o1', orderNumber: 1, customerName: 'Ana', customerPhone: '+5355551234', customerAddress: 'Calle 1', createdAt: 'x' }

  it('manda el código (solo el código, nunca un descuento) y lo olvida al crear el pedido', async () => {
    usePromoStore.setState({ code: 'PRIMERA-GRATIS-SA', cityCode: SA })
    vi.mocked(createCheckoutOrder).mockResolvedValue({ ...order, guestAccessToken: 't' } as never)
    const result = await submitCheckout(params)
    expect(result.ok).toBe(true)
    const sent = vi.mocked(createCheckoutOrder).mock.calls[0]![0] as Record<string, unknown>
    expect(sent.promoCode).toBe('PRIMERA-GRATIS-SA')
    expect(Object.keys(sent)).not.toContain('deliveryFeeDiscount')
    expect(usePromoStore.getState().code).toBeNull()
  })

  it('si el servidor rechaza la promo no se crea nada: explica y quita el código para reintentar sin ella', async () => {
    usePromoStore.setState({ code: 'PRIMERA-GRATIS-SA', cityCode: SA })
    vi.mocked(createCheckoutOrder).mockRejectedValue(promoError('PROMO_NOT_FIRST_ORDER'))
    const result = await submitCheckout(params)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('PROMO_NOT_FIRST_ORDER')
      expect(result.message).toContain('sin la promoción')
    }
    expect(usePromoStore.getState().code).toBeNull()
  })
})
