import {
  bayesianRating,
  effectiveSort,
  filterBusinesses,
  filterProducts,
  overallRatingMean,
  ratingLabel,
  relevanceScore,
  searchBusinesses,
  searchProducts,
  sortBusinesses,
  sortBusinessesByWeeklyOrders,
  sortProducts,
  sortProductsByWeeklyUnits,
  topIds,
} from '../ranking';
import { makeBusiness, makeProduct } from '../../../testing/fixtures';
import type { CatalogStats } from '../../../types/backend/catalog';

const stats = (overrides: Partial<CatalogStats> = {}): CatalogStats => ({
  windowDays: 60,
  weekWindowDays: 7,
  generatedAt: '2026-09-20T00:00:00Z',
  businesses: {},
  products: {},
  ...overrides,
});

const names = (list: { name: string }[]) => list.map((item) => item.name);

describe('relevanceScore', () => {
  it('idéntico > empieza igual > palabra que empieza igual > contiene > solo con typos', () => {
    expect(relevanceScore('Pizza', 'pizza')).toBe(5);
    expect(relevanceScore('Pizzería M&M', 'pizz')).toBe(4);
    expect(relevanceScore('Iron Bross Pizzas', 'pizz')).toBe(3);
    expect(relevanceScore('Espizzeria', 'pizz')).toBe(2);
    expect(relevanceScore('Pizzería', 'piza')).toBeGreaterThan(0); // typo tolerado
    expect(relevanceScore('Agro los Prietos', 'xyz123')).toBe(0);
  });

  it('ignora mayúsculas y acentos', () => {
    expect(relevanceScore('CAFETERÍA', 'cafe')).toBe(4);
  });
});

describe('searchProducts / searchBusinesses', () => {
  it('sin consulta devuelve todo tal cual', () => {
    const products = [makeProduct({ id: 'a' }), makeProduct({ id: 'b' })];
    expect(searchProducts('   ', products)).toBe(products);
  });

  it('pone primero lo que EMPIEZA con la búsqueda y luego lo que solo la contiene', () => {
    const products = [
      makeProduct({ id: '1', name: 'Combo con pizza' }),
      makeProduct({ id: '2', name: 'Pizza familiar' }),
      makeProduct({ id: '3', name: 'Refresco' }),
    ];
    expect(names(searchProducts('pizza', products))).toEqual(['Pizza familiar', 'Combo con pizza']);
  });

  it('encuentra por categoría, un poco por debajo de una coincidencia por nombre', () => {
    const products = [
      makeProduct({ id: '1', name: 'Croqueta', categoryName: 'Comida' }),
      makeProduct({ id: '2', name: 'Comida casera', categoryName: null }),
    ];
    expect(names(searchProducts('comida', products))).toEqual(['Comida casera', 'Croqueta']);
  });

  it('a igual relevancia respeta el orden original', () => {
    const products = [makeProduct({ id: '1', name: 'Pizza B' }), makeProduct({ id: '2', name: 'Pizza A' })];
    expect(names(searchProducts('pizza', products))).toEqual(['Pizza B', 'Pizza A']);
  });

  it('los negocios también se ordenan por relevancia y aceptan la dirección', () => {
    const businesses = [
      makeBusiness({ id: '1', name: 'Dulcería Central', address: 'Calle Pizza 5' }),
      makeBusiness({ id: '2', name: 'Pizzería M&M', address: 'Calle 1' }),
    ];
    expect(names(searchBusinesses('pizz', businesses))).toEqual(['Pizzería M&M', 'Dulcería Central']);
  });
});

