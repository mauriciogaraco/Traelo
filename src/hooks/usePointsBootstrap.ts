import { useEffect } from 'react'
import { refreshPoints, resetPointsState } from '../services/pointsService'
import { refreshRewards, resetRewardsState } from '../services/rewardsService'
import { usePointsStore } from '../store/pointsStore'
import { useSessionStore } from '../store/sessionStore'

/**
 * Mantiene vivos los puntos de la cuenta: los trae al abrir la web / iniciar sesión, cada vez que
 * la pestaña vuelve a estar visible (donde el cliente ve su pedido completado) y los borra al
 * cerrar sesión. Las recompensas se traen aparte (también para invitados: pueden ver qué se
 * canjea) y se vuelven a pedir cuando cambia el saldo, porque el servidor es quien dice qué
 * alcanza y cuánto falta. Llamar una sola vez, en la raíz de la app.
 */
export function usePointsBootstrap() {
  const customerId = useSessionStore((state) => state.customer?.id ?? null)
  const balance = usePointsStore((state) => state.balance)

  useEffect(() => {
    resetRewardsState()
    void refreshRewards()
    if (customerId) {
      void refreshPoints()
    } else {
      resetPointsState()
    }
  }, [customerId])

  // Saldo nuevo (pedido completado, canje, corrección) → los estados de las recompensas cambian.
  useEffect(() => {
    if (customerId) void refreshRewards()
  }, [customerId, balance])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      void refreshRewards()
      if (customerId) void refreshPoints()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [customerId])
}
