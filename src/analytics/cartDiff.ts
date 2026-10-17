import { lineIdOf } from '../features/cart/lines'
import type { CartItem } from '../store/cartStore'

export type CartChange = {
  type: 'add_to_cart' | 'remove_from_cart'
  productId: string
  businessId: string
  /** Unidades que cambiaron en esa línea (siempre positivo). */
  quantity: number
  /** Precio por unidad que tenía el carrito al agregar (informativo; el servidor recalcula al pedir). */
  price: number | null
}

/**
 * Qué cambió entre dos estados del carrito, por línea (producto + tipo + agrego + envase). Sirve
 * para registrar "agregó / quitó N" sin tocar cada sitio que modifica el carrito (tarjeta, ficha,
 * página del carrito, vaciar…).
 */
export function diffCartItems(previous: CartItem[], next: CartItem[]): CartChange[] {
  const before = new Map(previous.map((item) => [lineIdOf(item), item]))
  const after = new Map(next.map((item) => [lineIdOf(item), item]))
  const changes: CartChange[] = []

  for (const [lineId, item] of after) {
    const delta = item.quantity - (before.get(lineId)?.quantity ?? 0)
    if (delta > 0) {
      changes.push({
        type: 'add_to_cart',
        productId: item.productId,
        businessId: item.businessId,
        quantity: delta,
        price: item.priceSnapshot,
      })
    }
  }

  for (const [lineId, item] of before) {
    const delta = (after.get(lineId)?.quantity ?? 0) - item.quantity
    if (delta < 0) {
      changes.push({
        type: 'remove_from_cart',
        productId: item.productId,
        businessId: item.businessId,
        quantity: -delta,
        price: item.priceSnapshot,
      })
    }
  }

  return changes
}
