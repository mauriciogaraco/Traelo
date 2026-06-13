import type { CartItem } from '../types'
import { lineTotal } from './cart'
import { businessById } from '../data/catalog'

/** Tarifa base global (negocios sin tarifa propia). */
export const FEE_BASE = 250
/** A partir de esta hora (24h) la tarifa sube +100. */
export const LATE_HOUR = 19
export const FEE_LATE_SURCHARGE = 100
/** Recargo por cada negocio extra en el carrito. */
export const MULTI_BUSINESS_SURCHARGE = 100

export interface FeeBreakdown {
  base: number
  surcharge: number
  fee: number
  isLate: boolean
  multiBusiness: boolean
}

/**
 * Calcula la tarifa de mensajería:
 * - Base = tarifa más alta entre los negocios del carrito (cada uno puede tener su propia tarifa).
 * - +100 CUP si es tarde (≥ 19h).
 * - +100 CUP por cada negocio extra (2 negocios → +100, 3 → +200, …).
 */
export function computeFee(items: CartItem[], when: Date = new Date()): FeeBreakdown {
  if (items.length === 0) {
    return { base: 0, surcharge: 0, fee: 0, isLate: false, multiBusiness: false }
  }
  const businessIds = [...new Set(items.map((i) => i.product.businessId))]
  const base = Math.max(...businessIds.map((id) => businessById(id)?.deliveryFee ?? FEE_BASE))
  const isLate = when.getHours() >= LATE_HOUR
  const lateSurcharge = isLate ? FEE_LATE_SURCHARGE : 0
  const businessCount = businessIds.length
  const multiBusiness = businessCount > 1
  const multiSurcharge = multiBusiness ? (businessCount - 1) * MULTI_BUSINESS_SURCHARGE : 0
  const surcharge = lateSurcharge + multiSurcharge
  return { base, surcharge, fee: base + surcharge, isLate, multiBusiness }
}

export function subtotalOf(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + lineTotal(i), 0)
}
