import { businessIdsOutsideCatalog, MIXED_CITY_CODE, mixedCityMessage, outsideCityIssues } from '../cartCity'

describe('businessIdsOutsideCatalog', () => {
  const catalog = [{ id: 'b1' }, { id: 'b2' }]

  it('detecta los negocios del carrito que no están en la localidad activa, una sola vez cada uno', () => {
    const items = [{ businessId: 'b1' }, { businessId: 'x9' }, { businessId: 'x9' }, { businessId: 'b2' }]
    expect(businessIdsOutsideCatalog(items, catalog)).toEqual(['x9'])
  })

  it('un carrito de la misma localidad no tiene nada fuera', () => {
    expect(businessIdsOutsideCatalog([{ businessId: 'b1' }, { businessId: 'b2' }], catalog)).toEqual([])
  })

  it('carrito vacío: nada', () => {
    expect(businessIdsOutsideCatalog([], catalog)).toEqual([])
  })
})

describe('mensajes y avisos', () => {
  it('el código es el del servidor', () => {
    expect(MIXED_CITY_CODE).toBe('MIXED_CITY_BUSINESSES')
  })

  it('el mensaje explica qué pasó y qué hacer, con la localidad si se conoce', () => {
    expect(mixedCityMessage('Güira de Melena')).toContain('ahora compras desde Güira de Melena')
    expect(mixedCityMessage()).not.toContain('ahora compras desde')
  })

  it('los avisos marcan cada negocio como quitable (BUSINESS_NOT_FOUND)', () => {
    expect(outsideCityIssues(['x9'], 'Güira de Melena')).toEqual([
      { type: 'business', businessId: 'x9', reason: 'BUSINESS_NOT_FOUND', message: 'Este negocio no está disponible en Güira de Melena.' },
    ])
  })
})
