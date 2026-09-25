import { useEffect } from 'react'
import { hydrateCatalogFromStorage, syncCatalog } from '../services/catalogSync'
import { useCatalogStore } from '../store/catalogStore'

/** Al volver a la pestaña, se revisa la versión del catálogo si pasó al menos esto desde el último sync. */
const RESYNC_ON_RETURN_MS = 5 * 60 * 1000

/**
 * Arranque del catálogo — `useCatalogBootstrap` de mobile: mostrar la caché local de inmediato,
 * sincronizar en segundo plano y reintentar cuando vuelve la conexión. En la web además se revisa
 * al volver a la pestaña (equivalente a que la app vuelva a primer plano), sin hacerlo a cada rato.
 * Llamar una sola vez, en la raíz.
 */
export function useCatalogBootstrap(): void {
  useEffect(() => {
    hydrateCatalogFromStorage()
    void syncCatalog()

    const onOnline = () => void syncCatalog()
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      const { lastSyncedAt } = useCatalogStore.getState()
      if (!lastSyncedAt || Date.now() - Date.parse(lastSyncedAt) > RESYNC_ON_RETURN_MS) void syncCatalog()
    }
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
}
