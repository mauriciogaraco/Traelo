import {
  getCourierView,
  isTrackingActive,
  isTrackingVisible,
  mapOrderStatusToTrackingStep,
  orderToStatusPoll,
  stagesOf,
  stagesReported,
} from '../tracking';
import { makeOrder } from '../../../testing/fixtures';

const states = (status: string) => mapOrderStatusToTrackingStep(status).steps.map((step) => `${step.key}:${step.state}`);

describe('mapOrderStatusToTrackingStep (mapping honesto sobre los 4 estados reales)', () => {
  it('PENDING → Aceptado es el paso actual', () => {
    const view = mapOrderStatusToTrackingStep('PENDING');
    expect(view.currentIndex).toBe(0);
    expect(view.steps[0]).toMatchObject({ key: 'accepted', label: 'Aceptado', state: 'current' });
    expect(states('PENDING')).toEqual([
      'accepted:current',
      'confirmed:upcoming',
      'headingOut:unavailable',
      'pickingUp:unavailable',
      'onTheWay:unavailable',
      'delivered:upcoming',
    ]);
  });

  it('ASSIGNED → Confirmado es el paso actual', () => {
    const view = mapOrderStatusToTrackingStep('ASSIGNED');
    expect(view.currentIndex).toBe(1);
    expect(states('ASSIGNED')).toEqual([
      'accepted:done',
      'confirmed:current',
      'headingOut:unavailable',
      'pickingUp:unavailable',
      'onTheWay:unavailable',
      'delivered:upcoming',
    ]);
  });

  it('COMPLETED → todo completado (Recogiendo/En camino ya quedaron atrás)', () => {
    expect(states('COMPLETED')).toEqual([
      'accepted:done',
      'confirmed:done',
      'headingOut:done',
      'pickingUp:done',
      'onTheWay:done',
      'delivered:done',
    ]);
    expect(mapOrderStatusToTrackingStep('COMPLETED').currentIndex).toBe(5);
  });

  it('CANCELLED → cancelado, sin paso actual', () => {
    const view = mapOrderStatusToTrackingStep('CANCELLED');
    expect(view).toMatchObject({ cancelled: true, unknown: false, currentIndex: -1, headline: 'Pedido cancelado' });
  });

  it('"Marchando", "Recogiendo" y "En camino" NUNCA son el paso actual, sea cual sea el estado real', () => {
    for (const status of ['PENDING', 'ASSIGNED', 'COMPLETED', 'CANCELLED', 'ALGO_NUEVO']) {
      const current = mapOrderStatusToTrackingStep(status).steps.filter((step) => step.state === 'current');
      for (const step of current) {
        expect(['headingOut', 'pickingUp', 'onTheWay']).not.toContain(step.key);
      }
    }
  });

  it.each([['ALGO_NUEVO'], [''], [null], [undefined], ['toString'], ['__proto__']])(
    'un estado desconocido (%p) no rompe ni marca un paso como actual',
    (status) => {
      const view = mapOrderStatusToTrackingStep(status as string | null | undefined);
      expect(view.unknown).toBe(true);
      expect(view.cancelled).toBe(false);
      expect(view.currentIndex).toBe(-1);
      expect(view.steps).toHaveLength(6);
      expect(view.steps.some((step) => step.state === 'current' || step.state === 'done')).toBe(false);
    },
  );

  it('la transición PENDING → ASSIGNED → COMPLETED avanza el paso actual', () => {
    const indexes = ['PENDING', 'ASSIGNED', 'COMPLETED'].map((s) => mapOrderStatusToTrackingStep(s).currentIndex);
    expect(indexes).toEqual([0, 1, 5]);
  });
});

describe('isTrackingActive', () => {
  it('solo PENDING y ASSIGNED siguen activos (justifican polling)', () => {
    expect(isTrackingActive('PENDING')).toBe(true);
    expect(isTrackingActive('ASSIGNED')).toBe(true);
    expect(isTrackingActive('COMPLETED')).toBe(false);
    expect(isTrackingActive('CANCELLED')).toBe(false);
    expect(isTrackingActive('DESCONOCIDO')).toBe(false);
    expect(isTrackingActive(undefined)).toBe(false);
  });
});

