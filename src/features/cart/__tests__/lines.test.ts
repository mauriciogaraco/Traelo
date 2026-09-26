import { canQuickAdd, cheapestPackaging, estimateLine, lineIdOf, packSizeOf, requiresOption } from '../lines';

describe('estimateLine (mismas cifras de la regla del carrito)', () => {
  it('5 unidades a 400 con agrego +100 y envase 150 con capacity 4 → 2800 (2500 + 150 × 2)', () => {
    expect(estimateLine({ price: 400, quantity: 5, addonPrice: 100, packagingPrice: 150, packagingCapacity: 4 })).toBe(2800);
  });

  it('3 unidades a 400 con envase 150 sin capacity → 1650', () => {
    expect(estimateLine({ price: 400, quantity: 3, packagingPrice: 150 })).toBe(1650);
  });

  it('caja de 24 a 30 c/u (precio de la caja 720), cantidad 2 → 1440', () => {
    expect(estimateLine({ price: 720, quantity: 2, formato: 24 })).toBe(1440);
  });

  it('el agrego se cobra por cada unidad de la caja; el envase con capacity cuenta unidades', () => {
    // 2 cajas de 24 a 720 + agrego 10 × 24 por caja = (720 + 240) × 2 ; 48 unidades / capacity 20 → 3 envases de 50
    expect(estimateLine({ price: 720, quantity: 2, formato: 24, addonPrice: 10, packagingPrice: 50, packagingCapacity: 20 })).toBe(
      (720 + 240) * 2 + 50 * 3,
    );
  });

  it('sin precio no revienta (cuenta 0)', () => {
    expect(estimateLine({ price: null, quantity: 3 })).toBe(0);
  });
});

describe('identidad de línea', () => {
  it('sin elecciones es solo el productId (los carritos de antes siguen valiendo)', () => {
    expect(lineIdOf({ productId: 'p1' })).toBe('p1');
  });

  it('producto + tipo + agrego + envase; cambiar cualquiera es otra línea', () => {
    const base = { productId: 'p1', optionName: 'Fresa', addonName: null, packagingName: 'Bolsa' };
    expect(lineIdOf(base)).toBe('p1|Fresa||Bolsa');
    expect(lineIdOf({ ...base, addonName: 'Queso' })).not.toBe(lineIdOf(base));
    expect(lineIdOf({ ...base, packagingName: 'Caja' })).not.toBe(lineIdOf(base));
    expect(lineIdOf({ ...base, optionName: 'Natural' })).not.toBe(lineIdOf(base));
  });
});

describe('reglas de elección', () => {
  it('el tipo es obligatorio solo si el producto tiene; entonces no se agrega con un toque', () => {
    expect(requiresOption({ options: ['A'] })).toBe(true);
    expect(requiresOption({ options: null })).toBe(false);
    expect(canQuickAdd({ options: ['A'] })).toBe(false);
    expect(canQuickAdd({ options: [] })).toBe(true);
  });

  it('el envase más barato viene preseleccionado', () => {
    expect(cheapestPackaging({ packaging: [{ name: 'Grande', price: 150 }, { name: 'Bolsa', price: 20 }] })?.name).toBe('Bolsa');
    expect(cheapestPackaging({ packaging: null })).toBeNull();
  });

  it('unidades por caja: 1 si no hay formato', () => {
    expect(packSizeOf(null)).toBe(1);
    expect(packSizeOf(1)).toBe(1);
    expect(packSizeOf(24)).toBe(24);
  });
});
