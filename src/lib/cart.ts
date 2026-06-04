import type { CartItem, Product } from '../types'

/** Unidades por caja/paquete (1 si el producto se vende por unidad). */
export function packSize(product: Product): number {
  return product.formato && product.formato > 1 ? product.formato : 1
}

/** ¿El producto se vende por caja/paquete (formato > 1)? */
export function hasFormato(product: Product): boolean {
  return packSize(product) > 1
}

/**
 * En el carrito, `quantity` representa el nº de CAJAS/paquetes.
 * Para un producto por unidad, packSize = 1, así que cajas == unidades.
 */
export function unitsOf(item: CartItem): number {
  return item.quantity * packSize(item.product)
}

/** Total de la línea = precio por unidad × unidades totales. */
export function lineTotal(item: CartItem): number {
  return item.product.price * unitsOf(item)
}