describe('sortProducts', () => {
  const products = [
    makeProduct({ id: 'a', name: 'Arroz', price: 300, effectivePrice: 300 }),
    makeProduct({ id: 'b', name: 'Bistec', price: 900, effectivePrice: 700 }),
    makeProduct({ id: 'c', name: 'Croqueta', price: 100, effectivePrice: 100 }),
    makeProduct({ id: 'd', name: 'Dulce', price: null, effectivePrice: null }),
  ];
  const s = stats({ products: { a: { units: 5, unitsWeek: 5 }, b: { units: 50, unitsWeek: 50 }, c: { units: 50, unitsWeek: 50 } } });

  it('populares: más unidades vendidas primero; empate por nombre; sin ventas al final', () => {
    expect(names(sortProducts(products, 'popular', s))).toEqual(['Bistec', 'Croqueta', 'Arroz', 'Dulce']);
  });

  it('sin estadísticas no inventa popularidad: queda por nombre', () => {
    expect(names(sortProducts(products, 'popular', null))).toEqual(['Arroz', 'Bistec', 'Croqueta', 'Dulce']);
  });

  it('precio: usa el precio efectivo (con oferta) y los sin precio van siempre al final', () => {
    expect(names(sortProducts(products, 'priceAsc', s))).toEqual(['Croqueta', 'Arroz', 'Bistec', 'Dulce']);
    expect(names(sortProducts(products, 'priceDesc', s))).toEqual(['Bistec', 'Arroz', 'Croqueta', 'Dulce']);
  });

  it('relevancia respeta el orden recibido y NUNCA muta la lista original', () => {
    const before = [...products];
    expect(sortProducts(products, 'relevance', s)).toEqual(before);
    sortProducts(products, 'popular', s);
    expect(products).toEqual(before);
  });

  it('ofertas recientes: más reciente primero; sin oferta (o sin startsAt) siempre al final', () => {
    const withOffers = [
      makeProduct({ id: 'a', name: 'Arroz', offer: { id: 'o1', price: 250, startsAt: '2026-09-01T00:00:00Z', endsAt: '2027-01-01T00:00:00Z' } }),
      makeProduct({ id: 'b', name: 'Bistec', offer: { id: 'o2', price: 700, startsAt: '2026-09-15T00:00:00Z', endsAt: '2027-01-01T00:00:00Z' } }),
      makeProduct({ id: 'c', name: 'Croqueta', offer: null }),
      makeProduct({ id: 'd', name: 'Dulce', offer: { id: 'o3', price: 50, endsAt: '2027-01-01T00:00:00Z' } }), // sin startsAt (catálogo cacheado viejo)
    ];
    expect(names(sortProducts(withOffers, 'recentOffers', s))).toEqual(['Bistec', 'Arroz', 'Croqueta', 'Dulce']);
  });
});

describe('calificación (bayesiana)', () => {
  it('con pocas reseñas tira hacia el promedio general; con muchas manda la media real', () => {
    expect(bayesianRating(5, 1, 4)).toBeLessThan(4.3);
    expect(bayesianRating(4.8, 200, 4)).toBeGreaterThan(4.75);
    expect(bayesianRating(4.8, 60, 4)).toBeGreaterThan(bayesianRating(5, 1, 4));
  });

  it('sin reseñas devuelve el promedio general', () => {
    expect(bayesianRating(0, 0, 4.2)).toBe(4.2);
  });

  it('overallRatingMean pondera por cantidad de reseñas y tiene valor por defecto', () => {
    expect(overallRatingMean(null)).toBe(4);
    expect(overallRatingMean(stats())).toBe(4);
    const s = stats({
      businesses: {
        a: { orders: 0, ordersWeek: 0, ratingAverage: 5, ratingCount: 1 },
        b: { orders: 0, ordersWeek: 0, ratingAverage: 3, ratingCount: 3 },
        c: { orders: 9, ordersWeek: 9, ratingAverage: null, ratingCount: 0 },
      },
    });
    expect(overallRatingMean(s)).toBe(3.5); // (5·1 + 3·3) / 4
  });
});

