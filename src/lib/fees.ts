import type { CartItem } from '../types'
import { lineTotal } from './cart'

export interface FeeBreakdown {
  base: number
  surcharge: number
  fee: number
  isLate: boolean
  multiBusiness: boolean
}

/** Comisión Zelle del 10% sobre el subtotal. La mensajería está incluida en el precio. */
export function computeFee(items: CartItem[], _when: Date = new Date()): FeeBreakdown {
  const subtotal = subtotalOf(items)
  const fee = Math.round(subtotal * 0.10 * 100) / 100
  return { base: 0, surcharge: 0, fee, isLate: false, multiBusiness: false }
}

export function subtotalOf(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + lineTotal(i), 0)
}
