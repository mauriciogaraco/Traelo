import { getOrderStatusLabel, isOrderActive, normalizeOrderStatus } from '../orderStatus';
import type { OrderStatus } from '../../../types/backend/order';

describe('normalizeOrderStatus', () => {
  it.each(['CONFIRMED', 'HEADING_OUT', 'PICKING_UP', 'ON_THE_WAY'])(
    'la sub-fase %s del mensajero se ve como ASSIGNED, guardando la sub-fase real (y conserva el resto del pedido)',
    (status) => {
      const order = { id: 'o1', status, pickingUpAt: '2026-09-25T10:00:00Z' };
      expect(normalizeOrderStatus(order)).toEqual({ id: 'o1', status: 'ASSIGNED', substatus: status, pickingUpAt: '2026-09-25T10:00:00Z' });
    },
  );

  it.each(['PENDING', 'ASSIGNED', 'COMPLETED', 'CANCELLED', 'ALGO_NUEVO'])('%s se deja tal cual', (status) => {
    const order = { status };
    expect(normalizeOrderStatus(order)).toBe(order);
  });

  it('un pedido con sub-fase sigue "activo" y con etiqueta legible', () => {
    const { status } = normalizeOrderStatus({ status: 'ON_THE_WAY' });
    expect(isOrderActive(status as OrderStatus)).toBe(true);
    expect(getOrderStatusLabel(status as OrderStatus)).toBe('Mensajero asignado');
  });
});

describe('getOrderStatusLabel — estado desconocido', () => {
  it('nunca devuelve undefined (antes rompía la pantalla del pedido con .toUpperCase())', () => {
    expect(getOrderStatusLabel('ALGO_NUEVO' as OrderStatus)).toBe('Pedido en curso');
  });
});
