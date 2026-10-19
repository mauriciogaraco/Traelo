import { cityFromQueryToApply, cityShareUrl } from '../resolveCityFromQuery'
import type { CityOption } from '../cities'

const GUIRA: CityOption = { code: 'guira-de-melena', name: 'Güira de Melena' }
const SA: CityOption = { code: 'san-antonio-de-los-banos', name: 'San Antonio de los Baños', apiId: 'cmvbs5ep80000dcuh5h815x8v' }
const params = (qs: string) => new URLSearchParams(qs)

describe('cityFromQueryToApply', () => {
  it('con la ciudad ya conocida, la aplica', () => {
    expect(cityFromQueryToApply(params('ciudad=san-antonio-de-los-banos'), [GUIRA, SA], null)?.code).toBe('san-antonio-de-los-banos')
  })

  // Regresión: un cliente nuevo abre el enlace ANTES de tener la lista del servidor (solo conoce Güira).
  it('un cliente nuevo: primero no la reconoce, y cuando llega la lista del servidor SÍ la aplica', () => {
    const link = params('ciudad=san-antonio-de-los-banos')
    expect(cityFromQueryToApply(link, [GUIRA], null)).toBeNull() // lista mínima: todavía no la conoce
    expect(cityFromQueryToApply(link, [GUIRA, SA], null)?.code).toBe('san-antonio-de-los-banos') // llegó la lista
  })

  it('no vuelve a imponer la ciudad del enlace si ya se aplicó (la persona pudo cambiarla con el selector)', () => {
    const link = params('ciudad=san-antonio-de-los-banos')
    const first = cityFromQueryToApply(link, [GUIRA, SA], null)!
    expect(cityFromQueryToApply(link, [GUIRA, SA], first.key)).toBeNull()
  })

  it('un enlace distinto sí se aplica', () => {
    const first = cityFromQueryToApply(params('ciudad=san-antonio-de-los-banos'), [GUIRA, SA], null)!
    expect(cityFromQueryToApply(params('ciudad=guira-de-melena'), [GUIRA, SA], first.key)?.code).toBe('guira-de-melena')
  })

  it('sin parámetro, o con una ciudad que no existe, no aplica nada', () => {
    expect(cityFromQueryToApply(params(''), [GUIRA, SA], null)).toBeNull()
    expect(cityFromQueryToApply(params('ciudad=pinar-del-rio'), [GUIRA, SA], null)).toBeNull()
    expect(cityFromQueryToApply(params('ciudad=<script>'), [GUIRA, SA], null)).toBeNull()
  })

  it('no distingue mayúsculas ni espacios', () => {
    expect(cityFromQueryToApply(params('ciudad=%20SAN-ANTONIO-DE-LOS-BANOS%20'), [GUIRA, SA], null)?.code).toBe('san-antonio-de-los-banos')
  })

  it('el enlace puede traer otros parámetros (p. ej. la promo) y sigue funcionando', () => {
    expect(cityFromQueryToApply(params('ciudad=san-antonio-de-los-banos&promo=ABC-123'), [GUIRA, SA], null)?.code).toBe('san-antonio-de-los-banos')
  })
})

describe('cityShareUrl', () => {
  it('arma el enlace que abre la web ya en esa localidad', () => {
    expect(cityShareUrl('https://www.traelo-market.com', 'san-antonio-de-los-banos')).toBe(
      'https://www.traelo-market.com/?ciudad=san-antonio-de-los-banos',
    )
    expect(cityShareUrl('https://www.traelo-market.com', 'guira-de-melena')).toBe('https://www.traelo-market.com/?ciudad=guira-de-melena')
  })
})
