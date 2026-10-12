import {
  loginCustomer,
  logoutCustomer,
  refreshCustomerSession,
  registerCustomer,
  type RegisterInput,
} from '../api/auth'
import { ApiError } from '../api/ApiError'
import { setAuthHandler } from '../api/client'
import { getMyProfile } from '../api/customers'
import { authStorage } from '../storage/authStorage'
import { useFavoritesStore } from '../store/favoritesStore'
import { useSessionStore } from '../store/sessionStore'
import type { AuthSession, AuthTokens } from '../types/backend/auth'
import type { Customer } from '../types/backend/customer'

/**
 * Sesión OPCIONAL del cliente (igual que en la app móvil). Sin cuenta la web funciona igual
 * (GUEST); esto solo administra los tokens cuando la persona decide iniciar sesión.
 * Nunca loguear ni exponer los tokens.
 */
const TOKENS_KEY = 'traelo.auth.tokens'
const PROFILE_KEY = 'traelo.auth.profile'

/** Se renueva un poco ANTES de que venza, para no gastar un 401 en cada petición. */
const REFRESH_MARGIN_MS = 30_000

/** Candado entre pestañas: solo una renueva a la vez (ver `withCrossTabLock`). */
const REFRESH_LOCK = 'traelo-auth-refresh'

type StoredTokens = {
  accessToken: string
  accessTokenExpiresAt: number
  refreshToken: string
}

let tokens: StoredTokens | null = null
let refreshInFlight: Promise<string | null> | null = null

function toStored(fresh: AuthTokens): StoredTokens {
  return {
    accessToken: fresh.accessToken,
    accessTokenExpiresAt: Date.now() + fresh.accessTokenExpiresIn * 1000,
    refreshToken: fresh.refreshToken,
  }
}

async function persistTokens(fresh: AuthTokens): Promise<void> {
  const stored = toStored(fresh)
  tokens = stored
  await authStorage.setItem(TOKENS_KEY, JSON.stringify(stored))
}

async function persistProfile(customer: Customer): Promise<void> {
  await authStorage.setItem(PROFILE_KEY, JSON.stringify(customer))
}

function isStoredTokens(value: unknown): value is StoredTokens {
  const v = value as StoredTokens | null
  return (
    !!v &&
    typeof v.accessToken === 'string' &&
    typeof v.refreshToken === 'string' &&
    typeof v.accessTokenExpiresAt === 'number'
  )
}

/** Deja la web como invitado y borra todo rastro de la sesión (carrito y datos de invitado NO se tocan). */
async function endSession(): Promise<void> {
  tokens = null
  await Promise.all([authStorage.removeItem(TOKENS_KEY), authStorage.removeItem(PROFILE_KEY)])
  useFavoritesStore.getState().clear()
  useSessionStore.getState().setGuest()
}

async function startSession(session: AuthSession): Promise<Customer> {
  await persistTokens(session)
  await persistProfile(session.customer)
  // Los favoritos de OTRA sesión no deben sobrevivir. Las direcciones NO: viven en el navegador.
  useFavoritesStore.getState().clear()
  useSessionStore.getState().setAuthenticated(session.customer)
  // Pide al navegador que no borre el almacenamiento de la sesión por falta de espacio o de uso
  // (mejor esfuerzo; algunos navegadores lo ignoran).
  void navigator.storage?.persist?.().catch(() => undefined)
  return session.customer
}

/**
 * Los tokens guardados en el navegador: la fuente de verdad COMPARTIDA entre pestañas. El refresh
 * token rota en cada renovación, así que la copia en memoria de una pestaña puede estar vieja si
 * otra pestaña ya renovó.
 */
