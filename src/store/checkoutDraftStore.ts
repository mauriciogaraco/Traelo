import { create } from 'zustand';
import type { DeliveryLocation } from '../types/backend/location';

/** Lo que la persona ya escribió/eligió en "Confirmar pedido" (paso 1 y 2). */
export type CheckoutDraft = {
  name: string;
  phone: string;
  address: string;
  reference: string;
  selectedAddressId: string | null;
  useNewAddress: boolean;
  /** undefined = nadie lo tocó; null = "sin ubicación" a propósito; objeto = pin de este pedido. */
  pinOverride: DeliveryLocation | null | undefined;
  step: 'where' | 'review';
  /** Hora elegida ("7:30 pm"); null = lo antes posible. */
  deliveryTime?: string | null;
};

type CheckoutDraftState = {
  draft: CheckoutDraft | null;
  save: (draft: CheckoutDraft) => void;
  clear: () => void;
};

/**
 * Borrador del formulario de entrega. Si al confirmar el pedido el carrito tiene un problema (un
 * producto agotado, un local cerrado…) hay que volver al carrito a arreglarlo; sin este borrador la
 * persona tendría que escribir todo otra vez. Vive solo en memoria (no se guarda en disco) y se
 * borra al crear el pedido.
 */
export const useCheckoutDraftStore = create<CheckoutDraftState>((set) => ({
  draft: null,
  save: (draft) => set({ draft }),
  clear: () => set({ draft: null }),
}));
