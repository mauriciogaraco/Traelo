import type { CartItem } from '../../store/cartStore';
import type { CatalogBusiness } from '../../types/backend/catalog';
import { estimateCartLine } from './lines';

export type CartBusinessGroup = {
  businessId: string;
  business: CatalogBusiness | undefined;
  items: CartItem[];
  /** Suma informativa del grupo — el backend recalcula todo en /checkout (checklist §21). */
  subtotalEstimate: number;
};

/** Checklist §22 — nunca mezclar productos de distintos negocios: agrupar siempre antes de mostrar. */
export function groupCartByBusiness(items: CartItem[], businesses: CatalogBusiness[]): CartBusinessGroup[] {
  const byId = new Map(businesses.map((b) => [b.id, b]));
  const groups = new Map<string, CartItem[]>();

  for (const item of items) {
    const list = groups.get(item.businessId) ?? [];
    list.push(item);
    groups.set(item.businessId, list);
  }

  return Array.from(groups.entries()).map(([businessId, groupItems]) => ({
    businessId,
    business: byId.get(businessId),
    items: groupItems,
    subtotalEstimate: groupItems.reduce((sum, i) => sum + estimateCartLine(i), 0),
  }));
}