async function readStoredTokens(): Promise<StoredTokens | null> {
  try {
    const raw = await authStorage.getItem(TOKENS_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    return isStoredTokens(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Serializa la renovación entre TODAS las pestañas/ventanas del sitio (Web Locks). Sin soporte, se
 * sigue sin candado: igual se re-lee el almacenamiento antes de renovar.
 */
async function withCrossTabLock(task: () => Promise<string | null>): Promise<string | null> {
  const locks = typeof navigator === 'undefined' ? undefined : navigator.locks
  if (!locks || typeof locks.request !== 'function') return task()
  return await locks.request(REFRESH_LOCK, task)
}

async function renewTokens(failedAccessToken?: string): Promise<string | null> {
  // Otra pestaña pudo renovar mientras esta esperaba (o estuvo oculta mucho rato): se adoptan sus
  // tokens. Renovar con el refresh token VIEJO daría 401 pasados 2 min y cerraría la sesión de todas.
  const stored = await readStoredTokens()
  if (stored && (!tokens || stored.refreshToken !== tokens.refreshToken)) tokens = stored
  if (!tokens) return null
  if (tokens.accessToken !== failedAccessToken && tokens.accessTokenExpiresAt - Date.now() > REFRESH_MARGIN_MS) {
    return tokens.accessToken
  }

  const used = tokens
  try {
    const fresh = await refreshCustomerSession(used.refreshToken)
    await persistTokens(fresh)
    return fresh.accessToken
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      // ¿El 401 es porque otra pestaña rotó el token mientras tanto? Entonces la sesión sigue viva:
      // se adopta lo que guardó y NO se cierra. Solo si el token rechazado es el que está guardado
      // (nadie lo renovó) la sesión de verdad venció.
      const latest = await readStoredTokens()
      if (latest && latest.refreshToken !== used.refreshToken) {
        tokens = latest
        return latest.accessToken
      }
      await endSession()
      return null
    }
    throw error
  }
}

/**
 * Renueva el access token. UN solo vuelo: si varias peticiones reciben 401 a la vez, todas
 * esperan la misma renovación (el refresh token rota; renovar dos veces en paralelo sería
 * pisar la sesión). Entre pestañas la serializa un candado y se re-lee el almacenamiento.
 *  - Devuelve el token nuevo, o null si la sesión ya no es recuperable (y la cierra).
 *  - Si falla por red/timeout/5xx LANZA: la sesión sigue siendo válida, no se cierra.
 */
export function refreshAccessToken(failedAccessToken?: string): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight

  // Otra petición ya renovó mientras esta esperaba: basta con usar el token vigente.
  if (tokens && failedAccessToken && tokens.accessToken !== failedAccessToken) {
    return Promise.resolve(tokens.accessToken)
  }

  if (!tokens) return Promise.resolve(null)

  refreshInFlight = withCrossTabLock(() => renewTokens(failedAccessToken)).finally(() => {
    refreshInFlight = null
  })

  return refreshInFlight
}

/** Access token listo para usar (renovado antes si está por vencer) o null si no hay sesión. */
export async function getAccessToken(): Promise<string | null> {
  if (!tokens) return null
  if (tokens.accessTokenExpiresAt - Date.now() > REFRESH_MARGIN_MS) return tokens.accessToken
  // Con la pestaña oculta NO se renueva por adelantado: el navegador puede congelarla o cerrarla en
  // pleno vuelo, el servidor rotaría el token y la respuesta se perdería. Se renueva al volver (o
  // cuando el servidor responda 401 a una petición real).
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return tokens.accessToken

  try {
    return await refreshAccessToken()
  } catch {
    // Sin red para renovar: se intenta igual con el que hay (si ya venció, el servidor
    // responde 401 y el cliente HTTP vuelve a intentar la renovación).
    return tokens?.accessToken ?? null
  }
}

setAuthHandler({ getAccessToken, refresh: refreshAccessToken })

/**
 * Otra pestaña cambió los tokens guardados (renovó, inició o cerró sesión): esta pestaña se
 * sincroniza SIN tocar el almacenamiento (ya lo dejó la otra). `newValue` es el nuevo contenido de
 * la clave de tokens, o null si la borraron (cerraron sesión).
 */
export function applyStoredTokensChange(newValue: string | null): void {
  if (newValue === null) {
    if (tokens) {
      tokens = null
      useFavoritesStore.getState().clear()
      useSessionStore.getState().setGuest()
    }
    return
  }
  try {
    const parsed: unknown = JSON.parse(newValue)
    if (!isStoredTokens(parsed)) return
    const wasGuest = tokens === null
    tokens = parsed
    // Inició sesión en otra pestaña: esta aún es invitado; se carga su perfil.
    if (wasGuest) void hydrateAuth()
  } catch {
    // Valor ilegible: se ignora.
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === TOKENS_KEY) applyStoredTokensChange(event.newValue)
  })
}

/**
 * Lee la sesión guardada al abrir la web. NUNCA pide login: sin sesión → GUEST. Con sesión, la
 * web arranca ya como AUTHENTICATED con el perfil en caché (funciona sin conexión) y lo valida
 * en segundo plano.
 */
export async function hydrateAuth(): Promise<void> {
  const [rawTokens, rawProfile] = await Promise.all([
    authStorage.getItem(TOKENS_KEY),
    authStorage.getItem(PROFILE_KEY),
  ])

  let parsedTokens: unknown = null
  let cachedProfile: Customer | null = null
  try {
    parsedTokens = rawTokens ? JSON.parse(rawTokens) : null
    cachedProfile = rawProfile ? (JSON.parse(rawProfile) as Customer) : null
  } catch {
    parsedTokens = null
  }

  if (!isStoredTokens(parsedTokens)) {
    await endSession()
    return
  }

  tokens = parsedTokens
  if (cachedProfile) useSessionStore.getState().setAuthenticated(cachedProfile)

  try {
    const profile = await getMyProfile()
    await persistProfile(profile)
    useSessionStore.getState().setAuthenticated(profile)
  } catch (error) {
    // 401 sin renovación posible: endSession ya dejó la web como invitado. Un fallo de red se
    // ignora y se sigue con el perfil en caché; sin caché no hay nada que mostrar → invitado
    // (los tokens se conservan para la próxima visita).
    if (!cachedProfile && !(error instanceof ApiError && error.status === 401)) {
      useSessionStore.getState().setGuest()
    }
  }
}

export async function loginWithPassword(input: { phone: string; password: string }): Promise<Customer> {
  return startSession(await loginCustomer(input))
}

export async function registerAccount(input: RegisterInput): Promise<Customer> {
  return startSession(await registerCustomer(input))
}

/** Máximo que se espera al servidor al cerrar sesión: con mala conexión no se deja a la persona esperando. */
const LOGOUT_SERVER_TIMEOUT_MS = 4000

/**
 * Cierra la sesión en este navegador (y la revoca en el servidor si hay red). Vuelve a invitado.
 * El cierre local NUNCA depende del servidor: si no responde en unos segundos, se cierra igual.
 */
export async function logout(): Promise<void> {
  const refreshToken = tokens?.refreshToken

  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, LOGOUT_SERVER_TIMEOUT_MS)
  })
  const revoke = Promise.allSettled([refreshToken ? logoutCustomer(refreshToken) : Promise.resolve()])
  await Promise.race([revoke, timeout])
  if (timer) clearTimeout(timer)

  await endSession()
}

/** Solo para tests. */
export function __resetAuthForTests(): void {
  tokens = null
  refreshInFlight = null
}

/** Solo para tests: fija tokens sin pasar por login. */
export function __setTokensForTests(value: AuthTokens | null): void {
  tokens = value ? toStored(value) : null
}
