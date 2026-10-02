import { boundsForPoints, fromBoundsTuple, fromLngLat, isInsideBounds, routeFromPosition, toBoundsTuple, toLngLat } from '..';

describe('conversión latitud/longitud ↔ [lng, lat]', () => {
  it('MapLibre usa [longitud, latitud]: el orden se invierte en UN solo lugar', () => {
    expect(toLngLat({ latitude: 22.7958, longitude: -82.5065 })).toEqual([-82.5065, 22.7958]);
    expect(fromLngLat([-82.5065, 22.7958])).toEqual({ latitude: 22.7958, longitude: -82.5065 });
  });

  it('ida y vuelta no altera el punto', () => {
    const point = { latitude: -33.45, longitude: 151.2 };
    expect(fromLngLat(toLngLat(point))).toEqual(point);
  });

  it('las cajas son [oeste, sur, este, norte]', () => {
    const bounds = { west: -83, south: 22, east: -82, north: 23 };
    expect(toBoundsTuple(bounds)).toEqual([-83, 22, -82, 23]);
    expect(fromBoundsTuple([-83, 22, -82, 23])).toEqual(bounds);
  });
});

describe('boundsForPoints', () => {
  it('sin puntos no hay caja', () => {
    expect(boundsForPoints([])).toBeNull();
  });

  it('un punto: caja centrada en él con tamaño mínimo (no se pega al marcador)', () => {
    const bounds = boundsForPoints([{ latitude: 22.79, longitude: -82.5 }]);
    expect((bounds!.north + bounds!.south) / 2).toBeCloseTo(22.79);
    expect((bounds!.east + bounds!.west) / 2).toBeCloseTo(-82.5);
    expect(bounds!.north - bounds!.south).toBeCloseTo(0.004, 6);
  });

  it('dos puntos: los abarca con aire alrededor', () => {
    const a = { latitude: 22.79, longitude: -82.51 };
    const b = { latitude: 22.81, longitude: -82.49 };
    const bounds = boundsForPoints([a, b])!;
    expect(isInsideBounds(a, bounds)).toBe(true);
    expect(isInsideBounds(b, bounds)).toBe(true);
    expect(bounds.north - bounds.south).toBeGreaterThan(0.02);
  });
});

describe('routeFromPosition — tramo que falta por recorrer', () => {
  // Calle en L: 4 vértices, ~ cada 0,001° (~110 m).
  const route = [
    { latitude: 22.8, longitude: -82.52 },
    { latitude: 22.8, longitude: -82.519 },
    { latitude: 22.8, longitude: -82.518 },
    { latitude: 22.801, longitude: -82.518 },
  ];

  it('parte de la posición actual y conserva solo los vértices que siguen', () => {
    const position = { latitude: 22.8, longitude: -82.5185 }; // entre el 2.º y el 3.er vértice
    const remaining = routeFromPosition(route, position);
    expect(remaining[0]).toEqual(position);
    expect(remaining.slice(1)).toEqual([route[2], route[3]]);
  });

  it('en la salida (sobre el primer vértice) queda toda la ruta', () => {
    const remaining = routeFromPosition(route, route[0]);
    expect(remaining).toEqual([route[0], route[1], route[2], route[3]]);
  });

  it('cerca del final solo queda el último tramo', () => {
    const position = { latitude: 22.8008, longitude: -82.518 };
    expect(routeFromPosition(route, position)).toEqual([position, route[3]]);
  });

  it('si el mensajero se apartó un poco de la calle, la línea sigue partiendo de él (sin hueco)', () => {
    const position = { latitude: 22.8004, longitude: -82.5195 }; // ~45 m al norte de la calle
    const remaining = routeFromPosition(route, position);
    expect(remaining[0]).toEqual(position);
    expect(remaining.length).toBeGreaterThanOrEqual(2);
  });

  it('una ruta vacía da vacío y una de un solo punto conecta con él', () => {
    const position = { latitude: 22.8, longitude: -82.52 };
    expect(routeFromPosition([], position)).toEqual([]);
    expect(routeFromPosition([route[3]], position)).toEqual([position, route[3]]);
  });

  it('no modifica la ruta original', () => {
    const copy = JSON.parse(JSON.stringify(route));
    routeFromPosition(route, { latitude: 22.8, longitude: -82.5185 });
    expect(route).toEqual(copy);
  });
});

describe('isInsideBounds', () => {
  const bounds = { west: -83, south: 22, east: -82, north: 23 };

  it('dentro / fuera', () => {
    expect(isInsideBounds({ latitude: 22.5, longitude: -82.5 }, bounds)).toBe(true);
    expect(isInsideBounds({ latitude: 23.5, longitude: -82.5 }, bounds)).toBe(false);
    expect(isInsideBounds({ latitude: 22.5, longitude: -81.9 }, bounds)).toBe(false);
  });

  it('con margen, un punto pegado al borde ya cuenta como "casi fuera"', () => {
    const nearEdge = { latitude: 22.95, longitude: -82.5 };
    expect(isInsideBounds(nearEdge, bounds, 0)).toBe(true);
    expect(isInsideBounds(nearEdge, bounds, 0.1)).toBe(false);
  });
});
