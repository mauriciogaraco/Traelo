import type { Business } from '../types'

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** ¿El negocio está abierto ahora mismo? */
export function isOpenNow(business: Business, now: Date = new Date()): boolean {
  if (business.status === 'cerrado') return false
  const cur = now.getHours() * 60 + now.getMinutes()
  const day = now.getDay()
  const check = (s: typeof business.schedule) =>
    s.days.includes(day) && cur >= toMinutes(s.open) && cur < toMinutes(s.close)
  return check(business.schedule) || (business.scheduleExtra ? check(business.scheduleExtra) : false)
}

/** Texto corto del horario, ej: "Lun–Sáb · 9:00 am – 5:00 pm". */
export function scheduleLabel(business: Business): string {
  return business.schedule.label
}

/** Hora a partir de la cual ya no se toman pedidos por hoy (9:00 pm). */
export const ORDERS_CUTOFF_HOUR = 21

/**
 * Después de las 9:00 pm (y hasta medianoche) ya no se aceptan pedidos nuevos
 * por hoy. Las mensajerías pendientes sí se entregan; el cliente puede seguir
 * navegando y ver sus pedidos.
 */
export function ordersClosedForToday(now: Date = new Date()): boolean {
  return now.getHours() >= ORDERS_CUTOFF_HOUR
}
