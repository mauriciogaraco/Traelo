/** Configuración del MVP de Tráelo. */

/** WhatsApp de soporte/atención al cliente (formato internacional, sin +). También es el número de
 *  contacto telefónico: es el mismo que ya usa Tráelo hoy, no hay uno separado para llamadas. */
export const SUPPORT_WHATSAPP = '5358365388'
export const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_WHATSAPP}`
export const SUPPORT_PHONE_LABEL = '+53 5 8365388'

export type SupportContact = {
  /** Formato internacional, sin "+". */
  whatsapp: string
  whatsappUrl: string
  /** Para mostrar. */
  phoneLabel: string
}

/** Contacto de soporte de Güira de Melena: el de siempre (y el de cualquier localidad sin uno propio). */
const DEFAULT_SUPPORT: SupportContact = { whatsapp: SUPPORT_WHATSAPP, whatsappUrl: SUPPORT_WHATSAPP_URL, phoneLabel: SUPPORT_PHONE_LABEL }

/** Soporte propio de una localidad, por su `City.code`. Las que no están aquí usan el de Güira. */
const SUPPORT_BY_CITY: Record<string, SupportContact> = {
  'san-antonio-de-los-banos': { whatsapp: '5358202510', whatsappUrl: 'https://wa.me/5358202510', phoneLabel: '+53 5 8202510' },
}

/** WhatsApp y teléfono de soporte según la localidad desde la que se compra (ayuda, recuperar contraseña). */
export function supportContactFor(cityCode: string | null | undefined): SupportContact {
  return (cityCode && SUPPORT_BY_CITY[cityCode]) || DEFAULT_SUPPORT
}

/** URL pública de la web (para compartir / QR). */
export const SITE_URL = 'https://www.traelo-market.com'

/** Tasa de cambio USD → CUP, usada para cobrar en CUP el "Servicio Tráelo" de productos en USD. */
export const USD_EXCHANGE_RATE = 700
