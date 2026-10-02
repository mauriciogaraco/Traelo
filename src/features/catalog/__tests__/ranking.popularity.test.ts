import { productPopularitySource, sortProducts } from '../ranking';
import { makeProduct } from '../../../testing/fixtures';
import type { CatalogStats } from '../../../types/backend/catalog';

const stats = (overrides: Partial<CatalogStats> = {}): CatalogStats => ({
  windowDays: 60,
  weekWindowDays: 7,
  generatedAt: '2026-09-20T00:00:00Z',
  businesses: {},
  products: {},
  ...overrides,
});

const products = [
  makeProduct({ id: 'a', businessId: 'quiet', name: 'Arroz' }),
  makeProduct({ id: 'b', businessId: 'busy', name: 'Bistec' }),
  makeProduct({ id: 'c', businessId: 'busy', name: 'Croqueta' }),
];

describe('popularidad de productos cuando faltan ventas por producto', () => {
  const onlyBusinesses = stats({
    businesses: { busy: { orders: 300, ordersWeek: 300, ratingAverage: null, ratingCount: 0 }, quiet: { orders: 2, ordersWeek: 2, ratingAverage: null, ratingCount: 0 } },
  });

  it('a igual cantidad de unidades vendidas (0), primero los productos de negocios con más pedidos, luego por nombre', () => {
    expect(sortProducts(products, 'popular', onlyBusinesses).map((p) => p.name)).toEqual(['Bistec', 'Croqueta', 'Arroz']);
  });

  it('las unidades vendidas siguen mandando sobre la popularidad del negocio', () => {
    const withUnits = stats({ ...onlyBusinesses, products: { a: { units: 10, unitsWeek: 10 } } });
    expect(sortProducts(products, 'popular', withUnits).map((p) => p.name)).toEqual(['Arroz', 'Bistec', 'Croqueta']);
  });

  it('productPopularitySource distingue de dónde sale el orden', () => {
    expect(productPopularitySource(products, stats({ products: { a: { units: 1, unitsWeek: 1 } } }))).toBe('units');
    expect(productPopularitySource(products, onlyBusinesses)).toBe('business');
    expect(productPopularitySource(products, stats())).toBe('none');
    expect(productPopularitySource(products, null)).toBe('none');
  });
});
