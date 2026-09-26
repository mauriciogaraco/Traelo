import { useEffect } from 'react'
import { hydrateAuth } from '../services/authService'

/**
 * Arranque de sesión: lee la sesión guardada (sin pedir login jamás — sin sesión la web queda
 * como invitado). Llamar una sola vez, en la raíz de la app.
 */
export function useSessionBootstrap() {
  useEffect(() => {
    void hydrateAuth()
  }, [])
}
