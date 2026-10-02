import { useEffect } from 'react'
import { migrateLegacyAddress, migrateLegacyCart } from '../lib/legacyMigration'
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
    migrateLegacyAddress()
    void syncCatalog()

    // El carrito de la web anterior se migra con el catálogo ya sincronizado (hace falta externalId).
    let cartMigrated = false
    const tryMigrateCart = () => {
      const { products, isSyncing, lastSyncedAt } = useCatalogStore.getState()
      if (!cartMigrated && !isSyncing && lastSyncedAt) cartMigrated = migrateLegacyCart(products)
    }
    const unsubscribeCatalog = useCatalogStore.subscribe(tryMigrateCart)
    tryMigrateCart()

    const onOnline = () => void syncCatalog()
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      const { lastSyncedAt } = useCatalogStore.getState()
      if (!lastSyncedAt || Date.now() - Date.parse(lastSyncedAt) > RESYNC_ON_RETURN_MS) void syncCatalog()
    }
    // Pestaña abierta durante horas: el estado abierto/cerrado de los negocios cambia con la hora.
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void syncCatalog()
    }, RESYNC_ON_RETURN_MS)
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(interval)
      unsubscribeCatalog()
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
}