describe('getCourierView', () => {
  it('PENDING → "Buscando mensajero…" aunque llegue un nombre', () => {
    expect(getCourierView('PENDING', null)).toEqual({ kind: 'searching', text: 'Buscando mensajero…' });
    expect(getCourierView('PENDING', 'Yoandry').kind).toBe('searching');
  });

  it('ASSIGNED con nombre → "Tu mensajero: X"; sin nombre → texto genérico', () => {
    expect(getCourierView('ASSIGNED', 'Yoandry')).toEqual({ kind: 'assigned', text: 'Tu mensajero: Yoandry', name: 'Yoandry' });
    expect(getCourierView('ASSIGNED', null)).toMatchObject({ text: 'Mensajero asignado' });
    expect(getCourierView('ASSIGNED', '   ')).toMatchObject({ text: 'Mensajero asignado' });
  });

  it('COMPLETED con nombre → "Entregado por X"; sin nombre → "Pedido entregado"', () => {
    expect(getCourierView('COMPLETED', 'Yoandry')).toMatchObject({ text: 'Entregado por Yoandry' });
    expect(getCourierView('COMPLETED', null)).toMatchObject({ text: 'Pedido entregado' });
  });

  it('CANCELLED o desconocido → no se muestra mensajero', () => {
    expect(getCourierView('CANCELLED', 'Yoandry')).toEqual({ kind: 'none' });
    expect(getCourierView('LO_QUE_SEA', 'Yoandry')).toEqual({ kind: 'none' });
  });
});

describe('orderToStatusPoll', () => {
  it('extrae del detalle lo que necesita el seguimiento', () => {
    const order = makeOrder({ status: 'ASSIGNED', assignedAt: '2026-09-18T10:10:00.000Z', delivererName: 'Yoandry' });
    expect(orderToStatusPoll(order)).toEqual({
      orderNumber: 1234,
      status: 'ASSIGNED',
      updatedAt: order.updatedAt,
      assignedAt: '2026-09-18T10:10:00.000Z',
      completedAt: null,
      cancelledAt: null,
      delivererName: 'Yoandry',
    });
  });
});

describe('etapas del reparto (Recogiendo / En camino reportadas por el backend)', () => {
  const stateOf = (view: ReturnType<typeof mapOrderStatusToTrackingStep>, key: string) => view.steps.find((step) => step.key === key)?.state;

  it('ASSIGNED sin etapa marcada (null/null): sigue en Confirmado y los pasos siguientes están "por venir"', () => {
    const view = mapOrderStatusToTrackingStep('ASSIGNED', { pickingUpAt: null, onTheWayAt: null });
    expect(stateOf(view, 'confirmed')).toBe('current');
    expect(stateOf(view, 'pickingUp')).toBe('upcoming');
    expect(stateOf(view, 'onTheWay')).toBe('upcoming');
  });

  it('ASSIGNED + pickingUpAt: el paso actual es Recogiendo', () => {
    const view = mapOrderStatusToTrackingStep('ASSIGNED', { pickingUpAt: '2026-09-20T10:00:00Z', onTheWayAt: null });
    expect(view.currentIndex).toBe(3);
    expect(stateOf(view, 'confirmed')).toBe('done');
    expect(stateOf(view, 'pickingUp')).toBe('current');
    expect(stateOf(view, 'onTheWay')).toBe('upcoming');
    expect(view.headline).toMatch(/Recogiendo/);
  });

  it('ASSIGNED + onTheWayAt: el paso actual es En camino y Recogiendo ya quedó atrás', () => {
    const view = mapOrderStatusToTrackingStep('ASSIGNED', { pickingUpAt: '2026-09-20T10:00:00Z', onTheWayAt: '2026-09-20T10:10:00Z' });
    expect(view.currentIndex).toBe(4);
    expect(stateOf(view, 'pickingUp')).toBe('done');
    expect(stateOf(view, 'onTheWay')).toBe('current');
    expect(view.headline).toMatch(/En camino/);
  });

  it('un backend SIN etapas (campos ausentes) no las inventa: Recogiendo y En camino siguen "no disponibles"', () => {
    const view = mapOrderStatusToTrackingStep('ASSIGNED', undefined);
    expect(stateOf(view, 'pickingUp')).toBe('unavailable');
    expect(stateOf(view, 'onTheWay')).toBe('unavailable');
    expect(stateOf(view, 'confirmed')).toBe('current');
  });

  it('PENDING con etapas reportadas: aceptado actual y el resto por venir', () => {
    const view = mapOrderStatusToTrackingStep('PENDING', { pickingUpAt: null, onTheWayAt: null });
    expect(stateOf(view, 'accepted')).toBe('current');
    expect(stateOf(view, 'pickingUp')).toBe('upcoming');
  });

  it('COMPLETED: todo el recorrido completado, con o sin etapas', () => {
    for (const stages of [undefined, { pickingUpAt: '2026-09-20T10:00:00Z', onTheWayAt: '2026-09-20T10:10:00Z' }]) {
      const view = mapOrderStatusToTrackingStep('COMPLETED', stages);
      expect(view.steps.every((step) => step.state === 'done')).toBe(true);
    }
  });

  it('CANCELLED sigue siendo cancelado aunque haya etapas', () => {
    expect(mapOrderStatusToTrackingStep('CANCELLED', { pickingUpAt: '2026-09-20T10:00:00Z' }).cancelled).toBe(true);
  });
});

