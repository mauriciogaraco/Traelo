const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export type CountdownParts = { days: number; hours: number; minutes: number; seconds: number; done: boolean }

/** Descompone los milisegundos que faltan. Con 0 o menos, `done` es true y todo queda en 0. */
export function countdownParts(msLeft: number): CountdownParts {
  if (!Number.isFinite(msLeft) || msLeft <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true }
  const total = Math.ceil(msLeft / SECOND) * SECOND
  return {
    days: Math.floor(total / DAY),
    hours: Math.floor((total % DAY) / HOUR),
    minutes: Math.floor((total % HOUR) / MINUTE),
    seconds: Math.floor((total % MINUTE) / SECOND),
    done: false,
  }
}

/** Milisegundos que faltan según el RELOJ DEL SERVIDOR (el del teléfono puede estar mal): `offsetMs` = servidor − teléfono. */
export function msUntil(startsAtIso: string, nowMs: number, offsetMs: number): number {
  return Date.parse(startsAtIso) - (nowMs + offsetMs)
}

const HAVANA = 'America/Havana'

function havanaDay(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: HAVANA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

/** "hoy a las 9:00 a. m." o "el 17 de octubre a las 9:00 a. m.", siempre en hora de La Habana. */
export function startLabel(startsAt: Date, now: Date): string {
  const time = new Intl.DateTimeFormat('es', { timeZone: HAVANA, hour: 'numeric', minute: '2-digit', hour12: true }).format(startsAt)
  if (havanaDay(startsAt) === havanaDay(now)) return `hoy a las ${time}`
  const day = new Intl.DateTimeFormat('es', { timeZone: HAVANA, day: 'numeric', month: 'long' }).format(startsAt)
  return `el ${day} a las ${time}`
}
