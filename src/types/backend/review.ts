/** DTOs de reseñas — ver docs/BACKEND_API.md. El estado pending/submitted lo decide SIEMPRE el backend. */

export type ReviewStatus = 'pending' | 'submitted';

export type DelivererReviewState = {
  delivererName: string;
  status: ReviewStatus;
  rating: number | null;
};

export type BusinessReviewState = {
  businessId: string;
  businessName: string;
  status: ReviewStatus;
  rating: number | null;
};

export type OrderReviewState = {
  orderId: string;
  orderNumber: number;
  /** Solo un pedido COMPLETED admite valoración. */
  canReview: boolean;
  /** null si el pedido no tiene mensajero asignado. */
  deliverer: DelivererReviewState | null;
  businesses: BusinessReviewState[];
  /** true si canReview y falta al menos una valoración. */
  hasPending: boolean;
};

export type PendingReview = {
  orderId: string;
  orderNumber: number;
  completedAt: string | null;
  delivererPending: { delivererName: string } | null;
  businessesPending: { businessId: string; businessName: string }[];
};

export type BusinessRatingInput = { businessId: string; rating: number };
