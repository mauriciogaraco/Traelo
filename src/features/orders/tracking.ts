import type { OrderStatus, OrderStatusPoll, Order } from '../../types/backend/order';

/**
 * Seguimiento visual del pedido. Mapping HONESTO sobre los 4 estados reales del backend
 * (PENDING, ASSIGNED, COMPLETED, CANCELLED): nunca se inventa un estado que el backend no
 * reporta. "Recogiendo" y "En camino" se muestran en el recorrido, pero hoy NO pueden ser el
 * paso actual mientras el backend no reporte las ETAPAS del reparto (pickingUpAt / onTheWayAt): en
 * cuanto las reporta, "Recogiendo" y "En camino" pasan a ser pasos reales del recorrido.
 */

/** Etapas del reparto que informa el backend. `undefined` = este backend no las reporta (no se inventan). */
export type DeliveryStages = {
  pickingUpAt?: string | null;
  onTheWayAt?: string | null;
  /** El pedido ya se está preparando y el mensajero va camino al negocio (sub-fase HEADING_OUT, sin marca de tiempo propia): "Marchando". */
  headingOut?: boolean;
};

/** ¿El backend reporta etapas? (aunque valgan null: "todavía no"). */
export function stagesReported(stages: DeliveryStages | null | undefined): stages is DeliveryStages {
  return !!stages && (stages.pickingUpAt !== undefined || stages.onTheWayAt !== undefined);
}

/** Las etapas del estado liviano, o undefined si el backend no las trae. */
export function stagesOf(
  poll: { pickingUpAt?: string | null; onTheWayAt?: string | null; substatus?: string | null } | null | undefined,
): DeliveryStages | undefined {
  if (!poll || (poll.pickingUpAt === undefined && poll.onTheWayAt === undefined)) return undefined;
  return {
    pickingUpAt: poll.pickingUpAt,
    onTheWayAt: poll.onTheWayAt,
    ...(poll.substatus === 'HEADING_OUT' ? { headingOut: true } : {}),
  };
}


export type TrackingStepKey = 'accepted' | 'confirmed' | 'headingOut' | 'pickingUp' | 'onTheWay' | 'delivered';

export type TrackingStepState =
  /** Ya ocurrió. */
  | 'done'
  /** Es el paso actual del pedido. */
  | 'current'
  /** Todavía no llegó. */
  | 'upcoming'
  /** El backend aún no reporta este estado: se muestra pero no se puede activar. */
  | 'unavailable';

export type TrackingStep = {
  key: TrackingStepKey;
  label: string;
  state: TrackingStepState;
};

export type TrackingView = {
  steps: TrackingStep[];
  /** Índice del paso actual, o -1 si el pedido se canceló / el estado es desconocido. */
  currentIndex: number;
  cancelled: boolean;
  /** Estado que esta versión de la app no conoce (p.ej. uno nuevo del backend): sin romper la UI. */
  unknown: boolean;
  /** Texto corto para lectores de pantalla y para el encabezado. */
  headline: string;
};

const STEP_DEFS: { key: TrackingStepKey; label: string }[] = [
  { key: 'accepted', label: 'Aceptado' },
  { key: 'confirmed', label: 'Confirmado' },
  { key: 'headingOut', label: 'Marchando' },
  { key: 'pickingUp', label: 'Recogiendo' },
  { key: 'onTheWay', label: 'En camino' },
  { key: 'delivered', label: 'Entregado' },
];

/** Pasos que un backend SIN etapas no reporta. */
const UNREPORTED_LEGACY: ReadonlySet<TrackingStepKey> = new Set(['headingOut', 'pickingUp', 'onTheWay']);
const NONE_UNREPORTED: ReadonlySet<TrackingStepKey> = new Set();

/** Paso actual por estado real del backend. */
const CURRENT_STEP_BY_STATUS: Record<OrderStatus, TrackingStepKey | null> = {
  PENDING: 'accepted',
  ASSIGNED: 'confirmed',
  COMPLETED: 'delivered',
  CANCELLED: null,
};

const HEADLINES: Record<OrderStatus, string> = {
  PENDING: 'Pedido aceptado — buscando mensajero',
  ASSIGNED: 'Pedido confirmado — mensajero asignado',
  COMPLETED: 'Pedido entregado',
  CANCELLED: 'Pedido cancelado',
};

