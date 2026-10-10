import {
  loginCustomer,
  logoutCustomer,
  refreshCustomerSession,
  registerCustomer,
  type RegisterInput,
} from '../api/auth'
import { resetAnalyticsIdentity, settleAnalytics, track } from '../analytics'
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
  return session.customer
}

/**
 * Renueva el access token. UN solo vuelo: si varias peticiones reciben 401 a la vez, todas
 * esperan la misma renovación (el refresh token rota; renovar dos veces en paralelo sería
 * pisar la sesión).
 *  - Devuelve el token nuevo, o null si la sesión ya no es recuperable (y la cierra).
 *  - Si falla por red/timeout/5xx LANZA: la sesión sigue siendo válida, no se cierra.
 */
export function refreshAccessToken(failedAccessToken?: string): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight

  // Otra petición ya renovó mientras esta esperaba: basta con usar el token vigente.
  if (tokens && failedAccessToken && tokens.accessToken !== failedAccessToken) {
    return Promise.resolve(tokens.accessToken)
  }

  const current = tokens
  if (!current) return Promise.resolve(null)

  refreshInFlight = (async () => {
    try {
      const fresh = await refreshCustomerSession(current.refreshToken)
      await persistTokens(fresh)
      return fresh.accessToken
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await endSession()
        return null
      }
      throw error
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}

/** Access token listo para usar (renovado antes si está por vencer) o null si no hay sesión. */
export async function getAccessToken(): Promise<string | null> {
  if (!tokens) return null
  if (tokens.accessTokenExpiresAt - Date.now() > REFRESH_MARGIN_MS) return tokens.accessToken

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
  const customer = await startSession(await loginCustomer(input))
  // flush: une el historial anónimo de este navegador a la cuenta de inmediato.
  track('login_completed', undefined, { flush: true })
  return customer
}

export async function registerAccount(input: RegisterInput): Promise<Customer> {
  const customer = await startSession(await registerCustomer(input))
  track('signup_completed', undefined, { flush: true })
  return customer
}

/** Máximo que se espera al servidor al cerrar sesión: con mala conexión no se deja a la persona esperando. */
const LOGOUT_SERVER_TIMEOUT_MS = 4000

/**
 * Cierra la sesión en este navegador (y la revoca en el servidor si hay red). Vuelve a invitado.
 * El cierre local NUNCA depende del servidor: si no responde en unos segundos, se cierra igual.
 */
export async function logout(): Promise<void> {
  // Lo pendiente se envía antes de perder la cuenta (con un tope: nunca retrasa el cierre).
  await settleAnalytics()
  const refreshToken = tokens?.refreshToken

  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, LOGOUT_SERVER_TIMEOUT_MS)
  })
  const revoke = Promise.allSettled([refreshToken ? logoutCustomer(refreshToken) : Promise.resolve()])
  await Promise.race([revoke, timeout])
  if (timer) clearTimeout(timer)

  await endSession()
  // La siguiente persona que use este dispositivo no hereda la identidad anónima de la anterior.
  resetAnalyticsIdentity()
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
