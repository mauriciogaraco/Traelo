/** DTOs de pedidos — ver docs/BACKEND_API.md §3/§4. */

import type { OrderRedemption } from './rewards';

export type OrderStatus = 'PENDING' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
export type OrderSource = 'APP' | 'WEB' | 'MANUAL' | 'TELEGRAM';

export type OrderItem = {
  id: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  commissionAmount: number;
  /** Canje: puntos usados y valor en CUP cubierto por una unidad de esta línea. Ausente en respuestas antiguas. */
  pointsRedeemed?: number;
  pointsDiscount?: number;
  /** Empaque elegido (ya sumado en `subtotal` del negocio). Ausente en respuestas antiguas. */
  packagingName?: string | null;
  packagingFee?: number;
};

export type OrderBusiness = {
  id: string;
  businessId: string;
  businessName: string;
  subtotal: number;
  commissionEarned: number;
  commissionTypeSnapshot: 'PERCENTAGE' | 'FIXED_PER_PRODUCT' | null;
  commissionRateSnapshot: number | null;
  items: OrderItem[];
};

export type Order = {
  id: string;
  orderNumber: number;
  customerName: string;
  customerAddress: string;
  addressReference: string | null;
  customerPhone: string;
  deliveryFee: number;
  status: OrderStatus;
  orderDate: string;
  assignedAt: string | null;
  pickingUpAt?: string | null;
  onTheWayAt?: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  delivererId: string | null;
  delivererName: string | null;
  delivererPhotoUrl?: string | null;
  registeredByUserId: string | null;
  registeredByName: string | null;
  customerId: string | null;
  source: OrderSource;
  raffleNumber: number | null;
  productsTotal: number;
  platformFee: number;
  /** Cuánto de productsTotal es empaque (ya sumado adentro). Ausente en respuestas antiguas. */
  packagingTotal?: number;
  /** Valor en CUP cubierto con puntos (0/ausente sin canje). productsTotal NO lo descuenta; total sí. */
  pointsDiscount?: number;
  redemption?: OrderRedemption | null;
  total: number;
  traeloEarning: number;
  traeloDeliveryShare: number;
  delivererEarning: number;
  businesses: OrderBusiness[];
  createdAt: string;
  updatedAt: string;
};

/** Respuesta del endpoint liviano /status (polling y seguimiento). */
export type OrderStatusPoll = {
  orderNumber: number;
  status: OrderStatus;
  updatedAt: string;
  /** Marcas de tiempo de cada transición real del backend (null si todavía no ocurrió). */
  assignedAt: string | null;
  /**
   * Etapas del reparto que reporta el backend mientras el pedido está ASSIGNED: el mensajero va por el
   * pedido ("Recogiendo") y luego lo lleva al cliente ("En camino"). null = todavía no. `undefined` =
   * este backend aún no reporta etapas (versión anterior): la app no las inventa.
   */
  pickingUpAt?: string | null;
  onTheWayAt?: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  /** Nombre del mensajero (el del usuario). null hasta que se asigna uno. */
  delivererName: string | null;
  /** Foto de perfil del mensajero (URL). null si no tiene; ausente en un backend anterior. */
  delivererPhotoUrl?: string | null;
};

/**
 * Respuesta de POST /checkout: el pedido y, SOLO si fue de invitado, el token con el que este
 * dispositivo puede seguirlo/valorarlo sin cuenta (el backend lo entrega una única vez).
 */
export type CheckoutOrder = Order & { guestAccessToken?: string };

/** Motivos posibles dentro de un error 409 CART_CHANGED. */
export type CartChangeReason =
  | 'BUSINESS_NOT_FOUND'
  | 'BUSINESS_INACTIVE'
  | 'BUSINESS_NOT_ACCEPTING_ORDERS'
  | 'BUSINESS_CLOSED'
  | 'PRODUCT_NOT_FOUND'
  | 'PRODUCT_UNAVAILABLE'
  | 'PRICE_CHANGED'
  | 'PACKAGING_UNAVAILABLE';

export type CartChangeDetail = {
  type: 'business' | 'product';
  businessId?: string;
  productId?: string;
  reason: CartChangeReason;
  message: string;
  expectedPrice?: number;
  currentPrice?: number;
};

export type CartChangedErrorDetails = {
  changes: CartChangeDetail[];
};

export type RepeatOrderItem = {
  productId: string | null;
  productName: string;
  quantity: number;
  originalUnitPrice: number;
  currentPrice: number | null;
  available: boolean;
};

export type RepeatOrderBusiness = {
  businessId: string;
  businessName: string;
  isOpenNow: boolean;
  items: RepeatOrderItem[];
};

export type RepeatOrderResult = {
  originalOrderId: string;
  businesses: RepeatOrderBusiness[];
  hasChanges: boolean;
};
