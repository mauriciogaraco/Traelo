/** DTOs de puntos de fidelización — ver docs/BACKEND_API.md §4c. */

export type PointsTransactionType =
  | 'ORDER_COMPLETED'
  | 'ORDER_ADJUSTMENT'
  | 'FIRST_ORDER_BONUS'
  /** Canje de una recompensa (negativo). */
  | 'REDEMPTION'
  /** Devolución de un canje cuando el pedido se cancela (positivo). */
  | 'REDEMPTION_REFUND';

export type PointsTransaction = {
  id: string;
  type: PointsTransactionType;
  /** Firmado: positivo acredita, negativo retira (corrección de administración). */
  points: number;
  balanceAfter: number;
  orderNumber: number | null;
  reason: string;
  createdAt: string;
};

export type CustomerPoints = {
  balance: number;
  /** Regla vigente: 1 punto por cada `divisor` CUP de Servicio Tráelo (solo para mostrarla). */
  divisor: number;
  /** Bono de bienvenida por el primer pedido desde la app; `available` = este cliente todavía puede ganarlo. */
  firstOrderBonus: { points: number; available: boolean };
  transactions: PointsTransaction[];
};
