/**
 * Distancia legible y honesta ("a unos…"): es por calles y aproximada, no una promesa.
 * < 1 km en metros redondeados a 10 (450 m); desde 1 km con un decimal (1,8 km).
 */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return '';
  if (meters < 50) return 'muy cerca';
  if (meters < 1000) return `a unos ${Math.round(meters / 10) * 10} m`;
  const km = Math.round(meters / 100) / 10;
  return `a unos ${km.toLocaleString('es', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}
