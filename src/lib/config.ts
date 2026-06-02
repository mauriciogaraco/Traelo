/** Configuración del MVP de Tráelo. */

/** Tarifa de mensajería (CUP). Fija, pero GRATIS por lanzamiento (se muestra tachada). */
export const MESSAGING_FEE = 300

/** Mientras sea true, la mensajería es gratis (tarifa tachada). */
export const MESSAGING_FREE = true

/**
 * Telegram Bot API.
 * ⚠️ Al no haber backend, el token viaja en el bundle del cliente: cualquiera
 * puede leerlo e inspeccionarlo. Aceptable para un MVP de lanzamiento, pero
 * conviene mover el envío a una función serverless / backend antes de producción.
 */
export const TELEGRAM_BOT_TOKEN = '8881629308:AAFNmGVPIGK41ZbRPFQ6z0p-42ZIWZUc7As'
export const TELEGRAM_CHAT_ID = '-5206362177'
