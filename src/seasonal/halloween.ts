/**
 * Ambientación temporal de Halloween. TODO lo estacional vive en `src/seasonal/`: esta capa solo pone
 * `data-season="halloween"` en <html> y baja `halloween.css` (que no pesa nada fuera de temporada).
 * Para retirarla: ver `docs/HALLOWEEN.md`.
 *
 * Se activa sola entre `HALLOWEEN_START` y `HALLOWEEN_END` (fecha local del dispositivo, ambas incluidas).
 * `?halloween=on|off` en la URL la fuerza para probar; `VITE_HALLOWEEN=off` en el build la apaga.
 */
export const HALLOWEEN_START = '2026-10-28'
export const HALLOWEEN_END = '2026-11-02'

function localIsoDate(now: Date): string {
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

/** ¿Cae `now` dentro de la ventana de la campaña? (comparación de fechas ISO, sin husos). */
export function isInHalloweenWindow(now: Date): boolean {
  const today = localIsoDate(now)
  return today >= HALLOWEEN_START && today <= HALLOWEEN_END
}

/** Decide si la campaña está activa. `override` es el valor de `?halloween=`; `killSwitch` el de `VITE_HALLOWEEN`. */
export function resolveHalloween(now: Date, override: string | null, killSwitch?: string): boolean {
  if (killSwitch === 'off') return false
  if (override === 'on') return true
  if (override === 'off') return false
  return isInHalloweenWindow(now)
}

let active = false

/** ¿Está activa la ambientación? Se decide una vez al arrancar (initSeason). */
export function isHalloweenActive(): boolean {
  return active
}

/** Llamar una vez antes de pintar: marca <html> y carga los estilos solo si la campaña está activa. */
export function initSeason(): void {
  if (typeof window === 'undefined') return
  let override: string | null = null
  try {
    override = new URLSearchParams(window.location.search).get('halloween')
  } catch {
    // URL ilegible: se decide solo por la fecha.
  }
  active = resolveHalloween(new Date(), override, import.meta.env.VITE_HALLOWEEN as string | undefined)
  if (!active) return
  document.documentElement.dataset.season = 'halloween'
  void import('./halloween.css')
}
