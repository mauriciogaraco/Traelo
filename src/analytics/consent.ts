/**
 * Control de la persona sobre el registro de uso en ESTE navegador. No hay un banner de
 * consentimiento: la política de privacidad lo explica y esta preferencia (más la señal «No rastrear»
 * del navegador) permite desactivarlo. Desactivar descarta lo pendiente y olvida el identificador.
 */

const OPT_OUT_KEY = 'traelo_analytics_optout'

let cached: boolean | null = null

export function isOptedOut(): boolean {
  if (cached === null) {
    try {
      cached = localStorage.getItem(OPT_OUT_KEY) === '1'
    } catch {
      cached = false
    }
  }
  return cached
}

export function writeOptOut(value: boolean): void {
  cached = value
  try {
    if (value) localStorage.setItem(OPT_OUT_KEY, '1')
    else localStorage.removeItem(OPT_OUT_KEY)
  } catch {
    // Sin almacenamiento: la preferencia vale solo para esta visita.
  }
}
