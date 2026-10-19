/** Ruta de la pantalla a la que lleva el enlace de reseña que se le pasa al cliente. */
export const REVIEW_LINK_PREFIX = '/valorar'

/** Enlace que se le manda al cliente para que valore SU pedido: abre directo la valoración. */
export function reviewLinkUrl(siteUrl: string, orderId: string): string {
  return `${siteUrl}${REVIEW_LINK_PREFIX}/${encodeURIComponent(orderId)}`
}

export type ReviewLinkView =
  | 'loading'
  /** Sin sesión: se invita a iniciar sesión (la valoración exige cuenta) y se vuelve a esta pantalla. */
  | 'login'
  /** El pedido se hizo SIN cuenta desde este navegador: las valoraciones exigen cuenta. */
  | 'guest-order'
  /** Con sesión, pero el pedido no existe o es de otra cuenta. */
  | 'not-found'
  /** El pedido todavía no se entregó: aún no se puede valorar. */
  | 'not-delivered'
  /** Ya no queda nada por valorar. */
  | 'already-reviewed'
  /** Hay algo por valorar: se abre la valoración. */
  | 'review'

export interface ReviewLinkInput {
  authLoading: boolean
  isAuthenticated: boolean
  /** El pedido se hizo como invitado desde este mismo navegador (hay un token guardado). */
  isGuestOrderHere: boolean
  orderLoading: boolean
  hasOrder: boolean
  status: string | undefined
  /** Estado de las valoraciones que dice el servidor (null mientras no llega). */
  review: { canReview: boolean; hasPending: boolean } | null
}

/**
 * Qué mostrar al abrir el enlace de reseña. Siempre decide el servidor: si el pedido se puede valorar y si
 * falta algo (`review`); aquí solo se ordenan los casos para que cada persona vea el que le corresponde.
 */
export function reviewLinkView(input: ReviewLinkInput): ReviewLinkView {
  if (input.authLoading) return 'loading'
  if (!input.isAuthenticated) return input.isGuestOrderHere ? 'guest-order' : 'login'
  if (!input.hasOrder) return input.orderLoading ? 'loading' : 'not-found'
  if (input.status !== 'COMPLETED') return 'not-delivered'
  if (input.review === null) return 'loading'
  if (!input.review.canReview) return 'not-delivered'
  return input.review.hasPending ? 'review' : 'already-reviewed'
}
