/**
 * Valoración con estrellas: de 1.0 a 5.0 con un decimal (paso 0.1). Funciones puras, sin UI,
 * para poder probar la lógica de relleno y de toque/arrastre sin renderizar nada.
 */

export const STAR_COUNT = 5;
export const MIN_RATING = 1;
export const MAX_RATING = 5;
export const RATING_STEP = 0.1;

/** Redondea a un decimal sin arrastrar ruido de coma flotante (4.699999 → 4.7). */
export function roundRating(value: number): number {
  return Math.round(value * 10) / 10;
}

export function clampRating(value: number): number {
  return Math.min(MAX_RATING, Math.max(MIN_RATING, roundRating(value)));
}

/**
 * Convierte la posición del dedo (x, en px dentro del control de ancho `width`) en un rating.
 * Cada estrella ocupa width / 5: tocar a mitad de la 4ª estrella da 3.5. Fuera del control se
 * limita al rango (arrastrar más allá de los bordes da 1.0 o 5.0). Ancho inválido → mínimo.
 */
export function positionToRating(x: number, width: number): number {
  if (!Number.isFinite(x) || !Number.isFinite(width) || width <= 0) return MIN_RATING;
  return clampRating((x / width) * STAR_COUNT);
}

/**
 * Relleno de cada una de las 5 estrellas (0 = vacía, 1 = llena, 0.7 = 70% de ancho) para un
 * rating dado: 4.7 → [1, 1, 1, 1, 0.7]. Un valor ausente (todavía sin valorar) vacía todas.
 */
export function ratingToStarFills(rating: number | null | undefined): number[] {
  if (rating == null || !Number.isFinite(rating)) return Array<number>(STAR_COUNT).fill(0);
  const value = Math.min(MAX_RATING, Math.max(0, rating));
  return Array.from({ length: STAR_COUNT }, (_, index) => {
    const fill = Math.min(1, Math.max(0, value - index));
    return roundRating(fill);
  });
}

/** "4.7 / 5" — siempre con un decimal, para que 5 se lea "5.0 / 5" y no cambie de ancho. */
export function formatRating(rating: number): string {
  return `${roundRating(rating).toFixed(1)} / ${MAX_RATING}`;
}
