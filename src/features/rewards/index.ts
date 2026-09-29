import type { CartItem } from '../../store/cartStore'
import type { AppliedRedemption } from '../../store/rewardsStore'
import type { Reward } from '../../types/backend/rewards'

/**
 * Ayudas de presentación del canje. NINGUNA decide si un canje es válido: la validez (recompensa
 * activa, producto disponible, saldo, elegibilidad) la decide siempre el servidor; aquí solo se
 * ordena, filtra y redacta lo que el servidor ya dijo.
 */

/** Recompensas cuyo producto está en el carrito (las únicas que se pueden aplicar a este pedido). */
export function rewardsInCart(rewards: Reward[], items: CartItem[]): Reward[] {
  const inCart = new Set(items.map((item) => item.productId))
  return rewards.filter((reward) => inCart.has(reward.productId))
}

/** Las que el servidor marcó como alcanzables con los puntos actuales. */
export function availableRewards(rewards: Reward[]): Reward[] {
  return rewards.filter((reward) => reward.status === 'AVAILABLE')
}

/**
 * "Próxima recompensa": la que el servidor dice que está más cerca (menos puntos faltantes); si ya
 * alcanza alguna, la más barata de esas. null si no hay recompensas.
 */
export function nextReward(rewards: Reward[]): Reward | null {
  if (rewards.length === 0) return null
  const affordable = availableRewards(rewards).sort((a, b) => a.pointsCost - b.pointsCost)
  if (affordable[0]) return affordable[0]
  const missing = rewards
    .filter((reward) => reward.status === 'INSUFFICIENT_POINTS')
    .sort((a, b) => a.missingPoints - b.missingPoints || a.pointsCost - b.pointsCost)
  return missing[0] ?? null
}

/** Huella del carrito: si cambia (otro producto, cantidad o envase), una cotización anterior ya no vale. */
export function cartKey(items: CartItem[]): string {
  return items
    .map((item) => `${item.productId}:${item.quantity}:${item.optionName ?? ''}:${item.addonName ?? ''}:${item.packagingName ?? ''}`)
    .sort()
    .join('|')
}

export function formatPoints(points: number): string {
  return `${points.toLocaleString('es')} ${points === 1 ? 'punto' : 'puntos'}`
}

/** Códigos del servidor que dejan el canje aplicado sin sentido y obligan a refrescar la información. */
export const REDEMPTION_REFRESH_CODES = [
  'INSUFFICIENT_POINTS',
  'POINTS_BALANCE_CHANGED',
  'REWARD_NOT_FOUND',
  'REWARD_INACTIVE',
  'REWARD_UNAVAILABLE',
  'REWARD_NOT_ELIGIBLE',
  'REDEMPTION_ALREADY_APPLIED',
] as const

export function isRedemptionError(code: string): boolean {
  return (REDEMPTION_REFRESH_CODES as readonly string[]).includes(code) || code === 'REDEMPTION_REQUIRES_LOGIN'
}

/** Mensaje amable por código; el del servidor solo es respaldo. Nunca falla en silencio. */
export function redemptionErrorMessage(code: string, serverMessage?: string): string {
  switch (code) {
    case 'POINTS_BALANCE_CHANGED':
      return 'Tus puntos han cambiado. Actualizamos la información. Revisa nuevamente antes de confirmar.'
    case 'INSUFFICIENT_POINTS':
      return 'Ya no tienes puntos suficientes para esta recompensa. Actualizamos tu saldo.'
    case 'REWARD_NOT_FOUND':
    case 'REWARD_INACTIVE':
      return 'Esta recompensa ya no está disponible.'
    case 'REWARD_UNAVAILABLE':
      return 'El producto de esta recompensa no está disponible ahora mismo.'
    case 'REWARD_NOT_ELIGIBLE':
      return 'Esta recompensa no se puede aplicar a los productos de tu pedido.'
    case 'REDEMPTION_ALREADY_APPLIED':
      return 'Este pedido ya tiene un canje aplicado.'
    case 'REDEMPTION_REQUIRES_LOGIN':
      return 'Inicia sesión para usar tus puntos.'
    default:
      return serverMessage ?? 'No pudimos aplicar el canje. Inténtalo de nuevo.'
  }
}

/** El canje elegido solo vale mientras el carrito sea el mismo con el que se cotizó. */
export function validApplied(applied: AppliedRedemption | null, items: CartItem[]): AppliedRedemption | null {
  return applied && applied.cartKey === cartKey(items) ? applied : null
}
