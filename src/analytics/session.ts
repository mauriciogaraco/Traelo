/**
 * Inicio de sesión para la analítica (`session_started`): una vez por pestaña/visita, con de dónde llegó la
 * persona. Cuenta también a quien abre la web y se va sin tocar nada (lo único que lo hace visible).
 *
 * Privacidad: del referrer solo se guarda el DOMINIO (nunca la ruta ni la búsqueda) y de la dirección solo la
 * primera parte de la ruta y las etiquetas utm_* (texto corto de campaña). Nada de ids, teléfonos ni cuentas.
 */

export const SESSION_STARTED_KEY = 'traelo_session_started'
const MAX_UTM_LENGTH = 60
const UTM_KEYS = { utm_source: 'utmSource', utm_medium: 'utmMedium', utm_campaign: 'utmCampaign' } as const

export type SessionStartProperties = Record<string, string | boolean>

function hostOf(value: string): string | null {
  try {
    return new URL(value).hostname.replace(/^www\./, '').toLowerCase() || null
  } catch {
    return null
  }
}

/** Propiedades de `session_started`: entrada (primer tramo de la ruta), referrer externo, utm y si vino con `?ciudad=`. */
export function sessionStartProperties(input: { href: string; referrer: string; ownHost: string }): SessionStartProperties {
  const properties: SessionStartProperties = {}
  let url: URL
  try {
    url = new URL(input.href)
  } catch {
    return properties
  }
  const firstSegment = url.pathname.split('/').filter(Boolean)[0]
  properties.entry = firstSegment ? firstSegment.slice(0, 30).toLowerCase() : 'home'

  const referrerHost = input.referrer ? hostOf(input.referrer) : null
  const ownHost = input.ownHost.replace(/^www\./, '').toLowerCase()
  if (referrerHost && referrerHost !== ownHost) properties.referrer = referrerHost

  for (const [param, key] of Object.entries(UTM_KEYS)) {
    const value = url.searchParams.get(param)?.trim().toLowerCase().slice(0, MAX_UTM_LENGTH)
    if (value) properties[key] = value
  }
  if (url.searchParams.has('ciudad')) properties.viaCityLink = true
  return properties
}

type SessionStorageLike = { getItem(key: string): string | null; setItem(key: string, value: string): void }

/**
 * ¿Falta registrar el inicio de ESTA sesión? Lo marca como registrado. Recargar la pestaña o el doble montaje
 * de React no lo repiten; una pestaña nueva (otra sesión) sí lo registra. Sin almacenamiento: se registra.
 */
export function claimSessionStart(storage: SessionStorageLike | null, sessionId: string): boolean {
  try {
    if (storage?.getItem(SESSION_STARTED_KEY) === sessionId) return false
    storage?.setItem(SESSION_STARTED_KEY, sessionId)
  } catch {
    // sin almacenamiento: se registra igual
  }
  return true
}
