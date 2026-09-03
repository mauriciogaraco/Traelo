import type { CartItem, Product } from '../types'

/** ¿El producto tiene tipos/sabores a elegir? */
export function hasOptions(product: Product): boolean {
  return Array.isArray(product.options) && product.options.length > 0
}

/** ¿El producto admite agregos (extras)? */
export function hasAddons(product: Product): boolean {
  return Array.isArray(product.addons) && product.addons.length > 0
}

/** ¿El producto requiere elegir envase para llevar? */
export function hasPackaging(product: Product): boolean {
  return Array.isArray(product.packaging) && product.packaging.length > 0
}

/**
 * Identidad de una línea de carrito: el mismo producto con distinto tipo,
 * agrego o envase cuenta como líneas separadas.
 */
export function lineId(
  productId: string,
  option?: string,
  addonName?: string,
  packagingName?: string,
): string {
  return [productId, option ?? '', addonName ?? '', packagingName ?? ''].join('::')
}

export function itemLineId(item: CartItem): string {
  return lineId(item.product.id, item.option, item.addon?.name, item.packaging?.name)
}

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

/**
 * Total de la línea. Sin `packaging.capacity`, el envase se cobra una vez
 * por lote (quantity) — igual que antes. Con `capacity` (ej: 4 dulces por
 * caja), se cobra un envase por cada bloque de esa cantidad de unidades,
 * sin importar cuántas líneas de "quantity" hicieron falta para llegar ahí.
 */
export function lineTotal(item: CartItem): number {
  const ps = packSize(item.product)
  const units = item.quantity * ps
  const basePerUnit = item.product.price + (item.addon?.price ?? 0)
  const capacity = item.packaging?.capacity
  const packagingCount = !item.packaging
    ? 0
    : capacity && capacity > 0
      ? Math.ceil(units / capacity)
      : item.quantity
  return basePerUnit * units + (item.packaging?.price ?? 0) * packagingCount
}
