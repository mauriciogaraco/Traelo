import type { Business } from '../types'

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** En Tráelo Familia los negocios no tienen horario restringido — siempre abiertos. */
export function isOpenNow(business: Business, now: Date = new Date()): boolean {
  if (business.status === 'cerrado') return false
  const { schedule } = business
  if (!schedule) return true
  if (!schedule.days.includes(now.getDay())) return false
  const cur = now.getHours() * 60 + now.getMinutes()
  return cur >= toMinutes(schedule.open) && cur < toMinutes(schedule.close)
}

export function scheduleLabel(business: Business): string {
  return business.schedule?.label ?? ''
}

export const ORDERS_CUTOFF_HOUR = 21

export function ordersClosedForToday(_now: Date = new Date()): boolean {
  return false
}
