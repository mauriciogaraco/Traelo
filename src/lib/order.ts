import type { Address, CartItem, Order } from '../types'
import { lineTotal } from './cart'
import { computeFee } from './fees'

export interface DeliveryChoice {
  /** Etiqueta legible para mostrar/guardar, ej: "Lo antes posible". */
  label: string
  /** Momento de la entrega (para calcular la tarifa según la hora). */
  when: Date
}

export interface BusinessGroup {
  businessId: string
  businessName: string
  items: CartItem[]
  subtotal: number
}

/** Agrupa los productos del carrito/pedido por negocio, conservando el orden de aparición. */
export function groupByBusiness(items: CartItem[]): BusinessGroup[] {
  const map = new Map<string, BusinessGroup>()
  for (const item of items) {
    const { businessId, businessName } = item.product
    let group = map.get(businessId)
    if (!group) {
      group = { businessId, businessName, items: [], subtotal: 0 }
      map.set(businessId, group)
    }
    group.items.push(item)
    group.subtotal += lineTotal(item)
  }
  return [...map.values()]
}

function generateOrderId(): string {
  // Pedido #XXXX — 4 dígitos legibles
  return Math.floor(1000 + Math.random() * 9000).toString()
}

/** Construye un pedido (sin persistir) a partir del carrito, la dirección y la entrega. */
export function makeOrder(items: CartItem[], address: Address, delivery: DeliveryChoice): Order {
  const subtotal = items.reduce((sum, i) => sum + lineTotal(i), 0)
  const fee = computeFee(items, delivery.when).fee
  return {
    id: generateOrderId(),
    date: new Date().toISOString(),
    items: items.map((i) => ({ ...i })),
    subtotal,
    fee,
    total: subtotal + fee,
    delivery: delivery.label,
    status: 'pendiente',
    address,
  }
}
