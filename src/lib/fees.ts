import type { CartItem } from '../types'
import { lineTotal } from './cart'

export interface FeeBreakdown {
  base: number
  surcharge: number
  fee: number
  isLate: boolean
  multiBusiness: boolean
}

/** En Tráelo Familia el costo de mensajería está incluido en el precio. */
export function computeFee(_items: CartItem[], _when: Date = new Date()): FeeBreakdown {
  return { base: 0, surcharge: 0, fee: 0, isLate: false, multiBusiness: false }
}

export function subtotalOf(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + lineTotal(i), 0)
}