export function mapOrderStatusToTrackingStep(
  status: OrderStatus | string | null | undefined,
  stages?: DeliveryStages | null,
): TrackingView {
  const reported = stagesReported(stages);
  // Con etapas reportadas, Recogiendo/En camino son pasos reales ("por venir"); sin ellas, "no disponibles".
  const UNREPORTED = reported ? NONE_UNREPORTED : UNREPORTED_LEGACY;
  const known = status != null && Object.prototype.hasOwnProperty.call(CURRENT_STEP_BY_STATUS, status);

  // Estado desconocido o ausente: todo "por venir", sin paso actual y sin lanzar.
  if (!known) {
    return {
      steps: STEP_DEFS.map((def) => ({
        ...def,
        state: UNREPORTED.has(def.key) ? 'unavailable' : 'upcoming',
      })),
      currentIndex: -1,
      cancelled: false,
      unknown: true,
      headline: 'Estado del pedido no disponible',
    };
  }

  const typedStatus = status as OrderStatus;

  if (typedStatus === 'CANCELLED') {
    return {
      steps: STEP_DEFS.map((def) => ({ ...def, state: 'upcoming' as const })),
      currentIndex: -1,
      cancelled: true,
      unknown: false,
      headline: HEADLINES.CANCELLED,
    };
  }

  let currentKey = CURRENT_STEP_BY_STATUS[typedStatus];
  // Mientras el pedido está ASSIGNED, la etapa reportada dice en qué paso va el reparto.
  if (typedStatus === 'ASSIGNED' && reported) {
    currentKey = stages.onTheWayAt
      ? 'onTheWay'
      : stages.pickingUpAt
        ? 'pickingUp'
        : stages.headingOut
          ? 'headingOut'
          : 'confirmed';
  }
  const currentIndex = STEP_DEFS.findIndex((def) => def.key === currentKey);

  const steps = STEP_DEFS.map((def, index): TrackingStep => {
    if (index === currentIndex) {
      // Entregado es terminal: se muestra completado, no "en curso".
      return { ...def, state: typedStatus === 'COMPLETED' ? 'done' : 'current' };
    }
    if (index < currentIndex) {
      // Recogiendo/En camino nunca se reportaron, pero un pedido entregado ya pasó por ahí.
      return { ...def, state: 'done' };
    }
    // Todavía no llegó. Los pasos que el backend no reporta quedan marcados como no disponibles.
    return { ...def, state: UNREPORTED.has(def.key) ? 'unavailable' : 'upcoming' };
  });

  const headline =
    typedStatus === 'ASSIGNED' && currentKey === 'headingOut'
      ? 'Marchando — tu pedido ya se está preparando'
      : typedStatus === 'ASSIGNED' && currentKey === 'pickingUp'
      ? 'Recogiendo — tu mensajero va por el pedido'
      : typedStatus === 'ASSIGNED' && currentKey === 'onTheWay'
        ? 'En camino — tu pedido va hacia ti'
        : HEADLINES[typedStatus];
  return { steps, currentIndex, cancelled: false, unknown: false, headline };
}

/**
 * ¿Se muestra el seguimiento en vivo (mapa del mensajero)? Solo con el pedido ASSIGNED y, si el backend
 * reporta etapas, únicamente desde "Recogiendo": en "Confirmado" el mensajero todavía no va por el pedido.
 * Con un backend sin etapas se conserva el comportamiento anterior (visible en ASSIGNED).
 */
export function isTrackingVisible(
  status: OrderStatus | string | null | undefined,
  stages?: DeliveryStages | null,
): boolean {
  if (status !== 'ASSIGNED') return false;
  // Con "En camino" también (el staff puede saltarse "Recogiendo" y solo marcar onTheWayAt).
  return stagesReported(stages) ? !!(stages.pickingUpAt || stages.onTheWayAt) : true;
}

/** Un pedido "activo" es el que todavía puede cambiar de estado (y justifica hacer polling). */
export function isTrackingActive(status: OrderStatus | string | null | undefined): boolean {
  return status === 'PENDING' || status === 'ASSIGNED';
}

/** Lo que muestra la tarjeta del mensajero, según el estado real y si ya hay un nombre. */
export type CourierView =
  | { kind: 'searching'; text: string }
  | { kind: 'assigned'; text: string; name: string | null }
  | { kind: 'delivered'; text: string; name: string | null }
  | { kind: 'none' };

export function getCourierView(
  status: OrderStatus | string | null | undefined,
  delivererName: string | null | undefined,
): CourierView {
  const name = delivererName?.trim() ? delivererName.trim() : null;
  switch (status) {
    case 'PENDING':
      return { kind: 'searching', text: 'Buscando mensajero…' };
    case 'ASSIGNED':
      return { kind: 'assigned', text: name ? `Tu mensajero: ${name}` : 'Mensajero asignado', name };
    case 'COMPLETED':
      return { kind: 'delivered', text: name ? `Entregado por ${name}` : 'Pedido entregado', name };
    default:
      // Cancelado o desconocido: no se muestra ningún mensajero.
      return { kind: 'none' };
  }
}

/** El detalle de un pedido ya trae todo lo que necesita el estado liviano. */
export function orderToStatusPoll(order: Order): OrderStatusPoll {
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    updatedAt: order.updatedAt,
    assignedAt: order.assignedAt,
    substatus: order.substatus,
    pickingUpAt: order.pickingUpAt,
    onTheWayAt: order.onTheWayAt,
    completedAt: order.completedAt,
    cancelledAt: order.cancelledAt,
    delivererName: order.delivererName,
    delivererPhotoUrl: order.delivererPhotoUrl,
  };
}
