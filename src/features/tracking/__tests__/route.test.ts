import { makeTracking } from '../../../testing/fixtures';
import { formatDistance, getTrackingPanelView, type TrackingPanelInput } from '..';

describe('formatDistance — aproximada y honesta', () => {
  it.each([
    [10, 'muy cerca'],
    [49, 'muy cerca'],
    [50, 'a unos 50 m'],
    [447, 'a unos 450 m'],
    [999, 'a unos 1000 m'],
    [1000, 'a unos 1,0 km'],
    [1797, 'a unos 1,8 km'],
    [12_340, 'a unos 12,3 km'],
  ])('%i m → %s', (meters, expected) => {
    expect(formatDistance(meters)).toBe(expected);
  });

  it('valores inválidos no producen texto', () => {
    expect(formatDistance(-5)).toBe('');
    expect(formatDistance(Number.NaN)).toBe('');
  });
});

describe('getTrackingPanelView — qué línea se dibuja', () => {
  const location = { latitude: 22.8066, longitude: -82.513, accuracy: 8, updatedAt: '2026-09-19T11:59:58.000Z' };
  const destination = { address: 'Calle 23', reference: null, latitude: 22.7958, longitude: -82.5065 };
  const route = {
    coordinates: [
      { latitude: 22.8066, longitude: -82.513 },
      { latitude: 22.7958, longitude: -82.5065 },
    ],
    distanceMeters: 1797,
    computedAt: '2026-09-19T11:59:58.000Z',
  };
  const input = (tracking: ReturnType<typeof makeTracking>, overrides: Partial<TrackingPanelInput> = {}): TrackingPanelInput => ({
    orderStatus: 'ASSIGNED',
    tracking,
    error: null,
    loading: false,
    ageMs: 2000,
    mapAvailable: true,
    ...overrides,
  });

  it('con ruta del backend: línea por calles y distancia', () => {
    const view = getTrackingPanelView(input(makeTracking({ location, destination, route })));
    expect(view).toMatchObject({ kind: 'active', routeKind: 'street', distanceLabel: 'a unos 1,8 km' });
  });

  it('con mensajero y destino pero sin ruta (aún no calculada o el motor falló): recta de respaldo, sin distancia', () => {
    const view = getTrackingPanelView(input(makeTracking({ location, destination, route: null })));
    expect(view).toMatchObject({ routeKind: 'straight', distanceLabel: null });
  });

  it('sin pin de destino no hay línea (no hay a dónde trazar)', () => {
    const view = getTrackingPanelView(input(makeTracking({ location })));
    expect(view).toMatchObject({ routeKind: null, distanceLabel: null });
  });

  it('sin ubicación del mensajero no hay línea aunque exista el destino', () => {
    const view = getTrackingPanelView(input(makeTracking({ destination, route })));
    expect(view).toMatchObject({ routeKind: null, distanceLabel: null });
  });

  it('una ruta degenerada (menos de 2 puntos) cuenta como sin ruta', () => {
    const view = getTrackingPanelView(input(makeTracking({ location, destination, route: { ...route, coordinates: [route.coordinates[0]] } })));
    expect(view).toMatchObject({ routeKind: 'straight', distanceLabel: null });
  });

  it('con ubicación demasiado vieja (no se dibuja al mensajero) tampoco hay línea', () => {
    const view = getTrackingPanelView(input(makeTracking({ location, destination, route }), { ageMs: 60 * 60_000 }));
    expect(view).toMatchObject({ routeKind: null, distanceLabel: null });
  });

  it('el pedido terminó: no hay vista activa, así que no hay ruta que mostrar', () => {
    expect(getTrackingPanelView(input(makeTracking({ location, destination, route }), { orderStatus: 'COMPLETED' })).kind).toBe('ended');
  });
});
