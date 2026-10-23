/** DTOs de recompensas y canje de puntos — ver docs/BACKEND_API.md §4e. */

/** Lo decide el servidor: la app solo lo muestra, nunca decide por sí misma si una recompensa es válida. */
export type RewardStatus = 'AVAILABLE' | 'INSUFFICIENT_POINTS' | 'LOGIN_REQUIRED';

export type Reward = {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  imageUrl: string | null;
  productId: string;
  productName: string;
  businessId: string;
  businessName: string;
  /** Precio vigente del producto en CUP (lo que deja de pagar el cliente al canjearlo). */
  moneyValue: number | null;
  status: RewardStatus;
  /** Cuántos puntos le faltan (0 si alcanza). */
  missingPoints: number;
};

/** Respuesta de GET /rewards. `balance` es null para un invitado (sin cuenta no hay puntos). */
export type RewardsSnapshot = {
  balance: number | null;
  rewards: Reward[];
};

/** Lo ÚNICO que la app manda sobre el canje: qué recompensa quiere. Nunca costo, descuento ni totales. */
export type RedemptionRequest = {
  rewardId: string;
  /** Saldo que la app tenía en pantalla; solo sirve para que el servidor detecte datos viejos. */
  expectedBalance?: number;
};

/** Cotización de solo lectura calculada por el servidor (POST /checkout/quote). */
export type OrderQuote = {
  productsTotal: number;
  /** Cuánto de productsTotal es empaque (ya sumado adentro). */
  packagingTotal: number;
  pointsDiscount: number;
  /** Productos que paga en dinero: productsTotal − pointsDiscount. */
  productsToPay: number;
  /** Puntos que se gastarían (0 sin canje ni pago con puntos). */
  pointsRedeemed?: number;
  /** Total antes del canje: productos + mensajería + Servicio Tráelo. `total` es el de después. */
  totalBeforeRedemption?: number;
  deliveryFee: number;
  /** true = la mensajería es la tarifa FIJA entre localidades (se entrega en otra localidad que la de los negocios). */
  crossCityDelivery?: boolean;
  /** Entrega en "otra ubicación": km medidos desde el centro del pueblo y CUP por km (null/ausente si no aplica). */
  elsewhereDelivery?: { distanceKm: number; ratePerKm: number } | null;
  /** Mensajería que regala Tráelo con una promoción (0 o ausente sin promo). `deliveryFee` es la tarifa real. */
  deliveryFeeDiscount?: number;
  /** Promoción aplicada a esta cotización (null/ausente sin código). */
  promo?: { code: string; discount: number } | null;
  platformFee: number;
  total: number;
  redemption: {
    /** null = pago con puntos libre (no viene de una recompensa). */
    rewardId: string | null;
    rewardName: string;
    pointsCost: number;
    moneyValue: number;
    balanceBefore: number;
    balanceAfter: number;
  } | null;
};

export type OrderRedemption = {
  rewardId: string;
  rewardName: string;
  pointsCost: number;
  moneyValue: number;
  status: 'APPLIED' | 'REFUNDED';
};
