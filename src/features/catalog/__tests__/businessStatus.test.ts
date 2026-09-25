import { getBusinessStatus } from '../businessStatus';

describe('getBusinessStatus', () => {
  it('NO ACEPTA PEDIDOS tiene prioridad sobre el horario', () => {
    expect(getBusinessStatus({ acceptingOrders: false, isOpenNow: true }).label).toBe('NO ACEPTA PEDIDOS');
  });

  it('ABIERTO cuando acepta pedidos y el backend dice que está abierto', () => {
    expect(getBusinessStatus({ acceptingOrders: true, isOpenNow: true }).label).toBe('ABIERTO');
  });

  it('CERRADO cuando acepta pedidos pero el backend dice que está cerrado', () => {
    expect(getBusinessStatus({ acceptingOrders: true, isOpenNow: false }).label).toBe('CERRADO');
  });
});
