/** Longitud máxima del texto buscado que se envía. */
export const MAX_QUERY_LENGTH = 100

/**
 * ¿El texto parece un dato personal (correo o teléfono)? Un buscador recibe de todo: alguien puede
 * escribir su número. Se detecta por forma y, si lo es, el texto no se envía. (El backend aplica la
 * misma regla como segunda barrera.)
 */
export function looksLikePersonalData(text: string): boolean {
  if (text.includes('@')) return true
  return text.replace(/\D/g, '').length >= 7
}

export type QueryProperties = {
  query: string | null
  queryRedacted?: true
  queryLength?: number
}

/**
 * Propiedades del texto buscado para el evento: normalizado (sin espacios de más y en minúsculas, para
 * poder agrupar "Pizza " y "pizza") o, si parece un dato personal, solo que fue redactado.
 */
export function searchQueryProperties(rawQuery: string): QueryProperties {
  const query = rawQuery.trim().replace(/\s+/g, ' ')
  if (looksLikePersonalData(query)) return { query: null, queryRedacted: true, queryLength: query.length }
  return { query: query.toLowerCase().slice(0, MAX_QUERY_LENGTH) }
}
