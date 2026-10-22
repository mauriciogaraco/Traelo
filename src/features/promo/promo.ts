/** Ruta de la pantalla de la promoción "primera mensajería gratis". */
export const PROMO_PATH = '/promocion'

/** Un código de promoción es corto y de letras, números y guiones: cualquier otra cosa se ignora. */
const PROMO_CODE_PATTERN = /^[A-Za-z0-9-]{3,40}$/

/** Lee `?promo=` de la URL. null si no viene o no tiene forma de código. */
export function parsePromoParam(params: URLSearchParams): string | null {
  const raw = params.get('promo')?.trim()
  return raw && PROMO_CODE_PATTERN.test(raw) ? raw.toUpperCase() : null
}

/**
 * Código que se manda al servidor ahora: el guardado, pero solo si se compra en la localidad del enlace
 * (un cliente de Güira con un enlace viejo de San Antonio no manda un código que no puede aplicar).
 */
export function promoCodeToSend(saved: { code: string | null; cityCode: string | null }, activeCityCode: string): string | undefined {
  if (!saved.code) return undefined
  if (saved.cityCode && saved.cityCode !== activeCityCode) return undefined
  return saved.code
}

/** El servidor rechaza el código con un error `PROMO_*` (ciudad, cupos, primer pedido…). */
export function isPromoErrorCode(code: string): boolean {
  return code.startsWith('PROMO_')
}

/**
 * Destino de "Pide ahora": el Home de la localidad de la promoción con el código en el enlace. La
 * localidad viaja en `?ciudad=` (la web ya sabe fijarla desde ahí) y el código en `?promo=`.
 */
export function promoHomeHref(promo: { cityCode: string; code: string }): string {
  return `/?ciudad=${encodeURIComponent(promo.cityCode)}&promo=${encodeURIComponent(promo.code)}`
}

/** En qué estado vio la persona la pantalla de la promo (para el evento `promo_view`). */
export function promoViewState(promo: { upcoming: boolean; active: boolean; exhausted: boolean }): 'upcoming' | 'active' | 'exhausted' | 'inactive' {
  if (promo.upcoming) return 'upcoming'
  if (promo.active) return 'active'
  return promo.exhausted ? 'exhausted' : 'inactive'
}

/** La promoción terminó (apagada o agotada) y no es una cuenta regresiva: la pantalla de la promo manda al Home. */
export function isPromoClosed(promo: { upcoming: boolean; active: boolean }): boolean {
  return !promo.active && !promo.upcoming
}

const LANDING_KEY = 'traelo.promo.landing'

/**
 * ¿Es la primera llegada con este código en esta visita (pestaña)? Evita contar de nuevo el mismo enlace al
 * navegar o recargar. `storage` es sessionStorage (se inyecta para poder probarlo).
 */
export function isFirstPromoLanding(code: string, storage: Pick<Storage, 'getItem' | 'setItem'>): boolean {
  try {
    if (storage.getItem(LANDING_KEY) === code) return false
    storage.setItem(LANDING_KEY, code)
  } catch {
    // Sin sessionStorage: se cuenta una vez por carga de la app (peor caso: una vez más).
  }
  return true
}
