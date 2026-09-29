import { getMyPoints } from '../api/points'
import { usePointsStore } from '../store/pointsStore'
import { useSessionStore } from '../store/sessionStore'

let inFlight: Promise<boolean> | null = null

/**
 * Trae saldo e historial. Se llama al iniciar sesión y cuando un pedido pasa a entregado (el
 * backend acredita los puntos entonces). Un solo vuelo a la vez. NUNCA lanza: los puntos son un
 * extra y un fallo (sin red, servidor) no debe molestar; se conserva lo último visto. Devuelve
 * true si logró actualizar (las pantallas lo usan para mostrar "reintentar").
 */
export function refreshPoints(): Promise<boolean> {
  if (inFlight) return inFlight

  inFlight = (async () => {
    const { status, customer } = useSessionStore.getState()
    if (status !== 'AUTHENTICATED' || !customer) return false
    const customerId = customer.id

    try {
      const { data } = await getMyPoints()
      // La sesión cambió mientras esperaba (cerró sesión / otra cuenta): esta respuesta ya no aplica.
      if (useSessionStore.getState().customer?.id !== customerId) return false
      usePointsStore.getState().setSnapshot(data)
      return true
    } catch {
      return false
    }
  })().finally(() => {
    inFlight = null
  })

  return inFlight
}

export function resetPointsState(): void {
  usePointsStore.getState().clear()
}
