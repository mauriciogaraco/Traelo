import type { CartItem } from '../types'
import { lineTotal } from './cart'
import { businessById } from '../data/catalog'
import { USD_EXCHANGE_RATE } from './config'

/** Tarifa base global (negocios sin tarifa propia). */
export const FEE_BASE = 250
/** A partir de esta hora (24h) la tarifa sube +100. */
export const LATE_HOUR = 19
export const FEE_LATE_SURCHARGE = 100
/** Recargo por cada negocio extra en el carrito. */
export const MULTI_BUSINESS_SURCHARGE = 100
/** Subtotal CUP a partir del cual se aplica el recargo por volumen. */
export const FEE_BULK_THRESHOLD = 10_000
/** Recargo por volumen (solo cuando la base es la tarifa sencilla de 250 CUP). */
export const FEE_BULK_SURCHARGE = 100

export interface FeeBreakdown {
  base: number
  surcharge: number
  fee: number
  isLate: boolean
  multiBusiness: boolean
  isBulk: boolean
}

/**
 * Calcula la tarifa de mensajería:
 * - Base = tarifa más alta entre los negocios del carrito (cada uno puede tener su propia tarifa).
 * - +100 CUP si es tarde (≥ 19h).
 * - +100 CUP por cada negocio extra (2 negocios → +100, 3 → +200, …).
 * - +100 CUP si la tarifa base es 250 y el subtotal CUP supera 10 000.
 */
export function computeFee(items: CartItem[], when: Date = new Date()): FeeBreakdown {
  if (items.length === 0) {
    return { base: 0, surcharge: 0, fee: 0, isLate: false, multiBusiness: false, isBulk: false }
  }
  const businessIds = [...new Set(items.map((i) => i.product.businessId))]
  const base = Math.max(...businessIds.map((id) => businessById(id)?.deliveryFee ?? FEE_BASE))
  const isLate = when.getHours() >= LATE_HOUR
  const lateSurcharge = isLate ? FEE_LATE_SURCHARGE : 0
  const businessCount = businessIds.length
  const multiBusiness = businessCount > 1
  const multiSurcharge = multiBusiness ? (businessCount - 1) * MULTI_BUSINESS_SURCHARGE : 0
  // Solo cuenta productos en CUP para el umbral de volumen.
  const cupSubtotal = items
    .filter(i => (i.product.currency ?? businessById(i.product.businessId)?.currency) !== 'USD')
    .reduce((sum, i) => sum + lineTotal(i), 0)
  const isBulk = base === FEE_BASE && cupSubtotal > FEE_BULK_THRESHOLD
  const bulkSurcharge = isBulk ? FEE_BULK_SURCHARGE : 0
  const surcharge = lateSurcharge + multiSurcharge + bulkSurcharge
  return { base, surcharge, fee: base + surcharge, isLate, multiBusiness, isBulk }
}

export function subtotalOf(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + lineTotal(i), 0)
}

/**
 * "Servicio Tráelo": suma de las comisiones (negocio + cliente) de cada
 * negocio del carrito, siempre cobrada en CUP, redondeada hacia arriba al
 * múltiplo de 10 más cercano. Se aplica sobre el subtotal en CUP tal cual;
 * sobre el subtotal en USD (productos en esa moneda, ej: Los Reales, Eme
 * Boutique) se aplica igual el % pero convertido a CUP con USD_EXCHANGE_RATE,
 * ya que el servicio nunca se cobra en USD.
 */
export function computeServiceFee(items: CartItem[]): number {
  const cupSubtotalByBusiness = new Map<string, number>()
  const usdSubtotalByBusiness = new Map<string, number>()
  for (const item of items) {
    const isUsd = (item.product.currency ?? businessById(item.product.businessId)?.currency) === 'USD'
    const id = item.product.businessId
    const map = isUsd ? usdSubtotalByBusiness : cupSubtotalByBusiness
    map.set(id, (map.get(id) ?? 0) + lineTotal(item))
  }
  const businessIds = new Set([...cupSubtotalByBusiness.keys(), ...usdSubtotalByBusiness.keys()])
  let raw = 0
  for (const businessId of businessIds) {
    const biz = businessById(businessId)
    const pct = (biz?.businessCommission ?? 0) + (biz?.clientCommission ?? 0)
    const cupSubtotal = cupSubtotalByBusiness.get(businessId) ?? 0
    const usdSubtotal = usdSubtotalByBusiness.get(businessId) ?? 0
    raw += (cupSubtotal * pct) / 100
    raw += ((usdSubtotal * pct) / 100) * USD_EXCHANGE_RATE
  }
  return Math.ceil(raw / 10) * 10
}
