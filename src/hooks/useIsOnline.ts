import { useSyncExternalStore } from 'react'

function subscribe(listener: () => void): () => void {
  window.addEventListener('online', listener)
  window.addEventListener('offline', listener)
  return () => {
    window.removeEventListener('online', listener)
    window.removeEventListener('offline', listener)
  }
}

/**
 * ¿Hay conexión? Equivalente web de `useIsOnline` de la app móvil (NetInfo → navigator.onLine).
 * Ante la duda cuenta como en línea: una lectura incierta nunca debe bloquear ni asustar a nadie.
 */
export function useIsOnline(): boolean {
  return useSyncExternalStore(subscribe, () => navigator.onLine !== false, () => true)
}
