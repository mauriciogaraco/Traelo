import { makeBusiness } from '../../../testing/fixtures'
import { businessPath, businessSlugs, findBusinessByParam, slugify } from '../businessSlug'

describe('slugify', () => {
  it('quita tildes, símbolos y espacios', () => {
    expect(slugify('La Marina')).toBe('la-marina')
    expect(slugify('Heladería M&K')).toBe('heladeria-m-k')
    expect(slugify('Atrévete')).toBe('atrevete')
  })

  it('descarta lo que va tras un guion ("La Pino - Tienda de Alimentos")', () => {
    expect(slugify('La Pino - Tienda de Alimentos')).toBe('la-pino')
  })

  it('nunca devuelve vacío', () => {
    expect(slugify('***')).toBe('negocio')
  })
})

describe('businessSlugs / businessPath', () => {
  const list = [
    makeBusiness({ id: 'cb', name: 'La Marina' }),
    makeBusiness({ id: 'ca', name: 'La Marina' }),
    makeBusiness({ id: 'cc', name: 'Cronos' }),
  ]

  it('con nombres repetidos, el de id menor se queda con el slug limpio (estable)', () => {
    const slugs = businessSlugs(list)
    expect(slugs.get('ca')).toBe('la-marina')
    expect(slugs.get('cb')).toBe('la-marina-2')
    expect(slugs.get('cc')).toBe('cronos')
  })

  it('arma la ruta corta, y usa el id si el negocio aún no está en el catálogo', () => {
    expect(businessPath('cc', list)).toBe('/negocio/cronos')
    expect(businessPath('desconocido', list)).toBe('/negocio/desconocido')
  })
})

describe('findBusinessByParam', () => {
  const list = [makeBusiness({ id: 'cmsw1frzv000h1gjre7l07ygd', name: 'La Marina' })]

  it('encuentra por id (enlaces viejos) y por slug (enlaces cortos, sin importar mayúsculas)', () => {
    expect(findBusinessByParam('cmsw1frzv000h1gjre7l07ygd', list)?.name).toBe('La Marina')
    expect(findBusinessByParam('la-marina', list)?.name).toBe('La Marina')
    expect(findBusinessByParam('La-Marina', list)?.name).toBe('La Marina')
  })

  it('devuelve undefined si no existe', () => {
    expect(findBusinessByParam('otro', list)).toBeUndefined()
  })
})