describe('sortBusinesses', () => {
  const businesses = [
    makeBusiness({ id: 'solo1', name: 'Una reseña' }),
    makeBusiness({ id: 'solid', name: 'Muy valorado' }),
    makeBusiness({ id: 'nuevo', name: 'Nuevo' }),
    makeBusiness({ id: 'popular', name: 'Popular sin reseñas' }),
  ];
  const s = stats({
    businesses: {
      solo1: { orders: 1, ordersWeek: 1, ratingAverage: 5, ratingCount: 1 },
      solid: { orders: 30, ordersWeek: 30, ratingAverage: 4.8, ratingCount: 60 },
      popular: { orders: 120, ordersWeek: 120, ratingAverage: null, ratingCount: 0 },
      // Un negocio que no está en la lista pero tira el promedio general hacia abajo (~4.1).
      mid: { orders: 5, ordersWeek: 5, ratingAverage: 3, ratingCount: 40 },
    },
  });

  it('populares: más pedidos recientes primero', () => {
    expect(names(sortBusinesses(businesses, 'popular', s))).toEqual([
      'Popular sin reseñas',
      'Muy valorado',
      'Una reseña',
      'Nuevo',
    ]);
  });

  it('mejor valorados: 4.8 con 60 reseñas le gana a 5.0 con UNA reseña', () => {
    expect(names(sortBusinesses(businesses, 'rating', s)).slice(0, 2)).toEqual(['Muy valorado', 'Una reseña']);
  });

  it('los negocios sin reseñas van después de todos los que sí tienen, ordenados por popularidad', () => {
    expect(names(sortBusinesses(businesses, 'rating', s))).toEqual([
      'Muy valorado',
      'Una reseña',
      'Popular sin reseñas',
      'Nuevo',
    ]);
  });

  it('sin estadísticas no rompe: queda por nombre', () => {
    expect(names(sortBusinesses(businesses, 'rating', null))).toEqual([
      'Muy valorado',
      'Nuevo',
      'Popular sin reseñas',
      'Una reseña',
    ]);
  });

  it('a igual puntaje desempata por cantidad de reseñas', () => {
    const tie = [makeBusiness({ id: 'x', name: 'X' }), makeBusiness({ id: 'y', name: 'Y' })];
    const sameAvg = stats({
      businesses: {
        x: { orders: 0, ordersWeek: 0, ratingAverage: 4, ratingCount: 4 },
        y: { orders: 0, ordersWeek: 0, ratingAverage: 4, ratingCount: 20 },
      },
    });
    expect(names(sortBusinesses(tie, 'rating', sameAvg))).toEqual(['Y', 'X']);
  });

  it('recientes: más nuevo (mayor joinedAt) primero; sin joinedAt (catálogo cacheado viejo) siempre al final', () => {
    const withJoinedAt = [
      makeBusiness({ id: 'a', name: 'Antiguo', joinedAt: '2024-01-01T00:00:00Z' }),
      makeBusiness({ id: 'b', name: 'Nuevo', joinedAt: '2026-08-01T00:00:00Z' }),
      makeBusiness({ id: 'c', name: 'Sin fecha' }),
    ];
    expect(names(sortBusinesses(withJoinedAt, 'recent', s))).toEqual(['Nuevo', 'Antiguo', 'Sin fecha']);
  });
});

