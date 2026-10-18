import { withCity } from '../city'

describe('withCity', () => {
  it('añade la localidad activa a un evento sin propiedades', () => {
    expect(withCity(undefined, 'san-antonio-de-los-banos')).toEqual({ properties: { cityCode: 'san-antonio-de-los-banos' } })
  })

  it('conserva los datos y las propiedades del evento', () => {
    expect(withCity({ businessId: 'b1', properties: { source: 'home' } }, 'guira-de-melena')).toEqual({
      businessId: 'b1',
      properties: { source: 'home', cityCode: 'guira-de-melena' },
    })
  })

  it('un cityCode propio del evento manda sobre el de la localidad activa (la promo es de San Antonio)', () => {
    const data = { properties: { cityCode: 'san-antonio-de-los-banos', state: 'active' } }
    expect(withCity(data, 'guira-de-melena')).toBe(data)
  })

  it('sin localidad activa deja el evento tal cual', () => {
    const data = { properties: { q: 1 } }
    expect(withCity(data, null)).toBe(data)
    expect(withCity(undefined, undefined)).toBeUndefined()
  })

  it('no modifica el objeto original', () => {
    const data = { properties: { source: 'home' } }
    withCity(data, 'guira-de-melena')
    expect(data).toEqual({ properties: { source: 'home' } })
  })
})
