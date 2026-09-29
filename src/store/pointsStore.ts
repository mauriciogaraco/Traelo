import { create } from 'zustand'
import type { PointsTransaction } from '../types/backend/points'

type PointsState = {
  /** false hasta la primera respuesta del backend (la UI muestra un esqueleto, no un 0 falso). */
  loaded: boolean
  balance: number
  divisor: number
  firstOrderBonus: { points: number; available: boolean }
  transactions: PointsTransaction[]

  setSnapshot: (snapshot: {
    balance: number
    divisor: number
    firstOrderBonus: { points: number; available: boolean }
    transactions: PointsTransaction[]
  }) => void
  clear: () => void
}

/** Espejo de los puntos de la cuenta actual (`services/pointsService` es quien lo escribe). */
export const usePointsStore = create<PointsState>((set) => ({
  loaded: false,
  balance: 0,
  divisor: 10,
  firstOrderBonus: { points: 0, available: false },
  transactions: [],

  setSnapshot: ({ balance, divisor, firstOrderBonus, transactions }) =>
    set({
      loaded: true,
      balance: balance ?? 0,
      divisor: divisor ?? 10,
      firstOrderBonus: firstOrderBonus ?? { points: 0, available: false },
      transactions: transactions ?? [],
    }),
  clear: () => set({ loaded: false, balance: 0, transactions: [] }),
}))
