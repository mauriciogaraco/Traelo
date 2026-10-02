import { fuzzyIncludes, searchCatalog } from '../search';
import { makeBusiness, makeCategory, makeProduct } from '../../../testing/fixtures';

describe('fuzzyIncludes', () => {
  it.each([
    ['Pizzería M&M', 'pizza'],
    ['Pizzería M&M', 'pizz'],
    ['Pizzería M&M', 'piza'],
    ['Cafetería D Leo', 'cafe'],
    ['Iron Bross Pizzas Fitness', 'piza'],
  ])('encuentra "%s" con "%s"', (text, query) => {
    expect(fuzzyIncludes(text, query)).toBe(true);
  });

  it('ignora mayúsculas y acentos', () => {
    expect(fuzzyIncludes('CAFETERÍA', 'cafeteria')).toBe(true);
    expect(fuzzyIncludes('Dulcería', 'DULCERIA')).toBe(true);
  });

  it('no inventa coincidencias', () => {
    expect(fuzzyIncludes('Agro los Prietos', 'xyz123')).toBe(false);
  });

  it('una búsqueda vacía coincide con todo', () => {
    expect(fuzzyIncludes('Cualquier cosa', '   ')).toBe(true);
  });
});

describe('searchCatalog', () => {
  const source = {
    categories: [makeCategory({ name: 'Bebidas' })],
    businesses: [makeBusiness({ id: 'b1', name: 'Pizzería M&M' }), makeBusiness({ id: 'b2', name: 'Agro los Prietos' })],
    products: [makeProduct({ id: 'p1', name: 'Pizza familiar' }), makeProduct({ id: 'p2', name: 'Refresco' })],
  };

  it('devuelve vacío sin texto', () => {
    expect(searchCatalog('  ', source)).toEqual({ categories: [], businesses: [], products: [] });
  });

  it('agrupa negocios y productos tolerando errores de tipeo', () => {
    const result = searchCatalog('piza', source);
    expect(result.businesses.map((b) => b.id)).toEqual(['b1']);
    expect(result.products.map((p) => p.id)).toEqual(['p1']);
  });

  it('encuentra categorías', () => {
    expect(searchCatalog('bebid', source).categories).toHaveLength(1);
  });
});
