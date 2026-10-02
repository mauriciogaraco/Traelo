/** Teléfonos de Cuba — misma regla que `PhoneField` de la app móvil. */
export const CUBAN_COUNTRY_CODE = '53'
export const CUBAN_PHONE_DIGITS = 8

/**
 * Deja solo dígitos y, si vienen con el 53 de Cuba pegado adelante (p.ej. al pegar "+53 58365388"),
 * lo quita para no duplicarlo: siempre quedan los 8 dígitos locales.
 */
export function sanitizeCubanPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '')
  if (digits.length > CUBAN_PHONE_DIGITS && digits.startsWith(CUBAN_COUNTRY_CODE)) {
    digits = digits.slice(CUBAN_COUNTRY_CODE.length)
  }
  return digits.slice(0, CUBAN_PHONE_DIGITS)
}

/** Número completo para el backend (`+53XXXXXXXX`), armado recién al enviar. */
export function toCubanE164(digits: string): string {
  return `+${CUBAN_COUNTRY_CODE}${sanitizeCubanPhone(digits)}`
}