describe('ranking semanal (Home: "Top Negocios" / "Productos top")', () => {
  it('sortBusinessesByWeeklyOrders ignora la popularidad general (60 días) y ordena por la de la semana', () => {
    const businesses = [
      makeBusiness({ id: 'a', name: 'A' }),
      makeBusiness({ id: 'b', name: 'B' }),
    ];
    // "a" es más popular en general (60 días) pero "b" tuvo más pedidos ESTA semana.
    const s = stats({
      businesses: {
        a: { orders: 500, ordersWeek: 1, ratingAverage: null, ratingCount: 0 },
        b: { orders: 10, ordersWeek: 40, ratingAverage: null, ratingCount: 0 },
      },
    });
    expect(names(sortBusinessesByWeeklyOrders(businesses, s))).toEqual(['B', 'A']);
  });

  it('sortProductsByWeeklyUnits ignora las unidades generales (60 días) y ordena por las de la semana', () => {
    const products = [makeProduct({ id: 'a', name: 'A' }), makeProduct({ id: 'b', name: 'B' })];
    const s = stats({
      products: {
        a: { units: 900, unitsWeek: 2 },
        b: { units: 20, unitsWeek: 80 },
      },
    });
    expect(names(sortProductsByWeeklyUnits(products, s))).toEqual(['B', 'A']);
  });

  it('sin estadísticas de la semana no inventa popularidad: queda por nombre', () => {
    const businesses = [makeBusiness({ id: 'z', name: 'Z' }), makeBusiness({ id: 'a', name: 'A' })];
    expect(names(sortBusinessesByWeeklyOrders(businesses, null))).toEqual(['A', 'Z']);

    const products = [makeProduct({ id: 'z', name: 'Z' }), makeProduct({ id: 'a', name: 'A' })];
    expect(names(sortProductsByWeeklyUnits(products, null))).toEqual(['A', 'Z']);
  });
});

describe('filtros', () => {
  it('productos por categoría y solo con oferta', () => {
    const products = [
      makeProduct({ id: '1', categoryId: 'c1', offer: null }),
      makeProduct({ id: '2', categoryId: 'c1', offer: { id: 'o', price: 1, endsAt: '' } }),
      makeProduct({ id: '3', categoryId: 'c2', offer: { id: 'o2', price: 1, endsAt: '' } }),
    ];
    expect(filterProducts(products, { categoryId: null, onlyOffers: false })).toHaveLength(3);
    expect(filterProducts(products, { categoryId: 'c1', onlyOffers: false }).map((p) => p.id)).toEqual(['1', '2']);
    expect(filterProducts(products, { categoryId: 'c1', onlyOffers: true }).map((p) => p.id)).toEqual(['2']);
  });

  it('negocios abiertos ahora: abiertos Y aceptando pedidos', () => {
    const businesses = [
      makeBusiness({ id: '1', isOpenNow: true, acceptingOrders: true }),
      makeBusiness({ id: '2', isOpenNow: true, acceptingOrders: false }),
      makeBusiness({ id: '3', isOpenNow: false, acceptingOrders: true }),
    ];
    expect(filterBusinesses(businesses, { onlyOpen: false })).toHaveLength(3);
    expect(filterBusinesses(businesses, { onlyOpen: true }).map((b) => b.id)).toEqual(['1']);
  });
});

describe('effectiveSort', () => {
  it('automático: relevancia con búsqueda, popularidad sin ella', () => {
    expect(effectiveSort('auto', true)).toBe('relevance');
    expect(effectiveSort('auto', false)).toBe('popular');
  });

  it('"relevancia" sin texto cae a popularidad; lo demás se respeta', () => {
    expect(effectiveSort('relevance', false)).toBe('popular');
    expect(effectiveSort('relevance', true)).toBe('relevance');
    expect(effectiveSort('popular', true)).toBe('popular');
  });
});

describe('insignias y etiquetas', () => {
  it('topIds toma los primeros N con métrica mayor a 0 (sin insignia para lo que no vendió nada)', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
    const metric = (item: { id: string }) => ({ a: 9, b: 4, c: 0, d: 0 })[item.id] ?? 0;
    expect([...topIds(items, metric, 3)]).toEqual(['a', 'b']);
    expect([...topIds(items, metric, 1)]).toEqual(['a']);
  });

  it('ratingLabel: "4.7 (32)" o null si no tiene reseñas', () => {
    expect(ratingLabel({ orders: 1, ordersWeek: 1, ratingAverage: 4.666, ratingCount: 32 })).toBe('4.7 (32)');
    expect(ratingLabel({ orders: 1, ordersWeek: 1, ratingAverage: null, ratingCount: 0 })).toBeNull();
    expect(ratingLabel(undefined)).toBeNull();
  });
});
