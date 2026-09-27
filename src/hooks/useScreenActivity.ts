import { useEffect, useState } from 'react'

/**
 * ¿La pantalla está a la vista y hay conexión? El seguimiento en vivo solo consulta cuando ambas
 * cosas son ciertas: una pestaña en segundo plano o sin red no gasta datos ni batería.
 */
export function useScreenActivity() {
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || document.visibilityState !== 'hidden')
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine !== false)

  useEffect(() => {
    const onVisibility = () => setVisible(document.visibilityState !== 'hidden')
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return { visible, online }
}
