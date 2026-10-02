import type { CartItem } from '../../store/cartStore';
import { estimateCartLine } from './lines';

export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

/** Estimado informativo — nunca se envía ni se trata como total real (checklist §13/§21). */
export function getCartSubtotalEstimate(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + estimateCartLine(i), 0);
}
