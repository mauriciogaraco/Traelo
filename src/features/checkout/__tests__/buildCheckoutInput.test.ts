import { buildCheckoutInput } from '../buildCheckoutInput';
import type { CartItem } from '../../../store/cartStore';

const item = (overrides: Partial<CartItem>): CartItem => ({
  productId: 'p1',
  businessId: 'b1',
  quantity: 2,
  nameSnapshot: 'Pizza',
  priceSnapshot: 500,
  imageUrlSnapshot: null,
  ...overrides,
});

describe('buildCheckoutInput', () => {
  it('agrupa los productos por negocio', () => {
    const input = buildCheckoutInput({
      items: [item({ productId: 'p1', businessId: 'b1' }), item({ productId: 'p2', businessId: 'b2' }), item({ productId: 'p3', businessId: 'b1' })],
      clientRequestId: 'req-12345678',
      address: 'Calle 23',
    });
    expect(input.businesses).toHaveLength(2);
    expect(input.businesses.find((b) => b.businessId === 'b1')?.items.map((i) => i.productId)).toEqual(['p1', 'p3']);
  });

  it('manda expectedPrice solo para detectar carritos desactualizados', () => {
    const input = buildCheckoutInput({ items: [item({ priceSnapshot: 275 })], clientRequestId: 'req-12345678', address: 'x' });
    expect(input.businesses[0].items[0]).toEqual({ productId: 'p1', quantity: 2, expectedPrice: 275 });
  });

  it('manda packagingName cuando el ítem tiene empaque elegido, nunca su costo', () => {
    const input = buildCheckoutInput({
      items: [item({ packagingName: 'Caja grande' })],
      clientRequestId: 'req-12345678',
      address: 'x',
    });
    expect(input.businesses[0].items[0].packagingName).toBe('Caja grande');
    expect(JSON.stringify(input)).not.toMatch(/packagingFee/);
  });

  it('sin empaque elegido, packagingName no viaja en el JSON', () => {
    const input = buildCheckoutInput({ items: [item({})], clientRequestId: 'req-12345678', address: 'x' });
    expect(input.businesses[0].items[0].packagingName).toBeUndefined();
    expect(JSON.stringify(input)).not.toMatch(/packagingName/);
  });

  it('NUNCA envía dinero como autoridad (checklist §24)', () => {
    const input = buildCheckoutInput({ items: [item({})], clientRequestId: 'req-12345678', address: 'x' }) as Record<string, unknown>;
    for (const forbidden of ['total', 'commission', 'deliveryFee', 'deliveryShare', 'platformFee', 'unitPrice']) {
      expect(input).not.toHaveProperty(forbidden);
    }
    expect(JSON.stringify(input)).not.toMatch(/unitPrice|platformFee|deliveryFee/);
  });

  it('NUNCA envía customerId: la identidad sale del token, no del body', () => {
    const input = buildCheckoutInput({
      items: [item({})],
      clientRequestId: 'req-12345678',
      address: 'x',
      // Aunque alguien lo colara por tipos, no debe aparecer en el request.
      ...({ customerId: 'c1' } as object),
    });
    expect(input).not.toHaveProperty('customerId');
    expect(JSON.stringify(input)).not.toMatch(/customerId/);
  });

  it('conserva el clientRequestId (idempotencia)', () => {
    const input = buildCheckoutInput({ items: [item({})], clientRequestId: 'req-abcdefgh', address: 'x' });
    expect(input.clientRequestId).toBe('req-abcdefgh');
  });

  it('como invitado manda nombre, teléfono, dirección y referencia', () => {
    const input = buildCheckoutInput({
      items: [item({})],
      clientRequestId: 'req-12345678',
      address: 'Calle 23',
      addressReference: 'Portón azul',
      customerName: 'Ana',
      customerPhone: '555',
    });
    expect(input).toMatchObject({
      customerName: 'Ana',
      customerPhone: '555',
      address: 'Calle 23',
      addressReference: 'Portón azul',
    });
  });

  it('con addressId no manda el texto de la dirección', () => {
    const input = buildCheckoutInput({ items: [item({})], clientRequestId: 'req-12345678', addressId: 'a1', address: 'ignorada' });
    expect(input.addressId).toBe('a1');
    expect(input.address).toBeUndefined();
  });

  describe('ubicación (pin) opcional', () => {
    const base = { items: [item({})], clientRequestId: 'req-12345678', address: 'Calle 23' };

    it('sin pin el body no lleva ninguna ubicación (no viaja ni en el JSON)', () => {
      const input = buildCheckoutInput(base);
      expect(input.location).toBeUndefined();
      expect(JSON.stringify(input)).not.toMatch(/location|latitude|longitude/);
    });

    it('con pin manda solo lo necesario: coordenadas, precisión y origen', () => {
      const location = { latitude: 22.7958, longitude: -82.5065, accuracy: null, source: 'MANUAL_PIN' as const };
      const input = buildCheckoutInput({ ...base, location });
      expect(input.location).toEqual(location);
    });

    it('location null viaja como null: "sin ubicación en este pedido" es una decisión explícita', () => {
      const input = buildCheckoutInput({ ...base, addressId: 'a1', location: null });
      expect(input.location).toBeNull();
      expect(JSON.parse(JSON.stringify(input))).toHaveProperty('location', null);
    });
  });
});
