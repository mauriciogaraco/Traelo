import type { CatalogProduct, CatalogStats } from '../../types/backend/catalog'
import { pickFeaturedProducts } from '../seasonalFeatured'

const product = (id: string, name: string, extra: Partial<CatalogProduct> = {}): CatalogProduct =>
  ({ id, name, businessId: 'cronos-id', available: true, ...extra }) as CatalogProduct

const statsWith = (units: Record<string, number>): CatalogStats =>
  ({ products: Object.fromEntries(Object.entries(units).map(([id, unitsWeek]) => [id, { unitsWeek }])), businesses: {} }) as unknown as CatalogStats

describe('pickFeaturedProducts', () => {
  it('solo ofrece productos del negocio destacado', () => {
    const list = [product('a', 'Batido'), product('b', 'Pizza', { businessId: 'otro' })]
    expect(pickFeaturedProducts(list, 'cronos-id', null).map((p) => p.id)).toEqual(['a'])
  })

  it('deja fuera los agotados, pero un catálogo sin el campo `available` cuenta como disponible', () => {
    const list = [product('a', 'Batido', { available: false }), product('b', 'Café'), product('c', 'Frappé', { available: undefined })]
    expect(pickFeaturedProducts(list, 'cronos-id', null).map((p) => p.id)).toEqual(['b', 'c'])
  })

  it('pone primero los más pedidos de la semana y desempata por nombre', () => {
    const list = [product('a', 'Zumo'), product('b', 'Batido'), product('c', 'Café')]
    const stats = statsWith({ a: 5, b: 1, c: 1 })
    expect(pickFeaturedProducts(list, 'cronos-id', stats).map((p) => p.id)).toEqual(['a', 'b', 'c'])
  })

  it('respeta el límite y no modifica la lista recibida', () => {
    const list = [product('a', 'A'), product('b', 'B'), product('c', 'C')]
    expect(pickFeaturedProducts(list, 'cronos-id', null, 2)).toHaveLength(2)
    expect(list.map((p) => p.id)).toEqual(['a', 'b', 'c'])
  })

  it('negocio sin productos → lista vacía', () => {
    expect(pickFeaturedProducts([], 'cronos-id', null)).toEqual([])
  })
})
