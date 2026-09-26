import type { CartItem } from '../../store/cartStore';
import type { CatalogAddonOption, CatalogPackagingOption, CatalogProduct } from '../../types/backend/catalog';

/** Lo que la persona eligió para UNA línea del carrito además del producto. */
export type LineSelection = {
  optionName?: string | null;
  addonName?: string | null;
  packagingName?: string | null;
};

const clean = (value: string | null | undefined) => (value ?? '').trim();

/**
 * Identidad de una línea: el MISMO producto con otro tipo, otro agrego u otro envase es OTRA línea
 * (el mismo, tal cual, suma cantidad). Sin ninguna elección es solo el productId, así que un carrito
 * de antes de estas reglas sigue funcionando sin migrar nada.
 */
export function lineIdOf(item: Pick<CartItem, 'productId' | 'optionName' | 'addonName' | 'packagingName'>): string {
  const option = clean(item.optionName);
  const addon = clean(item.addonName);
  const packaging = clean(item.packagingName);
  return option || addon || packaging ? `${item.productId}|${option}|${addon}|${packaging}` : item.productId;
}

/** Unidades por caja (1 si se vende por unidad). */
export function packSizeOf(formato: number | null | undefined): number {
  return formato && formato > 1 ? formato : 1;
}

/** ¿Hay que elegir un tipo/sabor antes de agregar? (obligatorio si el producto los tiene). */
export function requiresOption(product: Pick<CatalogProduct, 'options'>): boolean {
  return (product.options?.length ?? 0) > 0;
}

/** El envase más barato: viene preseleccionado (y si hay uno solo, va automático). */
export function cheapestPackaging(product: Pick<CatalogProduct, 'packaging'>): CatalogPackagingOption | null {
  const list = product.packaging ?? [];
  if (list.length === 0) return null;
  return [...list].sort((a, b) => a.price - b.price)[0];
}

/**
 * ¿Se puede agregar con un solo toque (desde las tarjetas)? No si exige elegir tipo/sabor: hay que
 * abrir el producto. El envase no estorba: se preselecciona el más barato.
 */
export function canQuickAdd(product: Pick<CatalogProduct, 'options'>): boolean {
  return !requiresOption(product);
}

/** La selección que se usa cuando no se eligió nada a mano: solo el envase más barato, si hay. */
export function defaultSelection(product: Pick<CatalogProduct, 'packaging'>): LineSelection {
  return { packagingName: cheapestPackaging(product)?.name ?? null };
}

export function findAddon(product: Pick<CatalogProduct, 'addons'>, name: string | null | undefined): CatalogAddonOption | null {
  const wanted = clean(name).toLowerCase();
  if (!wanted) return null;
  return product.addons?.find((a) => a.name.toLowerCase() === wanted) ?? null;
}

export function findPackaging(product: Pick<CatalogProduct, 'packaging'>, name: string | null | undefined): CatalogPackagingOption | null {
  const wanted = clean(name).toLowerCase();
  if (!wanted) return null;
  return product.packaging?.find((p) => p.name.toLowerCase() === wanted) ?? null;
}

type EstimateInput = {
  price: number | null | undefined;
  quantity: number;
  formato?: number | null;
  addonPrice?: number | null;
  packagingPrice?: number | null;
  packagingCapacity?: number | null;
};

/**
 * ESTIMADO de una línea (solo para mostrar; el total real lo calcula siempre el servidor con el
 * catálogo vigente). Mismas reglas que el servidor: `price` es el de lo que cuenta `quantity` (la
 * caja si hay formato); el agrego se cobra por cada unidad de la caja; el envase, uno cada
 * `capacity` unidades (redondeando hacia arriba) o uno por cada caja/unidad pedida si no tiene capacity.
 *   línea = (precio + agrego × unidadesPorCaja) × cantidad + envase × nºEnvases
 */
export function estimateLine(input: EstimateInput): number {
  const packSize = packSizeOf(input.formato);
  const pack = (input.price ?? 0) + (input.addonPrice ?? 0) * packSize;
  const units = input.quantity * packSize;
  const packagingCount = input.packagingPrice
    ? input.packagingCapacity && input.packagingCapacity > 0
      ? Math.ceil(units / input.packagingCapacity)
      : input.quantity
    : 0;
  return pack * input.quantity + (input.packagingPrice ?? 0) * packagingCount;
}

export function estimateCartLine(item: CartItem): number {
  return estimateLine({
    price: item.priceSnapshot,
    quantity: item.quantity,
    formato: item.formatoSnapshot,
    addonPrice: item.addonPriceSnapshot,
    packagingPrice: item.packagingPriceSnapshot,
    packagingCapacity: item.packagingCapacitySnapshot,
  });
}
