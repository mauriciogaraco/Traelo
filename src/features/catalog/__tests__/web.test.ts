import { findBusinessByLegacyId, findProductByLegacyId, isBackendId } from '../legacyLinks'
import { GENERIC_CATEGORY_VISUAL, visualForCategory, visualForProduct } from '../categoryVisual'
import { optimizedImageUrl } from '../../../lib/images'
import { makeBusiness, makeCategory, makeProduct } from '../../../testing/fixtures'

describe('visualForCategory (misma regla que mobile, con emoji)', () => {
  it('reconoce las categorías definitivas por slug', () => {
    expect(visualForCategory({ slug: 'pizzas-y-mas', name: 'Pizzas y más' })).toEqual({ emoji: '🍕', accent: '#EF4444' })
  })

  it('reconoce categorías nuevas por palabras del nombre, sin tildes', () => {
    expect(visualForCategory({ slug: 'carnicos', name: 'cárnicos' }).emoji).toBe('🥩')
    expect(visualForCategory({ slug: 'pizzas', name: 'pizzas ' }).emoji).toBe('🍕')
  })

  it('cae al genérico si no reconoce nada', () => {
    expect(visualForCategory({ slug: 'xyz', name: 'Varios' })).toBe(GENERIC_CATEGORY_VISUAL)
    expect(visualForCategory(null)).toBe(GENERIC_CATEGORY_VISUAL)
  })

  it('un producto usa la de su categoría del catálogo, o la de su nombre de categoría', () => {
    const categories = [makeCategory({ id: 'c1', slug: 'helados', name: 'Helados' })]
    expect(visualForProduct(makeProduct({ categoryId: 'c1' }), categories).emoji).toBe('🍦')
    expect(visualForProduct(makeProduct({ categoryId: null, categoryName: 'Bebidas' }), categories).emoji).toBe('🥤')
  })
})

describe('enlaces viejos de la web', () => {
  it('un producto viejo se encuentra por externalId', () => {
    const products = [makeProduct({ id: 'cabc', externalId: 'cr-014' }), makeProduct({ id: 'cdef', externalId: null })]
    expect(findProductByLegacyId('cr-014', products)?.id).toBe('cabc')
    expect(findProductByLegacyId('cr-999', products)).toBeUndefined()
  })

  it('un negocio viejo se encuentra por nombre, tolerando tildes, mayúsculas y lo que va tras un guion', () => {
    const businesses = [
      makeBusiness({ id: 'b1', name: 'Cronos' }),
      makeBusiness({ id: 'b2', name: 'La pino' }),
      makeBusiness({ id: 'b3', name: 'Atrevete' }),
    ]
    expect(findBusinessByLegacyId('cronos', businesses)?.id).toBe('b1')
    // En el catálogo viejo: "La Pino - Tienda de Alimentos" y "Atrévete".
    expect(findBusinessByLegacyId('la-pino', businesses)?.id).toBe('b2')
    expect(findBusinessByLegacyId('atrevete', businesses)?.id).toBe('b3')
    expect(findBusinessByLegacyId('no-existe', businesses)).toBeUndefined()
  })

  it('distingue ids del backend (cuid) de los viejos', () => {
    expect(isBackendId('cmuggvvhd000x1geywrqtp7zx')).toBe(true)
    expect(isBackendId('cr-014')).toBe(false)
    expect(isBackendId('cronos')).toBe(false)
  })
})

describe('optimizedImageUrl', () => {
  it('pide a Cloudinary la foto redimensionada y en el mejor formato', () => {
    expect(optimizedImageUrl('https://res.cloudinary.com/demo/image/upload/v1/p/a.jpg?v=1', 180)).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_180/v1/p/a.jpg?v=1',
    )
  })

  it('deja igual las demás URLs y null', () => {
    expect(optimizedImageUrl('/assets/categories/bebidas.webp', 56)).toBe('/assets/categories/bebidas.webp')
    expect(optimizedImageUrl(null, 56)).toBeNull()
  })
})
