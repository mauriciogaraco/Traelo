import { clampRating, formatRating, positionToRating, ratingToStarFills, roundRating } from '../rating';

describe('ratingToStarFills (relleno fraccionario)', () => {
  it('4.7 → cuatro estrellas llenas y una al 70 %', () => {
    expect(ratingToStarFills(4.7)).toEqual([1, 1, 1, 1, 0.7]);
  });

  it('valores enteros y extremos', () => {
    expect(ratingToStarFills(5)).toEqual([1, 1, 1, 1, 1]);
    expect(ratingToStarFills(1)).toEqual([1, 0, 0, 0, 0]);
    expect(ratingToStarFills(2.5)).toEqual([1, 1, 0.5, 0, 0]);
    expect(ratingToStarFills(3.1)).toEqual([1, 1, 1, 0.1, 0]);
  });

  it('sin valorar (null/undefined/NaN) → todas vacías', () => {
    expect(ratingToStarFills(null)).toEqual([0, 0, 0, 0, 0]);
    expect(ratingToStarFills(undefined)).toEqual([0, 0, 0, 0, 0]);
    expect(ratingToStarFills(Number.NaN)).toEqual([0, 0, 0, 0, 0]);
  });

  it('un valor fuera de rango no desborda las estrellas', () => {
    expect(ratingToStarFills(9)).toEqual([1, 1, 1, 1, 1]);
    expect(ratingToStarFills(-2)).toEqual([0, 0, 0, 0, 0]);
  });

  it('la suma de rellenos coincide con el valor (sin ruido de coma flotante)', () => {
    for (let tenths = 10; tenths <= 50; tenths++) {
      const value = tenths / 10;
      const total = ratingToStarFills(value).reduce((acc, fill) => acc + fill, 0);
      expect(roundRating(total)).toBe(value);
    }
  });
});

describe('positionToRating (toque/arrastre)', () => {
  const width = 180; // 5 estrellas de 36 px

  it('el centro del control es 2.5 y los extremos se limitan a 1.0 / 5.0', () => {
    expect(positionToRating(90, width)).toBe(2.5);
    expect(positionToRating(width, width)).toBe(5);
    expect(positionToRating(0, width)).toBe(1); // el mínimo es 1.0, no 0
  });

  it('da paso de 0.1', () => {
    expect(positionToRating(169.2, width)).toBe(4.7);
    expect(positionToRating(126, width)).toBe(3.5);
  });

  it('arrastrar más allá de los bordes se limita al rango', () => {
    expect(positionToRating(-50, width)).toBe(1);
    expect(positionToRating(width + 400, width)).toBe(5);
  });

  it('ancho o posición inválidos → mínimo, sin NaN', () => {
    expect(positionToRating(50, 0)).toBe(1);
    expect(positionToRating(Number.NaN, width)).toBe(1);
    expect(positionToRating(50, Number.NaN)).toBe(1);
  });
});

describe('utilidades', () => {
  it('formatRating siempre con un decimal', () => {
    expect(formatRating(4.7)).toBe('4.7 / 5');
    expect(formatRating(5)).toBe('5.0 / 5');
    expect(formatRating(4.699999)).toBe('4.7 / 5');
  });

  it('clampRating redondea y limita', () => {
    expect(clampRating(0.2)).toBe(1);
    expect(clampRating(7)).toBe(5);
    expect(clampRating(3.14159)).toBe(3.1);
  });
});
