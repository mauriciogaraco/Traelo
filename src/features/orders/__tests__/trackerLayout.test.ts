import { stepCenter, travelDuration } from '../trackerLayout';

describe('stepCenter', () => {
  it('reparte el ancho en columnas iguales y devuelve el centro de cada una', () => {
    // 5 pasos en 500 px → columnas de 100 px
    expect([0, 1, 2, 3, 4].map((i) => stepCenter(i, 5, 500))).toEqual([50, 150, 250, 350, 450]);
  });

  it('sin ancho medido todavía (0) o sin pasos devuelve 0, sin lanzar', () => {
    expect(stepCenter(2, 5, 0)).toBe(0);
    expect(stepCenter(0, 0, 300)).toBe(0);
  });

  it('un índice fuera de rango se ajusta al primero o al último paso', () => {
    expect(stepCenter(-3, 5, 500)).toBe(50);
    expect(stepCenter(99, 5, 500)).toBe(450);
  });
});

describe('travelDuration', () => {
  it('cruzar más pasos tarda más, con un tope para que nunca sea eterno', () => {
    expect(travelDuration(0, 1)).toBeLessThan(travelDuration(0, 4));
    expect(travelDuration(0, 100)).toBeLessThanOrEqual(2200);
  });

  it('el sentido no importa', () => {
    expect(travelDuration(3, 1)).toBe(travelDuration(1, 3));
  });
});
