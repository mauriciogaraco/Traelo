import { useState } from 'react'
import { readStorage, writeStorage, STORAGE_KEYS } from '../../lib/storage'

/**
 * Versión de la web (mayor.menor). Súbela (1.10 → 1.11…) para mostrar el aviso "Actualizamos Tráelo" a quien
 * no tenga guardada ninguna versión o tenga una MENOR; quien ya aceptó esta (o una mayor) no lo vuelve a ver.
 */
export const WEB_VERSION = '1.11'

const CLEANUP_TIMEOUT_MS = 3000

/** Convierte "1.10" en [1, 10]; cualquier otra cosa (p. ej. la fecha de avisos viejos) no es una versión. */
function parseVersion(value: string | null | undefined): number[] | null {
  if (typeof value !== 'string' || !/^\d+(\.\d+)*$/.test(value.trim())) return null
  return value.trim().split('.').map(Number)
}

/** true si `a` es una versión menor que `b`, comparando número a número (1.9 < 1.10). */
export function isOlderVersion(a: string | null | undefined, b: string): boolean {
  const left = parseVersion(a)
  const right = parseVersion(b)
  if (!right) return false
  if (!left) return true // sin versión guardada (o ilegible): hay que avisar
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0)
    if (diff !== 0) return diff < 0
  }
  return false
}

function storedVersion(): string | null {
  const local = readStorage<string | null>(STORAGE_KEYS.refreshAck, null)
  if (parseVersion(local)) return local
  try {
    return sessionStorage.getItem(STORAGE_KEYS.refreshAck)
  } catch {
    return null
  }
}

function alreadyAccepted(): boolean {
  return !isOlderVersion(storedVersion(), WEB_VERSION)
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
    writeStorage(STORAGE_KEYS.refreshAck, WEB_VERSION)
    try {
      sessionStorage.setItem(STORAGE_KEYS.refreshAck, WEB_VERSION)
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
            Hicimos cambios en la web (versión {WEB_VERSION}). Para que todo funcione bien necesitamos refrescarla. Toca{' '}
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
