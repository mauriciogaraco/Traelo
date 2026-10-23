import type { CartItem } from '../../store/cartStore'
import { lineIdOf, packSizeOf } from './lines'

/**
 * Pago con puntos en el checkout (1 punto = 1 CUP). El cliente elige cuántas unidades de cada línea
 * paga con puntos; un producto se paga COMPLETO (unidades enteras) y el pedido puede pagarse en
 * parte. Todo aquí es ESTIMADO para mostrar: los puntos exactos, el saldo y los totales los decide el
 * servidor (cotización). Los puntos nunca cubren mensajería, Servicio Tráelo ni envase.
 */
export type PointsUnits = Record<string, number>

/** Precio estimado de UNA unidad de la línea (producto + agrego por unidad de caja), en CUP = puntos. */
export function unitPointsEstimate(item: CartItem): number {
  const packSize = packSizeOf(item.formatoSnapshot)
  return Math.ceil((item.priceSnapshot ?? 0) + (item.addonPriceSnapshot ?? 0) * packSize)
}

/** Unidades elegidas para una línea, siempre entre 0 y su cantidad. */
export function unitsForLine(item: CartItem, units: PointsUnits): number {
  return Math.max(0, Math.min(item.quantity, Math.floor(units[lineIdOf(item)] ?? 0)))
}

/** Deja solo líneas que siguen en el carrito y unidades válidas (el carrito pudo cambiar). */
export function sanitizeUnits(items: CartItem[], units: PointsUnits): PointsUnits {
  const clean: PointsUnits = {}
  for (const item of items) {
    const n = unitsForLine(item, units)
    if (n > 0 && unitPointsEstimate(item) > 0) clean[lineIdOf(item)] = n
  }
  return clean
}

/** Puntos que costaría lo elegido (estimado). */
export function estimatePointsCost(items: CartItem[], units: PointsUnits): number {
  return items.reduce((sum, item) => sum + unitsForLine(item, units) * unitPointsEstimate(item), 0)
}

/** Puntos que costaría pagar TODOS los productos del carrito con puntos (estimado). */
export function estimateAllProductsInPoints(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * unitPointsEstimate(item), 0)
}

/**
 * "Pagar todo con puntos": llena las líneas en orden con unidades enteras mientras alcance el saldo.
 * Si no alcanza para todo, paga con puntos todo lo que sí puede y el resto queda en efectivo.
 */
export function payAllWithPoints(items: CartItem[], balance: number): PointsUnits {
  const units: PointsUnits = {}
  let remaining = balance
  for (const item of items) {
    const unit = unitPointsEstimate(item)
    if (unit <= 0) continue
    const affordable = Math.min(item.quantity, Math.floor(remaining / unit))
    if (affordable > 0) {
      units[lineIdOf(item)] = affordable
      remaining -= affordable * unit
    }
  }
  return units
}

/** ¿Alcanza el saldo para más unidades de esta línea? (para habilitar el botón "+"). */
export function canAddUnit(item: CartItem, units: PointsUnits, items: CartItem[], balance: number): boolean {
  const current = unitsForLine(item, units)
  if (current >= item.quantity) return false
  const unit = unitPointsEstimate(item)
  return unit > 0 && estimatePointsCost(items, units) + unit <= balance
}
