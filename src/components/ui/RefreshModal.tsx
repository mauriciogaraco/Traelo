import { useState } from 'react'
import { readStorage, writeStorage, STORAGE_KEYS } from '../../lib/storage'

/**
 * Súbelo (cualquier texto nuevo) para volver a mostrar el aviso a TODOS los
 * clientes una vez más, por ejemplo tras un cambio que exija limpiar el caché.
 */
const REFRESH_VERSION = '2026-09-24'

const CLEANUP_TIMEOUT_MS = 3000

function alreadyAccepted(): boolean {
  if (readStorage<string | null>(STORAGE_KEYS.refreshAck, null) === REFRESH_VERSION) return true
  try {
    return sessionStorage.getItem(STORAGE_KEYS.refreshAck) === REFRESH_VERSION
  } catch {
    return false
  }
}

/** Da de baja los service workers y borra el caché de la app. NO toca localStorage (carrito, pedidos, dirección). */
async function clearAppCaches(): Promise<void> {
  const work = (async () => {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
    }
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
  })()
  // Nunca dejar el botón colgado: si algo tarda, se recarga igual.
  await Promise.race([work.catch(() => {}), new Promise((resolve) => setTimeout(resolve, CLEANUP_TIMEOUT_MS))])
}

export function RefreshModal() {
  const [open] = useState(() => !alreadyAccepted())
  const [busy, setBusy] = useState(false)

  if (!open) return null

  async function accept() {
    if (busy) return
    setBusy(true)
    writeStorage(STORAGE_KEYS.refreshAck, REFRESH_VERSION)
    try {
      sessionStorage.setItem(STORAGE_KEYS.refreshAck, REFRESH_VERSION)
    } catch {
      /* sessionStorage no disponible */
    }
    await clearAppCaches()
    window.location.reload()
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="refresh-modal-title"
    >
      <div className="w-full max-w-sm rounded-3xl bg-surface shadow-2xl overflow-hidden animate-scale-in">
        <div className="h-2 bg-gradient-primary" />
        <div className="p-7 text-center">
          <div className="mb-4 text-5xl" aria-hidden="true">
            🔄
          </div>
          <h2 id="refresh-modal-title" className="text-xl font-extrabold text-text-primary">
            Actualizamos Tráelo
          </h2>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed">
            Para que tus pedidos se envíen sin problemas necesitamos refrescar la app. Toca{' '}
            <span className="font-bold text-text-primary">Aceptar</span>. Tu carrito, tu dirección y tus pedidos se
            conservan.
          </p>
          <button
            onClick={accept}
            disabled={busy}
            className="mt-6 h-14 w-full rounded-2xl bg-gradient-primary text-white text-base font-bold shadow-btn-primary active:scale-[0.98] disabled:opacity-70 transition-all"
          >
            {busy ? 'Actualizando…' : 'Aceptar'}
          </button>
        </div>
      </div>
    </div>
  )
}
