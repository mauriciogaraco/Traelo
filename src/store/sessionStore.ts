import { create } from 'zustand'
import type { Customer } from '../types/backend/customer'

/**
 * LOADING       = todavía no se leyó la sesión guardada (solo dura un instante al abrir la web).
 * GUEST         = sin cuenta. Es el estado NORMAL: comprar no exige login.
 * AUTHENTICATED = con cuenta (hay tokens guardados).
 */
export type AuthStatus = 'LOADING' | 'GUEST' | 'AUTHENTICATED'

type SessionState = {
  status: AuthStatus
  customer: Customer | null
  setAuthenticated: (customer: Customer) => void
  setGuest: () => void
  updateCustomer: (customer: Customer) => void
}

/** Espejo reactivo de la sesión (`services/authService` es el único que lo escribe). */
export const useSessionStore = create<SessionState>((set) => ({
  status: 'LOADING',
  customer: null,
  setAuthenticated: (customer) => set({ status: 'AUTHENTICATED', customer }),
  setGuest: () => set({ status: 'GUEST', customer: null }),
  updateCustomer: (customer) => set({ customer }),
}))
