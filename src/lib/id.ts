/**
 * Id local (clientRequestId del checkout — idempotencia). Igual que `utils/id.ts` de mobile: único
 * por intento y estable entre reintentos del mismo intento (quien llama lo genera una vez y lo reusa).
 */
export function generateLocalId(prefix = 'web'): string {
  const random = Math.random().toString(36).slice(2, 10)
  return `${prefix}_${Date.now().toString(36)}_${random}`
}
