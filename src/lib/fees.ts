import type { CartItem } from '../types'
import { lineTotal } from './cart'

/** Reglas de mensajería. */
export const FEE_BASE = 250
/** A partir de esta hora (24h) la tarifa sube. */
export const LATE_HOUR = 19
export const FEE_LATE = 350
/** Recargo si el pedido incluye productos de más de un negocio. */
export const MULTI_BUSINESS_SURCHARGE = 100

export interface FeeBreakdown {
  base: number
  surcharge: number
  fee: number
  isLate: boolean
  multiBusiness: boolean
}

/**
 * Calcula la tarifa de mensajería para una entrega en el momento `when`:
 * - 250 CUP normal, 350 CUP a partir de las 7:00 pm.
 * - +100 CUP si hay productos de más de un negocio.
 */
export function computeFee(items: CartItem[], when: Date = new Date()): FeeBreakdown {
  if (items.length === 0) {
    return { base: 0, surcharge: 0, fee: 0, isLate: false, multiBusiness: false }
  }
  const isLate = when.getHours() >= LATE_HOUR
  const base = isLate ? FEE_LATE : FEE_BASE
  const multiBusiness = new Set(items.map((i) => i.product.businessId)).size > 1
  const surcharge = multiBusiness ? MULTI_BUSINESS_SURCHARGE : 0
  return { base, surcharge, fee: base + surcharge, isLate, multiBusiness }
}

export function subtotalOf(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + lineTotal(i), 0)
}
