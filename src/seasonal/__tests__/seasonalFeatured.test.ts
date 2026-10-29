import type { CatalogProduct, CatalogStats } from '../../types/backend/catalog'
import { pickSeasonProducts } from '../seasonalFeatured'

const product = (id: string, name: string, extra: Partial<CatalogProduct> = {}): CatalogProduct =>
  ({ id, name, businessId: 'otro', categoryId: null, available: true, ...extra }) as CatalogProduct

const cronos = (id: string, name: string, extra: Partial<CatalogProduct> = {}) => product(id, name, { businessId: 'cronos-id', ...extra })
const sweet = (id: string, name: string, extra: Partial<CatalogProduct> = {}) => product(id, name, { categoryId: 'cat-dulces', ...extra })

const selection = { businessId: 'cronos-id', categoryIds: new Set(['cat-dulces', 'cat-confituras']) }

const statsWith = (units: Record<string, number>): CatalogStats =>
  ({ products: Object.fromEntries(Object.entries(units).map(([id, unitsWeek]) => [id, { unitsWeek }])), businesses: {} }) as unknown as CatalogStats

const ids = (list: CatalogProduct[]) => list.map((p) => p.id)

describe('pickSeasonProducts', () => {
  it('ofrece los productos del negocio destacado y los de dulces, y nada más', () => {
    const list = [cronos('c1', 'Batido'), sweet('d1', 'Brownie'), product('x', 'Pizza'), sweet('d2', 'Galleta', { categoryId: 'cat-confituras' })]
    expect(ids(pickSeasonProducts(list, selection, null))).toEqual(['c1', 'd1', 'd2'])
  })

  it('deja fuera los agotados, pero un catálogo sin el campo `available` cuenta como disponible', () => {
    const list = [cronos('c1', 'Batido', { available: false }), sweet('d1', 'Brownie', { available: false }), cronos('c2', 'Café'), sweet('d2', 'Flan', { available: undefined })]
    expect(ids(pickSeasonProducts(list, selection, null))).toEqual(['c2', 'd2'])
  })

  it('mezcla alternando negocio y dulces, con los más pedidos de cada grupo primero', () => {
    const list = [cronos('c1', 'A'), cronos('c2', 'B'), cronos('c3', 'C'), sweet('d1', 'D'), sweet('d2', 'E')]
    const stats = statsWith({ c3: 9, d2: 4 })
    expect(ids(pickSeasonProducts(list, selection, stats))).toEqual(['c3', 'd2', 'c1', 'd1', 'c2'])
  })

  it('si un grupo se acaba, el otro llena el resto', () => {
    const list = [cronos('c1', 'A'), sweet('d1', 'B'), sweet('d2', 'C'), sweet('d3', 'D')]
    expect(ids(pickSeasonProducts(list, selection, null))).toEqual(['c1', 'd1', 'd2', 'd3'])
  })

  it('un producto del negocio que también es de dulces no sale dos veces', () => {
    const list = [cronos('c1', 'Batido', { categoryId: 'cat-dulces' }), sweet('d1', 'Brownie')]
    expect(ids(pickSeasonProducts(list, selection, null))).toEqual(['c1', 'd1'])
  })

  it('sin el negocio destacado en la localidad, solo salen los dulces', () => {
    const list = [cronos('c1', 'Batido'), sweet('d1', 'Brownie')]
    expect(ids(pickSeasonProducts(list, { ...selection, businessId: null }, null))).toEqual(['d1'])
  })

  it('respeta el límite y no modifica la lista recibida', () => {
    const list = [cronos('c1', 'A'), cronos('c2', 'B'), sweet('d1', 'C'), sweet('d2', 'D')]
    expect(pickSeasonProducts(list, selection, null, 3)).toHaveLength(3)
    expect(ids(list)).toEqual(['c1', 'c2', 'd1', 'd2'])
  })

  it('sin nada que ofrecer → lista vacía', () => {
    expect(pickSeasonProducts([], selection, null)).toEqual([])
  })
})
