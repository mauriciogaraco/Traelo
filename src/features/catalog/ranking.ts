import type {
  CatalogBusiness,
  CatalogBusinessStats,
  CatalogProduct,
  CatalogStats,
} from '../../types/backend/catalog';
import { fuzzyIncludes, normalize } from './search';

/**
 * Ordenar y filtrar resultados de búsqueda. Todo puro y local: opera sobre el catálogo y las
 * estadísticas que ya están en el teléfono (offline-first). Las estadísticas vienen del backend
 * (el servidor es la autoridad de popularidad y reseñas); aquí solo se ordena con ellas.
 */

// ── Relevancia ──────────────────────────────────────────────────────────────

/** 5 idéntico, 4 empieza igual, 3 alguna palabra empieza igual, 2 lo contiene, 1 solo calza con typos. */
export function relevanceScore(text: string, query: string): number {
  const name = normalize(text);
  const q = normalize(query);
  if (!q) return 0;
  if (name === q) return 5;
  if (name.startsWith(q)) return 4;
  if (name.split(/[^a-z0-9ñ]+/).some((word) => word.startsWith(q))) return 3;
  if (name.includes(q)) return 2;
  return fuzzyIncludes(text, query) ? 1 : 0;
}

/** Filtra por la consulta (nombre o categoría) y ordena por relevancia; a igual relevancia, mantiene el orden del catálogo. */
export function searchProducts(query: string, products: CatalogProduct[]): CatalogProduct[] {
  if (!query.trim()) return products;
  return products
    .map((product, index) => ({
      product,
      index,
      score: Math.max(
        relevanceScore(product.name, query),
        product.categoryName ? relevanceScore(product.categoryName, query) - 1.5 : 0,
      ),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.product);
}

export function searchBusinesses(query: string, businesses: CatalogBusiness[]): CatalogBusiness[] {
  if (!query.trim()) return businesses;
  return businesses
    .map((business, index) => ({
      business,
      index,
      score: Math.max(relevanceScore(business.name, query), relevanceScore(business.address, query) - 1),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.business);
}

// ── Calificación ────────────────────────────────────────────────────────────

/** Votos "virtuales" del promedio general: un negocio necesita varias reseñas para separarse de la media. */
export const RATING_PRIOR_VOTES = 5;
export const DEFAULT_RATING_PRIOR = 4;
/** Mínimo de reseñas para presumir a un negocio como "mejor valorado". */
export const TOP_RATED_MIN_REVIEWS = 3;

/**
 * Promedio ponderado (bayesiano): (n·media + m·C) / (n + m). Así un negocio con UNA reseña de 5.0
 * no le gana a uno con 4.8 en 60 reseñas: con pocas reseñas el puntaje tira hacia el promedio
 * general C, y con muchas manda la media real.
 */
export function bayesianRating(
  average: number,
  count: number,
  priorMean: number = DEFAULT_RATING_PRIOR,
  priorVotes: number = RATING_PRIOR_VOTES,
): number {
  if (count <= 0) return priorMean;
  return (count * average + priorVotes * priorMean) / (count + priorVotes);
}

/** Promedio general de todas las reseñas de todos los negocios (ponderado por cantidad). */
export function overallRatingMean(stats: CatalogStats | null): number {
  if (!stats) return DEFAULT_RATING_PRIOR;
  let total = 0;
  let votes = 0;
  for (const entry of Object.values(stats.businesses)) {
    if (entry.ratingAverage !== null && entry.ratingCount > 0) {
      total += entry.ratingAverage * entry.ratingCount;
      votes += entry.ratingCount;
    }
  }
  return votes > 0 ? total / votes : DEFAULT_RATING_PRIOR;
}

// ── Ordenamiento ────────────────────────────────────────────────────────────

export type ProductSort = 'relevance' | 'popular' | 'priceAsc' | 'priceDesc' | 'recentOffers';
export type BusinessSort = 'relevance' | 'popular' | 'rating' | 'recent' | 'alphabetical';

/** Sin criterio elegido: con búsqueda manda la relevancia; sin ella, lo más popular. */
export function effectiveSort<T extends string>(
  sort: T | 'auto',
  hasQuery: boolean,
): T | 'relevance' | 'popular' {
  if (sort === 'auto') return hasQuery ? 'relevance' : 'popular';
  // "Relevancia" sin texto de búsqueda no significa nada: cae a popularidad.
  if (sort === 'relevance' && !hasQuery) return 'popular';
  return sort;
}

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'es');

export function productUnits(product: CatalogProduct, stats: CatalogStats | null): number {
  return stats?.products[product.id]?.units ?? 0;
}

export function businessOrders(business: CatalogBusiness, stats: CatalogStats | null): number {
  return stats?.businesses[business.id]?.orders ?? 0;
}

/** Unidades vendidas en la última semana (Home: "Productos top") — distinto de productUnits (60 días, Buscar). */
export function productUnitsWeek(product: CatalogProduct, stats: CatalogStats | null): number {
  return stats?.products[product.id]?.unitsWeek ?? 0;
}

/** Pedidos completados en la última semana (Home: "Top Negocios") — distinto de businessOrders (60 días, Buscar). */
export function businessOrdersWeek(business: CatalogBusiness, stats: CatalogStats | null): number {
  return stats?.businesses[business.id]?.ordersWeek ?? 0;
}

function productPrice(product: CatalogProduct): number | null {
  return product.effectivePrice ?? product.price;
}

/** Devuelve una copia ordenada; `relevance` respeta el orden recibido (ya viene por relevancia). */
export function sortProducts(
  products: CatalogProduct[],
  sort: ProductSort,
  stats: CatalogStats | null,
): CatalogProduct[] {
  const list = [...products];
  switch (sort) {
    case 'relevance':
      return list;
    case 'popular': {
      // Unidades vendidas; si empatan (p. ej. los pedidos históricos son manuales y no traen
      // producto), primero los de negocios con más pedidos; y por último, el nombre.
      const orders = (product: CatalogProduct) => stats?.businesses[product.businessId]?.orders ?? 0;
      return list.sort(
        (a, b) => productUnits(b, stats) - productUnits(a, stats) || orders(b) - orders(a) || byName(a, b),
      );
    }
    case 'priceAsc':
    case 'priceDesc': {
      const direction = sort === 'priceAsc' ? 1 : -1;
      return list.sort((a, b) => {
        const pa = productPrice(a);
        const pb = productPrice(b);
        // Sin precio configurado siempre al final, sea cual sea la dirección.
        if (pa === null && pb === null) return byName(a, b);
        if (pa === null) return 1;
        if (pb === null) return -1;
        return (pa - pb) * direction || byName(a, b);
      });
    }
    case 'recentOffers': {
      // Sin oferta (o sin startsAt, catálogo cacheado de antes de este campo) siempre al final.
      const startedAt = (product: CatalogProduct) => {
        const value = product.offer?.startsAt;
        return value ? Date.parse(value) : null;
      };
      return list.sort((a, b) => {
        const sa = startedAt(a);
        const sb = startedAt(b);
        if (sa === null && sb === null) return byName(a, b);
        if (sa === null) return 1;
        if (sb === null) return -1;
        return sb - sa || byName(a, b);
      });
    }
  }
}

export function sortBusinesses(
  businesses: CatalogBusiness[],
  sort: BusinessSort,
  stats: CatalogStats | null,
): CatalogBusiness[] {
  const list = [...businesses];
  switch (sort) {
    case 'relevance':
      return list;
    case 'popular':
      return list.sort(
        (a, b) => businessOrders(b, stats) - businessOrders(a, stats) || byName(a, b),
      );
    case 'rating': {
      const prior = overallRatingMean(stats);
      const scoreOf = (business: CatalogBusiness): number | null => {
        const entry = stats?.businesses[business.id];
        if (!entry || entry.ratingAverage === null || entry.ratingCount <= 0) return null;
        return bayesianRating(entry.ratingAverage, entry.ratingCount, prior);
      };
      return list.sort((a, b) => {
        const sa = scoreOf(a);
        const sb = scoreOf(b);
        // Los negocios sin reseñas van DESPUÉS de todos los que sí tienen, por popularidad.
        if (sa === null && sb === null) {
          return businessOrders(b, stats) - businessOrders(a, stats) || byName(a, b);
        }
        if (sa === null) return 1;
        if (sb === null) return -1;
        return (
          sb - sa ||
          (stats?.businesses[b.id]?.ratingCount ?? 0) - (stats?.businesses[a.id]?.ratingCount ?? 0) ||
          businessOrders(b, stats) - businessOrders(a, stats) ||
          byName(a, b)
        );
      });
    }
    case 'recent': {
      // Sin joinedAt (catálogo cacheado de antes de este campo) siempre al final.
      const joinedAt = (business: CatalogBusiness) => (business.joinedAt ? Date.parse(business.joinedAt) : null);
      return list.sort((a, b) => {
        const ja = joinedAt(a);
        const jb = joinedAt(b);
        if (ja === null && jb === null) return byName(a, b);
        if (ja === null) return 1;
        if (jb === null) return -1;
        return jb - ja || byName(a, b);
      });
    }
    case 'alphabetical':
      return list.sort(byName);
  }
}

// ── Ranking semanal (solo Home: "Top Negocios" / "Productos top") ───────────
// Distinto del sort 'popular' de arriba (que usa la ventana general de 60 días, compartida con
// Buscar): estas dos son exclusivas del Home, así que no se agregan a ProductSort/BusinessSort
// para no tocar el selector de orden de Buscar.

export function sortBusinessesByWeeklyOrders(
  businesses: CatalogBusiness[],
  stats: CatalogStats | null,
): CatalogBusiness[] {
  return [...businesses].sort(
    (a, b) => businessOrdersWeek(b, stats) - businessOrdersWeek(a, stats) || byName(a, b),
  );
}

export function sortProductsByWeeklyUnits(
  products: CatalogProduct[],
  stats: CatalogStats | null,
): CatalogProduct[] {
  return [...products].sort(
    (a, b) => productUnitsWeek(b, stats) - productUnitsWeek(a, stats) || byName(a, b),
  );
}

// ── Filtros ─────────────────────────────────────────────────────────────────

export type ProductFilters = { categoryId: string | null; onlyOffers: boolean };
export type BusinessFilters = { onlyOpen: boolean };

export function filterProducts(products: CatalogProduct[], filters: ProductFilters): CatalogProduct[] {
  return products.filter(
    (product) =>
      (filters.categoryId === null || product.categoryId === filters.categoryId) &&
      (!filters.onlyOffers || product.offer !== null),
  );
}

export function filterBusinesses(businesses: CatalogBusiness[], filters: BusinessFilters): CatalogBusiness[] {
  return businesses.filter((business) => !filters.onlyOpen || (business.isOpenNow && business.acceptingOrders));
}

// ── Insignias ───────────────────────────────────────────────────────────────

/** Ids de los N primeros con métrica > 0 (los "populares" que llevan insignia). */
export function topIds<T extends { id: string }>(
  sorted: T[],
  metric: (item: T) => number,
  count = 3,
  minMetric = 1,
): Set<string> {
  const ids = new Set<string>();
  for (const item of sorted) {
    if (ids.size >= count) break;
    if (metric(item) >= minMetric) ids.add(item.id);
  }
  return ids;
}

export function ratingLabel(stats: CatalogBusinessStats | null | undefined): string | null {
  if (!stats || stats.ratingAverage === null || stats.ratingCount <= 0) return null;
  return `${stats.ratingAverage.toFixed(1)} (${stats.ratingCount})`;
}

/** De dónde sale el orden "populares" de una lista de productos (para no rotular como "más pedido" lo que no lo es). */
export type PopularitySource = 'units' | 'business' | 'none';

export function productPopularitySource(products: CatalogProduct[], stats: CatalogStats | null): PopularitySource {
  if (products.some((product) => productUnits(product, stats) > 0)) return 'units';
  if (products.some((product) => (stats?.businesses[product.businessId]?.orders ?? 0) > 0)) return 'business';
  return 'none';
}
