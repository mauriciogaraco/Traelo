import { create } from 'zustand'
import type { OrderQuote, Reward } from '../types/backend/rewards'

/** Un canje ELEGIDO y confirmado en el carrito. Todavía no se descontó nada: los puntos se descuentan al crear el pedido. */
export type AppliedRedemption = {
  reward: Reward
  /** Saldo que se mostró al confirmar; el servidor lo usa solo para detectar datos viejos. */
  expectedBalance: number
  /** Cotización del servidor con la que se confirmó (solo para mostrar). */
  quote: OrderQuote
  /** Huella del carrito al confirmar: si el carrito cambia, la cotización deja de valer. */
  cartKey: string
}

type RewardsState = {
  /** false hasta la primera respuesta del servidor (la UI no muestra nada antes: cero parpadeos falsos). */
  loaded: boolean
  rewards: Reward[]
  /** Saldo contra el que el servidor calculó los estados de las recompensas (null = invitado). */
  balance: number | null
  applied: AppliedRedemption | null

  setSnapshot: (snapshot: { rewards: Reward[]; balance: number | null }) => void
  setApplied: (applied: AppliedRedemption | null) => void
  clear: () => void
}

/** Espejo de las recompensas y del canje en curso (`services/rewardsService` es quien lo escribe). */
export const useRewardsStore = create<RewardsState>((set) => ({
  loaded: false,
  rewards: [],
  balance: null,
  applied: null,

  setSnapshot: ({ rewards, balance }) => set({ loaded: true, rewards, balance }),
  setApplied: (applied) => set({ applied }),
  clear: () => set({ loaded: false, rewards: [], balance: null, applied: null }),
}))