describe('"Marchando" (sub-fase HEADING_OUT, el mensajero va camino al negocio)', () => {
  const stateOf = (view: ReturnType<typeof mapOrderStatusToTrackingStep>, key: string) => view.steps.find((step) => step.key === key)?.state;

  it('ASSIGNED + headingOut: el paso actual es Marchando (tercero) y Confirmado ya quedó atrás', () => {
    const view = mapOrderStatusToTrackingStep('ASSIGNED', { pickingUpAt: null, onTheWayAt: null, headingOut: true });
    expect(view.currentIndex).toBe(2);
    expect(view.steps[2]).toMatchObject({ key: 'headingOut', label: 'Marchando', state: 'current' });
    expect(stateOf(view, 'confirmed')).toBe('done');
    expect(stateOf(view, 'pickingUp')).toBe('upcoming');
    expect(view.headline).toMatch(/Marchando/);
  });

  it('Recogiendo o En camino ganan sobre Marchando (la sub-fase real ya avanzó)', () => {
    const view = mapOrderStatusToTrackingStep('ASSIGNED', { pickingUpAt: '2026-09-20T10:00:00Z', onTheWayAt: null, headingOut: true });
    expect(stateOf(view, 'pickingUp')).toBe('current');
    expect(stateOf(view, 'headingOut')).toBe('done');
  });

  it('stagesOf lee HEADING_OUT del estado; sin la sub-fase no añade nada', () => {
    expect(stagesOf({ pickingUpAt: null, onTheWayAt: null, substatus: 'HEADING_OUT' })).toEqual({ pickingUpAt: null, onTheWayAt: null, headingOut: true });
    expect(stagesOf({ pickingUpAt: null, onTheWayAt: null, substatus: 'CONFIRMED' })).toEqual({ pickingUpAt: null, onTheWayAt: null });
  });

  it('un backend sin etapas no inventa Marchando: queda "no disponible"', () => {
    expect(stateOf(mapOrderStatusToTrackingStep('ASSIGNED', undefined), 'headingOut')).toBe('unavailable');
  });
});

describe('isTrackingVisible: el seguimiento en vivo solo desde "Recogiendo"', () => {
  it('Confirmado (etapas reportadas, sin recoger): NO se muestra', () => {
    expect(isTrackingVisible('ASSIGNED', { pickingUpAt: null, onTheWayAt: null })).toBe(false);
  });
  it('Recogiendo y En camino: se muestra', () => {
    expect(isTrackingVisible('ASSIGNED', { pickingUpAt: '2026-09-20T10:00:00Z', onTheWayAt: null })).toBe(true);
    expect(isTrackingVisible('ASSIGNED', { pickingUpAt: '2026-09-20T10:00:00Z', onTheWayAt: '2026-09-20T10:10:00Z' })).toBe(true);
  });
  it('solo "En camino" (el staff se saltó Recogiendo): también se muestra', () => {
    expect(isTrackingVisible('ASSIGNED', { pickingUpAt: null, onTheWayAt: '2026-09-20T10:10:00Z' })).toBe(true);
  });
  it('backend sin etapas: se conserva el comportamiento anterior (visible en ASSIGNED)', () => {
    expect(isTrackingVisible('ASSIGNED', undefined)).toBe(true);
  });
  it('PENDING, COMPLETED, CANCELLED o sin estado: nunca', () => {
    for (const status of ['PENDING', 'COMPLETED', 'CANCELLED', null, undefined, 'OTRO']) {
      expect(isTrackingVisible(status, { pickingUpAt: '2026-09-20T10:00:00Z' })).toBe(false);
    }
  });
});

describe('stagesOf / stagesReported', () => {
  it('devuelve las etapas solo si el estado las trae (aunque sean null)', () => {
    expect(stagesOf({ pickingUpAt: null, onTheWayAt: null })).toEqual({ pickingUpAt: null, onTheWayAt: null });
    expect(stagesOf({})).toBeUndefined();
    expect(stagesOf(null)).toBeUndefined();
    expect(stagesReported({ pickingUpAt: null })).toBe(true);
    expect(stagesReported({})).toBe(false);
    expect(stagesReported(undefined)).toBe(false);
  });
});

describe('orderToStatusPoll: foto del mensajero', () => {
  it('copia la foto del pedido al estado liviano', () => {
    const order = makeOrder({ delivererName: 'Yoandry', delivererPhotoUrl: 'https://x/y.jpg' });
    expect(orderToStatusPoll(order)).toMatchObject({ delivererName: 'Yoandry', delivererPhotoUrl: 'https://x/y.jpg' });
  });
});
