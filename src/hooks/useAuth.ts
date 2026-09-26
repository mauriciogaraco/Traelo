import { useSessionStore } from '../store/sessionStore'

/** Estado de sesión para la UI. GUEST es el estado normal: nada de la web exige cuenta para comprar. */
export function useAuth() {
  const status = useSessionStore((state) => state.status)
  const customer = useSessionStore((state) => state.customer)
  return {
    status,
    customer,
    isAuthenticated: status === 'AUTHENTICATED',
    isGuest: status === 'GUEST',
    isLoading: status === 'LOADING',
  }
}
