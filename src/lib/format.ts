/** Formatea un precio en USD, ej: 15 → "$15", 15.5 → "$15.50". */
export function formatPrice(value: number): string {
  if (Number.isInteger(value)) return `$${value}`
  return `$${value.toFixed(2)}`
}

/** Solo el valor con símbolo $, sin decimales si es entero. */
export function formatAmount(value: number): string {
  if (Number.isInteger(value)) return `$${value}`
  return `$${value.toFixed(2)}`
}

/** Convierte "19:30" → "7:30 pm". */
export function formatTime12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'pm' : 'am'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m || 0).padStart(2, '0')} ${period}`
}

/** Fecha legible, ej: "30 may 2026, 14:05". */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
