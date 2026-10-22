import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/ApiError'

const memory = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
})
vi.mock('../../config/env', () => ({ env: { apiBaseUrl: 'https://api.test/api/v1', apiKey: 'k' } }))
vi.mock('../../api/mandado', () => ({ quoteMandado: vi.fn(), createMandado: vi.fn() }))
vi.mock('../orderNotifyService', () => ({ notifyOrderToTelegram: vi.fn() }))

const { quoteMandado } = await import('../../api/mandado')
const { requestMandadoQuote } = await import('../mandadoService')

const POINT = { latitude: 22.84, longitude: -82.5, accuracy: null, source: 'DEVICE_LOCATION' as const }

beforeEach(() => vi.clearAllMocks())

describe('requestMandadoQuote — entrega entre localidades y por km', () => {
  it('manda a dónde se entrega (nunca precios) y devuelve la cotización del servidor', async () => {
    vi.mocked(quoteMandado).mockResolvedValue({ deliveryFee: 1500, platformFee: 0, total: 1500, crossCityDelivery: true })
    const result = await requestMandadoQuote({ pickupClarity: 'EXACT', cityId: 'o1', deliveryCityId: 'd1' })
    expect(quoteMandado).toHaveBeenCalledWith({ pickupClarity: 'EXACT', cityId: 'o1', deliveryCityId: 'd1' })
    expect(result).toMatchObject({ ok: true, quote: { deliveryFee: 1500, crossCityDelivery: true } })
  })

  it('"otra ubicación": viaja la marca y el punto del cliente', async () => {
    vi.mocked(quoteMandado).mockResolvedValue({
      deliveryFee: 750, platformFee: 0, total: 750, elsewhereDelivery: { distanceKm: 6, ratePerKm: 125 },
    })
    const result = await requestMandadoQuote({ pickupClarity: 'EXACT', cityId: 'o1', deliveryElsewhere: true, destination: POINT })
    expect(quoteMandado).toHaveBeenCalledWith(expect.objectContaining({ deliveryElsewhere: true, destination: POINT }))
    expect(result).toMatchObject({ ok: true, quote: { elsewhereDelivery: { distanceKm: 6 } } })
  })

  it('un error del servidor sobre la entrega conserva su código y mensaje (no el genérico de red)', async () => {
    vi.mocked(quoteMandado).mockRejectedValue(new ApiError('DELIVERY_ROUTE_UNAVAILABLE', 'Por ahora no hacemos entregas hasta ahí', undefined, 400))
    const result = await requestMandadoQuote({ pickupClarity: 'EXACT', cityId: 'o1', deliveryCityId: 'd1' })
    expect(result).toEqual({ ok: false, code: 'DELIVERY_ROUTE_UNAVAILABLE', message: 'Por ahora no hacemos entregas hasta ahí' })
  })

  it('sin red dice el mensaje de conexión', async () => {
    vi.mocked(quoteMandado).mockRejectedValue(new Error('boom'))
    const result = await requestMandadoQuote({ pickupClarity: 'EXACT' })
    expect(result).toMatchObject({ ok: false, code: 'NETWORK_ERROR' })
  })
})
