import { nextPollDelay } from '../../../hooks/useCourierTracking';
import { makeTracking } from '../../../testing/fixtures';
import {
  COURIER_POLL_INTERVAL_MS,
  COURIER_POLL_MAX_BACKOFF_MS,
  LOCATION_FRESH_MAX_MS,
  LOCATION_STALE_MAX_MS,
  NO_LOCATION_MESSAGE,
  TOO_OLD_MESSAGE,
  classifyFreshness,
  formatAgo,
  getTrackingPanelView,
  locationAgeMs,
  type TrackingPanelInput,
} from '..';

const SERVER_TIME = '2026-09-19T12:00:00.000Z';
const locationAt = (secondsBeforeServer: number) => ({
  latitude: 22.7958,
  longitude: -82.5065,
  accuracy: 12,
  updatedAt: new Date(Date.parse(SERVER_TIME) - secondsBeforeServer * 1000).toISOString(),
});

describe('locationAgeMs — frescura contra la hora del SERVIDOR', () => {
  const received = 1_000_000;

  it('usa serverTime - updatedAt, no el reloj del teléfono', () => {
    // El teléfono cree que es 2001 pero la respuesta dice que la ubicación tiene 5 s.
    expect(locationAgeMs(locationAt(5), SERVER_TIME, received, received)).toBe(5_000);
  });

  it('suma lo que pasó desde que llegó la respuesta (medido con el reloj local)', () => {
    expect(locationAgeMs(locationAt(5), SERVER_TIME, received, received + 3_000)).toBe(8_000);
  });

  it('una diferencia negativa (updatedAt "en el futuro") se trata como 0, nunca negativa', () => {
    expect(locationAgeMs(locationAt(-30), SERVER_TIME, received, received)).toBe(0);
  });

  it('sin ubicación o con fechas inválidas devuelve null', () => {
    expect(locationAgeMs(null, SERVER_TIME, received, received)).toBeNull();
    expect(locationAgeMs({ ...locationAt(1), updatedAt: 'basura' }, SERVER_TIME, received, received)).toBeNull();
    expect(locationAgeMs(locationAt(1), 'basura', received, received)).toBeNull();
  });
});

describe('classifyFreshness — umbrales centralizados', () => {
  it('fresh hasta el umbral, stale hasta el tope y unavailable después', () => {
    expect(classifyFreshness(0)).toBe('fresh');
    expect(classifyFreshness(LOCATION_FRESH_MAX_MS)).toBe('fresh');
    expect(classifyFreshness(LOCATION_FRESH_MAX_MS + 1)).toBe('stale');
    expect(classifyFreshness(LOCATION_STALE_MAX_MS)).toBe('stale');
    expect(classifyFreshness(LOCATION_STALE_MAX_MS + 1)).toBe('unavailable');
  });

  it('sin edad (sin ubicación) es unavailable', () => {
    expect(classifyFreshness(null)).toBe('unavailable');
  });
});

describe('formatAgo', () => {
  it.each([
    [0, 'hace 0 segundos'],
    [1_000, 'hace 1 segundo'],
    [5_000, 'hace 5 segundos'],
    [59_999, 'hace 59 segundos'],
    [60_000, 'hace 1 min'],
    [120_000, 'hace 2 min'],
    [3_600_000, 'hace 1 h'],
    [3_900_000, 'hace 1 h 5 min'],
  ])('%i ms → %s', (ms, expected) => {
    expect(formatAgo(ms)).toBe(expected);
  });
});

describe('nextPollDelay — backoff con tope', () => {
  it('sin fallos usa el intervalo; cada fallo lo duplica hasta el tope', () => {
    expect(nextPollDelay(0, COURIER_POLL_INTERVAL_MS)).toBe(COURIER_POLL_INTERVAL_MS);
    expect(nextPollDelay(1, COURIER_POLL_INTERVAL_MS)).toBe(COURIER_POLL_INTERVAL_MS * 2);
    expect(nextPollDelay(10, COURIER_POLL_INTERVAL_MS)).toBe(COURIER_POLL_MAX_BACKOFF_MS);
  });

  it('el intervalo por defecto está dentro de 5–10 s', () => {
    expect(COURIER_POLL_INTERVAL_MS).toBeGreaterThanOrEqual(5_000);
    expect(COURIER_POLL_INTERVAL_MS).toBeLessThanOrEqual(10_000);
  });
});

