import { deliveryCityIdFor, isCrossCityDelivery, resolveDeliveryCityCode, type CityOption } from '../index'

const GUIRA: CityOption = { code: 'guira-de-melena', name: 'Güira de Melena', apiId: 'cty_guira_de_melena' }
const SA: CityOption = { code: 'san-antonio-de-los-banos', name: 'San Antonio de los Baños', apiId: 'cmsa01' }
const TWO = [GUIRA, SA]

describe('resolveDeliveryCityCode — dónde se entrega', () => {
  it('lo elegido ahora a mano manda sobre todo', () => {
    expect(resolveDeliveryCityCode({ override: SA.code, savedAddressCityCode: GUIRA.code, activeCityCode: GUIRA.code, cities: TWO })).toBe(SA.code)
  })

  it('sin elección manual, la localidad guardada con la dirección elegida', () => {
    expect(resolveDeliveryCityCode({ override: null, savedAddressCityCode: SA.code, activeCityCode: GUIRA.code, cities: TWO })).toBe(SA.code)
  })

  it('sin nada de lo anterior, la localidad desde la que compra', () => {
    expect(resolveDeliveryCityCode({ override: null, savedAddressCityCode: null, activeCityCode: GUIRA.code, cities: TWO })).toBe(GUIRA.code)
  })

  it('un código que ya no existe (valor viejo o manipulado) se ignora', () => {
    expect(resolveDeliveryCityCode({ override: 'pinar-del-rio', savedAddressCityCode: 'otra', activeCityCode: GUIRA.code, cities: TWO })).toBe(GUIRA.code)
  })
})

describe('isCrossCityDelivery / deliveryCityIdFor', () => {
  it('entre localidades solo con 2+ y si son distintas', () => {
    expect(isCrossCityDelivery(SA.code, GUIRA.code, TWO)).toBe(true)
    expect(isCrossCityDelivery(GUIRA.code, GUIRA.code, TWO)).toBe(false)
    expect(isCrossCityDelivery(SA.code, GUIRA.code, [GUIRA])).toBe(false) // una sola localidad: como siempre
    expect(isCrossCityDelivery(null, GUIRA.code, TWO)).toBe(false)
  })

  it('el id de servidor solo viaja con 2+ localidades y si la ciudad lo conoce', () => {
    expect(deliveryCityIdFor(SA.code, TWO)).toBe('cmsa01')
    expect(deliveryCityIdFor(SA.code, [GUIRA])).toBeUndefined()
    expect(deliveryCityIdFor(SA.code, [GUIRA, { code: SA.code, name: SA.name }])).toBeUndefined()
    expect(deliveryCityIdFor(null, TWO)).toBeUndefined()
  })
})
