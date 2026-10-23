import { create } from 'zustand'
import type { PointsUnits } from '../features/cart/pointsPayment'

type PointsPaymentState = {
  /** Unidades de cada línea del carrito (por lineIdOf) que se pagan con puntos en ESTE pedido. */
  units: PointsUnits
  setUnits: (units: PointsUnits) => void
  setLine: (lineId: string, units: number) => void
  clear: () => void
}

/**
 * Lo que la persona eligió pagar con puntos en el checkout. Vive en memoria (no se guarda en el
 * navegador): es una decisión de ESTE pedido y se borra al crearlo. El servidor decide los puntos y el
 * saldo reales; esto solo dice cuántas unidades de cada línea van con puntos.
 */
export const usePointsPaymentStore = create<PointsPaymentState>((set) => ({
  units: {},
  setUnits: (units) => set({ units }),
  setLine: (lineId, units) =>
    set((state) => {
      const next = { ...state.units }
      if (units > 0) next[lineId] = units
      else delete next[lineId]
      return { units: next }
    }),
  clear: () => set({ units: {} }),
}))