describe('getTrackingPanelView — estados de la UI', () => {
  const base: TrackingPanelInput = {
    orderStatus: 'ASSIGNED',
    tracking: makeTracking(),
    error: null,
    loading: false,
    ageMs: null,
    mapAvailable: true,
  };
  const withLocation = (secondsAgo: number, overrides: Partial<TrackingPanelInput> = {}): TrackingPanelInput => ({
    ...base,
    tracking: makeTracking({ location: locationAt(0) }),
    ageMs: secondsAgo * 1000,
    ...overrides,
  });

  it('PENDING (sin mensajero) y estados desconocidos: nada que mostrar', () => {
    expect(getTrackingPanelView({ ...base, orderStatus: 'PENDING' })).toEqual({ kind: 'hidden' });
    expect(getTrackingPanelView({ ...base, orderStatus: undefined })).toEqual({ kind: 'hidden' });
    expect(getTrackingPanelView({ ...base, orderStatus: 'EN_CAMINO' })).toEqual({ kind: 'hidden' });
  });

  it('pedido completado: el seguimiento terminó, sin mapa ni última ubicación', () => {
    const view = getTrackingPanelView(withLocation(2, { orderStatus: 'COMPLETED' }));
    expect(view).toMatchObject({ kind: 'ended', reason: 'completed' });
  });

  it('pedido cancelado: el seguimiento terminó', () => {
    const view = getTrackingPanelView(withLocation(2, { orderStatus: 'CANCELLED' }));
    expect(view).toMatchObject({ kind: 'ended', reason: 'cancelled' });
  });

  it('si el tracking ya informa que terminó aunque el estado local se retrase, se corta igual', () => {
    const completed = makeTracking({ status: 'COMPLETED', trackingActive: false });
    expect(getTrackingPanelView({ ...base, tracking: completed })).toMatchObject({ kind: 'ended', reason: 'completed' });
  });

  it('cargando: primera consulta en curso, sin error', () => {
    expect(getTrackingPanelView({ ...base, tracking: null, loading: true })).toEqual({ kind: 'loading' });
  });

  it('sin conexión al abrir: no es una pantalla vacía ni infinita — aviso y el pedido sigue', () => {
    const view = getTrackingPanelView({ ...base, tracking: null, loading: true, error: 'offline' });
    expect(view).toMatchObject({ kind: 'active', showMap: false, live: false });
    expect(view.kind === 'active' && view.notice).toMatch(/No se pudo actualizar la ubicación/);
  });

  it('tracking sin ubicación: "todavía no está disponible" (no es un error)', () => {
    const view = getTrackingPanelView(base);
    expect(view).toMatchObject({ kind: 'active', freshness: 'unavailable', courier: null, caption: NO_LOCATION_MESSAGE, notice: null });
  });

  it('ubicación fresca: en vivo, con "Actualizado hace 5 segundos" y mapa', () => {
    const view = getTrackingPanelView(withLocation(5));
    expect(view).toMatchObject({
      kind: 'active',
      freshness: 'fresh',
      live: true,
      showMap: true,
      caption: 'Actualizado hace 5 segundos',
      courier: { latitude: 22.7958, longitude: -82.5065 },
    });
  });

  it('ubicación desactualizada: "Última ubicación hace 2 min" y NO es tiempo real', () => {
    const view = getTrackingPanelView(withLocation(120));
    expect(view).toMatchObject({ freshness: 'stale', live: false, showMap: true, caption: 'Última ubicación hace 2 min' });
  });

  it('ubicación demasiado vieja: no se dibuja y se dice que no hay una reciente', () => {
    const view = getTrackingPanelView(withLocation(LOCATION_STALE_MAX_MS / 1000 + 60));
    expect(view).toMatchObject({ freshness: 'unavailable', courier: null, showMap: false, caption: TOO_OLD_MESSAGE });
  });

  it('pierde conexión con una ubicación reciente: la conserva pero no finge tiempo real', () => {
    const view = getTrackingPanelView(withLocation(10, { error: 'offline' }));
    expect(view).toMatchObject({ live: false, showMap: true, caption: 'Última ubicación hace 10 segundos' });
    expect(view.kind === 'active' && view.notice).toMatch(/Sin conexión/);
  });

  it('error temporal del servidor: aviso de reintento, sigue mostrando lo último', () => {
    const view = getTrackingPanelView(withLocation(10, { error: 'error' }));
    expect(view).toMatchObject({ live: false, showMap: true });
    expect(view.kind === 'active' && view.notice).toMatch(/Reintentaremos/);
  });

  it('sin coordenadas de destino (el pin es opcional): el mapa con el mensajero se muestra igual, sin avisos', () => {
    const view = getTrackingPanelView(withLocation(5));
    expect(view).toMatchObject({ destination: null, showMap: true, notice: null });
    expect(view).not.toHaveProperty('destinationNote');
  });

  it('con coordenadas de destino: se dibuja también el destino', () => {
    const tracking = makeTracking({
      location: locationAt(0),
      destination: { address: 'Calle 23', reference: null, latitude: 22.79, longitude: -82.51 },
    });
    const view = getTrackingPanelView({ ...base, tracking, ageMs: 3_000 });
    expect(view).toMatchObject({ destination: { latitude: 22.79, longitude: -82.51 } });
  });

  it('solo destino (mensajero aún sin ubicación) con mapa disponible: muestra el mapa del destino', () => {
    const tracking = makeTracking({ destination: { address: 'Calle 23', reference: null, latitude: 22.79, longitude: -82.51 } });
    const view = getTrackingPanelView({ ...base, tracking });
    expect(view).toMatchObject({ showMap: true, courier: null, caption: NO_LOCATION_MESSAGE });
  });

  it('sin mapa disponible en el dispositivo el seguimiento sigue en texto', () => {
    const view = getTrackingPanelView(withLocation(5, { mapAvailable: false }));
    expect(view).toMatchObject({ showMap: false, live: true, caption: 'Actualizado hace 5 segundos' });
  });
});
