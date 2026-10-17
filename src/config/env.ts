/**
 * Configuración central del backend — único lugar donde vive la URL (checklist §40 de mobile).
 * Nada fuera de `src/api/client.ts` debe leer esto ni armar URLs del backend a mano.
 *
 * - `VITE_API_URL`: origen del backend, SIN `/api/v1` (lo agrega este archivo). Por defecto el
 *   backend de PRODUCCIÓN (`api.traelo-market.com`). Para desarrollar contra el de pruebas
 *   (`https://backend-fi7x.onrender.com`), ponerlo en `.env.local`.
 * - `VITE_API_KEY`: header `X-Api-Key` que exige el backend en /catalog, /checkout y /customers.
 *   No es un secreto (viaja en el bundle, igual que en el APK de la app): solo evita el scraping
 *   trivial. Por defecto la misma clave que la app, para que un build sin variables (p. ej. Vercel
 *   sin VITE_API_KEY) no quede con todas las peticiones rechazadas (403).
 */
const DEFAULT_API_URL = 'https://api.traelo-market.com'
const DEFAULT_API_KEY = 'dev-local-traelo-app-api-key-2026'

const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || DEFAULT_API_URL
const apiKey = (import.meta.env.VITE_API_KEY as string | undefined)?.trim() || DEFAULT_API_KEY

// Clave pública VAPID (Web Push) — no es secreta, viaja en el bundle igual que apiKey. Sin ella,
// simplemente no se ofrece activar notificaciones (ver services/pushService.ts).
const vapidPublicKey = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined)?.trim() ?? ''

// Analítica de comportamiento: activa por defecto solo en producción. Un servidor de desarrollo
// suele apuntar al backend real y no debe ensuciar los datos; VITE_ANALYTICS=true/false lo fuerza.
const analyticsFlag = (import.meta.env.VITE_ANALYTICS as string | undefined)?.trim()
const analyticsEnabled = analyticsFlag ? analyticsFlag === 'true' : import.meta.env.PROD

export const env = {
  apiBaseUrl: `${apiUrl.replace(/\/+$/, '')}/api/v1`,
  apiKey,
  vapidPublicKey,
  analyticsEnabled,
} as const
