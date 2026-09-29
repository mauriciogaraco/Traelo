/**
 * Configuración central del backend — único lugar donde vive la URL (checklist §40 de mobile).
 * Nada fuera de `src/api/client.ts` debe leer esto ni armar URLs del backend a mano.
 *
 * - `VITE_API_URL`: origen del backend, SIN `/api/v1` (lo agrega este archivo). Por defecto el
 *   backend de pruebas `backend-fi7x`, el mismo que usa hoy la app móvil.
 * - `VITE_API_KEY`: header `X-Api-Key` que exige el backend en /catalog, /checkout y /customers.
 *   No es un secreto (viaja en el bundle, igual que en el APK): solo evita el scraping trivial.
 *   Se define en Vercel / `.env.local`, nunca en el código.
 */
const DEFAULT_API_URL = 'https://backend-fi7x.onrender.com'

const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || DEFAULT_API_URL
const apiKey = (import.meta.env.VITE_API_KEY as string | undefined)?.trim() ?? ''

if (!apiKey && import.meta.env.DEV) {
  console.warn('[Tráelo] Falta VITE_API_KEY: el backend responderá 403. Ver .env.example.')
}

// Clave pública VAPID (Web Push) — no es secreta, viaja en el bundle igual que apiKey. Sin ella,
// simplemente no se ofrece activar notificaciones (ver services/pushService.ts).
const vapidPublicKey = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined)?.trim() ?? ''

export const env = {
  apiBaseUrl: `${apiUrl.replace(/\/+$/, '')}/api/v1`,
  apiKey,
  vapidPublicKey,
} as const
