import { getCartItemCount, getCartSubtotalEstimate } from '../cartTotals';
import { groupCartByBusiness } from '../groupByBusiness';
import { makeBusiness } from '../../../testing/fixtures';
import type { CartItem } from '../../../store/cartStore';

const item = (overrides: Partial<CartItem>): CartItem => ({
  productId: 'p1',
  businessId: 'b1',
  quantity: 1,
  nameSnapshot: 'Pizza',
  priceSnapshot: 100,
  imageUrlSnapshot: null,
  ...overrides,
});

describe('cartTotals', () => {
  it('cuenta unidades, no líneas', () => {
    expect(getCartItemCount([item({ quantity: 2 }), item({ productId: 'p2', quantity: 3 })])).toBe(5);
  });

  it('suma el estimado con precio × cantidad', () => {
    expect(getCartSubtotalEstimate([item({ quantity: 2, priceSnapshot: 100 }), item({ productId: 'p2', priceSnapshot: 50 })])).toBe(250);
  });

  it('un producto sin precio no rompe el estimado', () => {
    expect(getCartSubtotalEstimate([item({ priceSnapshot: null })])).toBe(0);
  });
});

describe('groupCartByBusiness', () => {
  it('nunca mezcla productos de negocios distintos (checklist §22)', () => {
    const groups = groupCartByBusiness(
      [item({ productId: 'p1', businessId: 'b1' }), item({ productId: 'p2', businessId: 'b2' }), item({ productId: 'p3', businessId: 'b1' })],
      [makeBusiness({ id: 'b1', name: 'A' }), makeBusiness({ id: 'b2', name: 'B' })],
    );
    expect(groups).toHaveLength(2);
    expect(groups.find((g) => g.businessId === 'b1')?.items.map((i) => i.productId)).toEqual(['p1', 'p3']);
    expect(groups.find((g) => g.businessId === 'b2')?.business?.name).toBe('B');
  });

  it('calcula el subtotal estimado por grupo', () => {
    const [group] = groupCartByBusiness([item({ quantity: 2, priceSnapshot: 100 })], [makeBusiness({ id: 'b1' })]);
    expect(group.subtotalEstimate).toBe(200);
  });

  it('tolera un negocio que ya no está en el catálogo', () => {
    const [group] = groupCartByBusiness([item({ businessId: 'gone' })], []);
    expect(group.business).toBeUndefined();
    expect(group.items).toHaveLength(1);
  });
});
